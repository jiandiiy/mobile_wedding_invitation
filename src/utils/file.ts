export function getFileType(file: File): 'image' | 'video' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';

  throw new Error('지원하지 않는 파일 형식입니다.');
}

export function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFKC')
    .replace(/[^\w.\-가-힣]/g, '_')
    .replace(/_+/g, '_');
}

export function sanitizePathSegment(value: string) {
  return value
    .trim()
    .normalize('NFKC')
    .replace(/[^\w가-힣]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);
}

export function createUploadFileName(file: File) {
  const timestamp = Date.now();
  const randomText = crypto.randomUUID().slice(0, 8);
  const safeFileName = sanitizeFileName(file.name);

  return `${timestamp}_${randomText}_${safeFileName}`;
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size}B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)}KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)}MB`;
  }

  return `${(size / 1024 / 1024 / 1024).toFixed(1)}GB`;
}