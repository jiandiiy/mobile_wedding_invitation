import type { GuestUploadFile } from './upload';

export type GuestUploadDocument = {
  id: string;
  weddingId: string;
  guestName: string;
  guestPhone: string | null;
  guestFolderName: string;
  files: GuestUploadFile[];
  fileCount: number;
  createdAt: Date | null;
};

export type GuestUploadGroup = {
  guestKey: string;
  guestName: string;
  guestPhone: string | null;
  totalFileCount: number;
  uploads: GuestUploadDocument[];
};

export type AdminMediaFile = GuestUploadFile & {
  downloadUrl: string;
};