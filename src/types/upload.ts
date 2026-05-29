export type GuestUploadFileType = 'image' | 'video';

export type GuestUploadFile = {
  id: string;
  name: string;
  size: number;
  type: GuestUploadFileType;
  contentType: string;
  storagePath: string;
};

export type GuestUploadRecord = {
  weddingId: string;
  guestName: string;
  guestPhone?: string;
  files: GuestUploadFile[];
  fileCount: number;
  createdAt: Date;
};