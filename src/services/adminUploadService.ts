import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
} from 'firebase/storage';

import { db, storage } from '../lib/firebase';
import type {
  AdminMediaFile,
  GuestUploadDocument,
  GuestUploadGroup,
} from '../types/admin';
import type { GuestUploadFile } from '../types/upload';

function convertDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

function convertUploadDoc(
  id: string,
  data: Record<string, unknown>,
): GuestUploadDocument {
  return {
    id,
    weddingId: String(data.weddingId ?? ''),
    guestName: String(data.guestName ?? ''),
    guestPhone: data.guestPhone ? String(data.guestPhone) : null,
    guestFolderName: String(data.guestFolderName ?? ''),
    files: Array.isArray(data.files) ? (data.files as GuestUploadFile[]) : [],
    fileCount: Number(data.fileCount ?? 0),
    createdAt: convertDate(data.createdAt),
  };
}

export function subscribeGuestUploads(
  weddingId: string,
  onNext: (uploads: GuestUploadDocument[]) => void,
  onError: (error: Error) => void,
) {
  const uploadsCollectionRef = collection(
    db,
    'weddings',
    weddingId,
    'guestUploads',
  );

  const uploadsQuery = query(uploadsCollectionRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    uploadsQuery,
    (snapshot) => {
      const uploads = snapshot.docs.map((uploadDoc) =>
        convertUploadDoc(uploadDoc.id, uploadDoc.data()),
      );

      onNext(uploads);
    },
    onError,
  );
}

export function groupUploadsByGuest(
  uploads: GuestUploadDocument[],
): GuestUploadGroup[] {
  const groupMap = new Map<string, GuestUploadGroup>();

  uploads.forEach((upload) => {
    const guestKey =
      upload.guestPhone && upload.guestPhone.trim().length > 0
        ? `${upload.guestName}_${upload.guestPhone}`
        : upload.guestName;

    const prevGroup = groupMap.get(guestKey);

    if (prevGroup) {
      prevGroup.uploads.push(upload);
      prevGroup.totalFileCount += upload.fileCount;
      return;
    }

    groupMap.set(guestKey, {
      guestKey,
      guestName: upload.guestName,
      guestPhone: upload.guestPhone,
      totalFileCount: upload.fileCount,
      uploads: [upload],
    });
  });

  return Array.from(groupMap.values());
}

export async function createAdminMediaFile(file: GuestUploadFile) {
  const downloadUrl = await getDownloadURL(ref(storage, file.storagePath));

  return {
    ...file,
    downloadUrl,
  } satisfies AdminMediaFile;
}

export async function createAdminMediaFiles(files: GuestUploadFile[]) {
  return Promise.all(files.map(createAdminMediaFile));
}

export async function deleteGuestUpload(params: {
  weddingId: string;
  uploadId: string;
  storagePaths: string[];
}) {
  const { weddingId, uploadId, storagePaths } = params;

  await Promise.allSettled(
    storagePaths.map((storagePath) => deleteObject(ref(storage, storagePath))),
  );

  await deleteDoc(doc(db, 'weddings', weddingId, 'guestUploads', uploadId));
}

export async function deleteSingleGuestFile(params: {
  weddingId: string;
  upload: GuestUploadDocument;
  file: GuestUploadFile;
}) {
  const { weddingId, upload, file } = params;

  await deleteObject(ref(storage, file.storagePath));

  const nextFiles = upload.files.filter(
    (prevFile) => prevFile.storagePath !== file.storagePath,
  );

  const uploadDocRef = doc(db, 'weddings', weddingId, 'guestUploads', upload.id);

  if (nextFiles.length === 0) {
    await deleteDoc(uploadDocRef);
    return;
  }

  await updateDoc(uploadDocRef, {
    files: nextFiles,
    fileCount: nextFiles.length,
  });
}