import {onObjectFinalized} from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";

admin.initializeApp();

// ── 환경변수 (.env에서 자동으로 읽어옴)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

// 5MB 기준: sendPhoto 한도
const PHOTO_SIZE_LIMIT = 5 * 1024 * 1024;

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
