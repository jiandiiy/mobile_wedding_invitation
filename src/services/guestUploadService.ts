import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';

import { db, storage } from '../lib/firebase';
import type { GuestUploadFile } from '../types/upload';
import {
  createUploadFileName,
  getFileType,
  sanitizePathSegment,
} from '../utils/file';

type UploadGuestFilesParams = {
  weddingId: string;
  guestName: string;
  files: File[];
  onProgress?: (progress: number) => void;
};

const MAX_FILE_COUNT = 100;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 파일 1개당 500MB

function validateFiles(files: File[]) {
  if (files.length === 0) {
    throw new Error('업로드할 파일을 선택해 주세요.');
  }

  if (files.length > MAX_FILE_COUNT) {
    throw new Error(`한 번에 최대 ${MAX_FILE_COUNT}개까지 업로드할 수 있습니다.`);
  }

  files.forEach((file) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new Error(`지원하지 않는 파일 형식입니다: ${file.name}`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`파일 크기가 너무 큽니다: ${file.name}`);
    }
  });
}

function uploadSingleFile(params: {
  weddingId: string;
  guestFolderName: string;
  file: File;
  onFileProgress?: (progress: number) => void;
}) {
  const { weddingId, guestFolderName, file, onFileProgress } = params;

  const fileName = createUploadFileName(file);
  const storagePath = `weddings/${weddingId}/guest-snaps/${guestFolderName}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise<GuestUploadFile>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );

        onFileProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      () => {
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: getFileType(file),
          contentType: file.type,
          storagePath,
        });
      },
    );
  });
}

export async function uploadGuestFiles({
  weddingId,
  guestName,
  files,
  onProgress,
}: UploadGuestFilesParams) {
  const trimmedGuestName = guestName.trim();

  if (!trimmedGuestName) {
    throw new Error('이름을 입력해 주세요.');
  }

  validateFiles(files);

  // 폴더명은 이름만 사용
  const guestFolderName = sanitizePathSegment(trimmedGuestName);

  const uploadedFiles: GuestUploadFile[] = [];
  const progressMap = new Map<string, number>();

  for (const file of files) {
    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

    const uploadedFile = await uploadSingleFile({
      weddingId,
      guestFolderName,
      file,
      onFileProgress: (fileProgress) => {
        progressMap.set(fileKey, fileProgress);

        const totalProgress =
          Array.from(progressMap.values()).reduce((sum, v) => sum + v, 0) /
          files.length;

        onProgress?.(Math.round(totalProgress));
      },
    });

    uploadedFiles.push(uploadedFile);
  }

  const uploadsCollectionRef = collection(
    db,
    'weddings',
    weddingId,
    'guestUploads',
  );

  const docRef = await addDoc(uploadsCollectionRef, {
    weddingId,
    guestName: trimmedGuestName,
    guestFolderName,
    files: uploadedFiles,
    fileCount: uploadedFiles.length,
    createdAt: serverTimestamp(),
  });

  return {
    uploadId: docRef.id,
    files: uploadedFiles,
  };
}
