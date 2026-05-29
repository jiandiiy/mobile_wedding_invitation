import {onObjectFinalized} from "firebase-functions/v2/storage";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express from "express";
import multer from "multer";
import cors from "cors";

admin.initializeApp();

// Express 앱 설정
const app = express();
app.use(cors({origin: true}));
const upload = multer({storage: multer.memoryStorage()});

// ── 환경변수 (.env에서 자동으로 읽어옴)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET ?? "";

// 5MB 기준: sendPhoto 한도
const PHOTO_SIZE_LIMIT = 5 * 1024 * 1024;

// ── HTTP 엔드포인트: 프론트에서 파일 업로드
app.post(
  "/api/guest-upload",
  upload.single("file"),
  async (req: express.Request, res: express.Response) => {
    try {
      const {weddingId, guestName} = req.body;
      const file = req.file;

      // 유효성 검사
      if (!weddingId || !guestName || !file) {
        return res.status(400).json({error: "Missing required fields"});
      }

      // 파일 경로: guest-snaps/{weddingId}/{timestamp}-{fileName}
      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `guest-snaps/${weddingId}/${timestamp}-${sanitizedFileName}`;

      // Firebase Storage에 업로드
      const bucket = admin.storage().bucket(FIREBASE_STORAGE_BUCKET);
      const fileRef = bucket.file(filePath);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            guestName,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      console.log(`✅ 파일 업로드 완료: ${filePath} (by ${guestName})`);
      return res.status(200).json({success: true, filePath});
    } catch (error) {
      console.error("❌ 업로드 실패:", error);
      return res.status(500).json({error: "Upload failed"});
    }
  }
);

export const guestUploadApi = onRequest(
  {region: "asia-northeast1", cors: true},
  app
);

// ── Storage 트리거: 파일 업로드되면 자동으로 텔레그램으로 전송
export const onGuestUpload = onObjectFinalized(
  {region: "asia-northeast1"},
  async (event) => {
    const object = event.data;
    const filePath = object.name ?? "";
    const contentType = object.contentType ?? "application/octet-stream";
    const fileName = filePath.split("/").pop() ?? "unknown";

    // 하객 스냅 경로만 처리
    if (!filePath.includes("guest-snaps")) return null;

    console.log(`📥 업로드 감지: ${fileName}`);

    // 1. Firebase Storage에서 파일 다운로드
    const bucket = admin.storage().bucket(object.bucket);
    const [fileBuffer] = await bucket.file(filePath).download();

    // 2. 텔레그램 전송
    const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
    const isImage = contentType.startsWith("image/");
    const isVideo = contentType.startsWith("video/");
    const isLargeFile = fileBuffer.length > PHOTO_SIZE_LIMIT; // 5MB 초과 여부

    const blob = new Blob([Buffer.from(fileBuffer)], {type: contentType});

    if (isImage && !isLargeFile) {
      // 이미지 5MB 이하: sendPhoto (인라인 미리보기 O)
      const form = new FormData();
      form.append("chat_id", TELEGRAM_CHAT_ID);
      form.append("photo", blob, fileName);
      form.append("caption", `📸 새 사진이 업로드됐어요!\n📁 ${fileName}`);
      await fetch(`${apiBase}/sendPhoto`, {method: "POST", body: form});
    } else if (isImage && isLargeFile) {
      // 이미지 5MB 초과: sendDocument fallback (50MB까지, 미리보기 없음)
      console.log(`⚠️ 5MB 초과 (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB) → sendDocument로 전환`);
      const form = new FormData();
      form.append("chat_id", TELEGRAM_CHAT_ID);
      form.append("document", blob, fileName);
      form.append("caption", `📸 새 사진이 업로드됐어요! (원본 고화질)\n📁 ${fileName}`);
      await fetch(`${apiBase}/sendDocument`, {method: "POST", body: form});
    } else if (isVideo) {
      // 영상: sendVideo (50MB까지)
      const form = new FormData();
      form.append("chat_id", TELEGRAM_CHAT_ID);
      form.append("video", blob, fileName);
      form.append("caption", `🎥 새 영상이 업로드됐어요!\n📁 ${fileName}`);
      await fetch(`${apiBase}/sendVideo`, {method: "POST", body: form});
    } else {
      // 기타 파일: sendDocument
      const form = new FormData();
      form.append("chat_id", TELEGRAM_CHAT_ID);
      form.append("document", blob, fileName);
      form.append("caption", `📎 새 파일이 업로드됐어요!\n📁 ${fileName}`);
      await fetch(`${apiBase}/sendDocument`, {method: "POST", body: form});
    }

    console.log("✅ 텔레그램 전송 완료");
    return null;
  }
);
