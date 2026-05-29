import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
});

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CORS 설정
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite 개발 서버
      'http://localhost:3000',
      'http://localhost:3001',
      // 배포 후 실제 도메인 추가
    ],
    credentials: true,
  })
);

app.use(express.json());

/**
 * POST /api/guest-upload
 * 게스트 파일 업로드 (Firebase Storage에 저장)
 *
 * Body:
 * - weddingId: string (결혼식 ID)
 * - guestName: string (게스트 이름)
 * - file: File (이미지/영상)
 *
 * Response:
 * - { success: true, fileUrl?: string }
 */
app.post('/api/guest-upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { weddingId, guestName } = req.body;
    const file = req.file;

    // 검증
    if (!file) {
      res.status(400).json({ success: false, error: '파일이 없습니다.' });
      return;
    }

    if (!weddingId) {
      res.status(400).json({ success: false, error: '결혼식 ID가 필요합니다.' });
      return;
    }

    if (!guestName || guestName.trim().length === 0) {
      res.status(400).json({ success: false, error: '게스트 이름이 필요합니다.' });
      return;
    }

    // Firebase Storage 경로
    // 예: wedding/{weddingId}/guests/{guestName}/{timestamp}-{originalName}
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}${fileExtension}`;
    const storagePath = `wedding/${weddingId}/guests/${guestName}/${fileName}`;

    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(storagePath);

    // 메타데이터 설정
    const metadata = {
      contentType: file.mimetype,
      metadata: {
        guestName,
        uploadedAt: new Date().toISOString(),
      },
    };

    // 파일 업로드
    await fileRef.save(file.buffer, { metadata });

    console.log(`✅ 파일 업로드 성공: ${storagePath}`);

    res.status(200).json({
      success: true,
      message: '파일 업로드 완료',
      storagePath,
    });
  } catch (error) {
    console.error('❌ 파일 업로드 실패:', error);
    res.status(500).json({
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.',
    });
  }
});

// 헬스 체크
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 서버 시작: http://localhost:${PORT}`);
});
