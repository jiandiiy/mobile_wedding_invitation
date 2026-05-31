import {onObjectFinalized} from "firebase-functions/storage";
import {HttpsOptions, onRequest} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";
import * as express from "express";
import * as admin from "firebase-admin";
import * as axios from "axios";
import FormData from "form-data";
import {v4 as uuidv4} from "uuid";

const telegramBotToken = defineString("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineString("TELEGRAM_CHAT_ID");

admin.initializeApp();

const functionsConfig = {
  memory: "512MiB" as unknown as HttpsOptions["memory"],
  timeoutSeconds: 300,
  region: "asia-northeast1",
};

// ============================================================================
// Types
// ============================================================================

interface ParsedFormData {
  fields: Record<string, string>;
  files: Array<{
    fieldName: string;
    filename: string;
    buffer: Buffer;
    contentType: string;
  }>;
}

// ============================================================================
// Multipart Parser
// ============================================================================

const parseMultipart = (
  bodyBuffer: Buffer,
  boundary: string,
): ParsedFormData => {
  const fields: Record<string, string> = {};
  const files: Array<{
    fieldName: string;
    filename: string;
    buffer: Buffer;
    contentType: string;
  }> = [];

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const crlfBuffer = Buffer.from("\r\n");

  let pos = 0;

  while (pos < bodyBuffer.length) {
    const boundaryPos = bodyBuffer.indexOf(boundaryBuffer, pos);
    if (boundaryPos === -1) break;

    pos = boundaryPos + boundaryBuffer.length;

    if (
      bodyBuffer[pos] === 45 &&
      bodyBuffer[pos + 1] === 45
    ) {
      break;
    }

    if (bodyBuffer[pos] === 13 && bodyBuffer[pos + 1] === 10) {
      pos += 2;
    } else {
      continue;
    }

    const crlfPos = bodyBuffer.indexOf(crlfBuffer, pos);
    if (crlfPos === -1) break;

    const headerEnd = bodyBuffer.indexOf(
      Buffer.from("\r\n\r\n"),
      pos,
    );
    if (headerEnd === -1) break;

    const headers = bodyBuffer
      .subarray(pos, headerEnd)
      .toString("utf-8");

    pos = headerEnd + 4;

    const contentDispMatch = headers.match(
      /Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i,
    );
    if (!contentDispMatch) continue;

    const fieldName = contentDispMatch[1];
    const filename = contentDispMatch[2];

    const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
    const contentType = contentTypeMatch ?
      contentTypeMatch[1].trim() :
      "application/octet-stream";

    const nextBoundaryPos = bodyBuffer.indexOf(
      boundaryBuffer,
      pos,
    );
    if (nextBoundaryPos === -1) break;

    let dataEnd = nextBoundaryPos;
    if (
      bodyBuffer[dataEnd - 2] === 13 &&
      bodyBuffer[dataEnd - 1] === 10
    ) {
      dataEnd -= 2;
    }

    const data = bodyBuffer.subarray(pos, dataEnd);

    if (filename) {
      files.push({
        fieldName,
        filename: filename ?? "unknown",
        buffer: Buffer.from(data) as Buffer,
        contentType,
      });
      console.log(
        `📄 파일: ${filename} (${data.length} bytes, ${contentType})`,
      );
    } else {
      const value = data.toString("utf-8");
      fields[fieldName] = value;
      console.log(`📝 필드: ${fieldName} = ${value}`);
    }

    pos = nextBoundaryPos;
  }

  return {fields, files};
};

// ============================================================================
// Helper Functions
// ============================================================================

const inferContentType = (buffer: Buffer): string => {
  if (buffer.length < 4) {
    return "application/octet-stream";
  }

  const hex = buffer.subarray(0, 4).toString("hex");

  if (hex.startsWith("ffd8ff")) {
    return "image/jpeg";
  }
  if (hex === "89504e47") {
    return "image/png";
  }
  if (hex.startsWith("47494638")) {
    return "image/gif";
  }
  if (buffer.length > 12 && buffer.toString("utf-8", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (buffer.length > 8 && buffer.toString("utf-8", 4, 8) === "ftyp") {
    return "video/mp4";
  }
  if (hex === "00000020" || hex === "00000018") {
    return "video/quicktime";
  }

  return "application/octet-stream";
};

const getFileType = (mimeType: string): "image" | "video" =>
  mimeType.startsWith("image/") ? "image" : "video";

// ============================================================================
// Upload Handler
// ============================================================================

async function processUpload(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  console.log("🔥 === processUpload 함수 실행 시작 ===");
  let responseSent = false;

  const sendResponse = (
    status: number,
    data: Record<string, unknown> | string,
  ) => {
    if (responseSent) {
      return;
    }
    responseSent = true;
    if (typeof data === "string") {
      res.status(status).send(data);
    } else {
      res.status(status).json(data);
    }
  };

  try {
    console.log("📨 요청 수신");
    console.log(`📋 Content-Type: ${req.headers["content-type"]}`);

    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      sendResponse(400, {error: "Invalid Content-Type"});
      return;
    }

    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      sendResponse(400, {error: "Missing boundary"});
      return;
    }

    const boundary = boundaryMatch[1];
    console.log(`🔍 Boundary: ${boundary}`);

    const bodyBuffer = req.body as Buffer;
    const parsed = parseMultipart(bodyBuffer, boundary);
    console.log("✅ 파싱 완료");
    console.log(`📊 파일 개수: ${parsed.files.length}`);

    const weddingId = parsed.fields.weddingId;
    const guestName = parsed.fields.guestName;

    if (!weddingId || !guestName) {
      sendResponse(400, {error: "Missing weddingId or guestName"});
      return;
    }

    if (parsed.files.length === 0) {
      sendResponse(400, {error: "No file uploaded"});
      return;
    }

    console.log(
      `🎯 결혼식: ${weddingId}, 게스트: ${guestName}, 파일: ${parsed.files.length}개`,
    );

    const bucket = admin.storage().bucket();
    const db = admin.firestore();
    const guestUploadRef = db
      .collection("weddings")
      .doc(weddingId)
      .collection("guestUploads");

    console.log("🔍 기존 업로드 확인 중...");
    const existingSnapshot = await guestUploadRef
      .where("guestName", "==", guestName)
      .limit(1)
      .get();

    const existingUploadId = existingSnapshot.empty ?
      null :
      existingSnapshot.docs[0].id;
    const existingData = existingSnapshot.empty ?
      null :
      existingSnapshot.docs[0].data();
    const existingFiles = (
      existingData?.files as Array<{
        id: string;
        name: string;
        size: number;
        type: string;
        storagePath: string;
      }>
    ) || [];

    if (existingUploadId) {
      console.log(`🔄 기존 업로드: ${existingUploadId}`);
    } else {
      console.log("🆕 새 업로드 생성");
    }

    console.log(`📤 ${parsed.files.length}개 파일 저장 중...`);
    const uploadPromises = parsed.files.map(
      async ({filename, buffer, contentType: mimeType}) => {
        const finalContentType = mimeType === "application/octet-stream" ?
          inferContentType(buffer) :
          mimeType;

        const storagePath = `guest-snaps/${weddingId}/${filename}`;

        try {
          await bucket.file(storagePath).save(buffer, {
            metadata: {
              contentType: finalContentType,
              metadata: {
                guestName: String(guestName),
                weddingId: String(weddingId),
                uploadedAt: new Date().toISOString(),
              },
            },
          });
          console.log(`✅ ${filename}`);

          return {storagePath, filename, buffer, finalContentType};
        } catch (err) {
          console.error(`❌ 저장 실패: ${filename}`, err);
          throw err;
        }
      },
    );

    const uploadedFiles = await Promise.all(uploadPromises);

    const fileId = uuidv4();
    const now = admin.firestore.Timestamp.now();
    const uploadId = existingUploadId || fileId;

    const newFiles = uploadedFiles.map((file) => ({
      id: uuidv4(),
      name: file.filename,
      size: file.buffer.length,
      type: getFileType(file.finalContentType),
      storagePath: file.storagePath,
    }));

    console.log("💾 Firestore 저장 중...");

    try {
      if (existingUploadId) {
        await guestUploadRef.doc(uploadId).update({
          fileCount: existingFiles.length + newFiles.length,
          files: [...existingFiles, ...newFiles],
        });
      } else {
        await guestUploadRef.doc(uploadId).set({
          id: uploadId,
          guestName: guestName,
          guestPhone: null,
          createdAt: now,
          fileCount: newFiles.length,
          files: newFiles,
        });
      }

      console.log(`🎉 ${newFiles.length}개 파일 저장 완료`);
    } catch (err) {
      console.error("❌ Firestore 저장 실패:", err);
      throw err;
    }

    sendResponse(200, {
      success: true,
      message: "Upload successful",
      uploadId: uploadId,
      fileCount: newFiles.length,
    });
  } catch (err) {
    console.error("❌ 에러:", err);
    if (!responseSent) {
      res.status(500).json({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ============================================================================
// Express App Setup
// ============================================================================

const uploadApp = express.default();

uploadApp.use(express.raw({type: "multipart/form-data", limit: "500mb"}));

uploadApp.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Max-Age", "3600");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  },
);

uploadApp.post(
  "/guestUploadApi",
  (req: express.Request, res: express.Response) => {
    processUpload(req, res);
  },
);

uploadApp.post("/", (req: express.Request, res: express.Response) => {
  processUpload(req, res);
});

export const guestUploadApi = onRequest(
  functionsConfig as HttpsOptions,
  uploadApp,
);

// ============================================================================
// Storage Trigger - Telegram Notification
// ============================================================================

export const onGuestUpload = onObjectFinalized(
  {
    bucket: "mobile-wedding-invitatio-d2312.firebasestorage.app",
    region: "asia-northeast1",
  },
  async (event) => {
    const filePath = event.data.name;

    if (!filePath.startsWith("guest-snaps/")) {
      console.log("📁 guest-snaps가 아닙니다. 스킵합니다.");
      return;
    }

    try {
      console.log(`📤 Telegram 전송: ${filePath}`);

      const botToken = telegramBotToken.value();
      const chatIdStr = telegramChatId.value();
      const chatId = parseInt(chatIdStr, 10);

      if (!botToken || !chatIdStr || isNaN(chatId)) {
        console.error("❌ Telegram 파라미터 누락");
        return;
      }

      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      const [fileBuffer] = await file.download();
      const [metadata] = await file.getMetadata();

      const fileSize = metadata.size || 0;
      console.log(`📦 ${fileSize} bytes`);

      const contentType = metadata.contentType || "";
      const parts = filePath.split("/");
      const filename = parts[parts.length - 1];
      const guestName = (metadata.metadata?.guestName as string | undefined) ||
        "Unknown Guest";

      const caption = `🎉 Guest Snap from ${guestName}`;

      if (contentType.startsWith("image/")) {
        const form = new FormData();
        form.append("chat_id", String(chatId));
        form.append("caption", caption);
        form.append("photo", fileBuffer, {filename});

        await axios.default.post(
          `https://api.telegram.org/bot${botToken}/sendPhoto`,
          form,
          {headers: form.getHeaders()},
        );
        console.log("📸 이미지 전송 완료");
      } else if (contentType.startsWith("video/")) {
        const form = new FormData();
        form.append("chat_id", String(chatId));
        form.append("caption", caption);
        form.append("video", fileBuffer, {filename});

        await axios.default.post(
          `https://api.telegram.org/bot${botToken}/sendVideo`,
          form,
          {headers: form.getHeaders()},
        );
        console.log("🎬 영상 전송 완료");
      } else {
        const form = new FormData();
        form.append("chat_id", String(chatId));
        form.append("caption", caption);
        form.append("document", fileBuffer, {filename});

        await axios.default.post(
          `https://api.telegram.org/bot${botToken}/sendDocument`,
          form,
          {headers: form.getHeaders()},
        );
        console.log("📄 문서 전송 완료");
      }

      console.log(`✅ Telegram 완료: ${filePath}`);
    } catch (error) {
      console.error("❌ Telegram 에러:", error);
    }
  },
);
