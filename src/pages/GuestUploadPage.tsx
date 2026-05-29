import { useEffect, useMemo, useState } from 'react';

import { uploadGuestFiles } from '../services/guestUploadService';
import { formatFileSize } from '../utils/file';

const MAX_FILE_COUNT = 100;

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type PageView = 'landing' | 'form';

type PreviewFile = {
  id: string;
  file: File;
  previewUrl: string | null;
};

function createPreviewFile(file: File): PreviewFile {
  const isImage = file.type.startsWith('image/');

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: isImage ? URL.createObjectURL(file) : null,
  };
}

function revokePreviewUrls(previewFiles: PreviewFile[]) {
  previewFiles.forEach((previewFile) => {
    if (previewFile.previewUrl) {
      URL.revokeObjectURL(previewFile.previewUrl);
    }
  });
}

// 랜딩 화면 컴포넌트
function GuestUploadLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="guest-upload-landing">
      {/* 히어로 이미지 */}
      <div className="guest-upload-landing__hero">
        <img
          src="/images/hero-couple.jpg"
          alt="웨딩 커플 사진"
          className="guest-upload-landing__hero-img"
        />
        <div className="guest-upload-landing__hero-overlay" />

        <div className="guest-upload-landing__hero-copy">
          <p className="guest-upload-landing__eyebrow">Guest Snap</p>
          <h1 className="guest-upload-landing__title">
            신랑·신부의 행복한 순간을<br />담아주세요
          </h1>
        </div>
      </div>

      {/* 안내 박스 */}
      <div className="guest-upload-landing__body">
        <div className="guest-upload-landing__info-box">
          <p className="guest-upload-landing__deadline">
            📅 마감일: <strong>2027년 2월 28일까지</strong>
          </p>

          <p className="guest-upload-landing__headline">
            저희의 스냅 작가님이 되어주세요 📷
          </p>

          <ul className="guest-upload-landing__list">
            <li>행복한 신랑 &amp; 신부 사진</li>
            <li>신랑 &amp; 신부 행진</li>
            <li>가족 &amp; 친구들과 함께한 순간</li>
            <li>여러분들의 사진</li>
          </ul>

          <p className="guest-upload-landing__gift">
            가장 멋진 컷을 남겨주신 분께 🎁<br />
            <strong>감사의 선물을 드리겠습니다!</strong>
          </p>

          <p className="guest-upload-landing__cta-hint">
            당일날, 아래 공유 버튼을 통해 올려주세요!
          </p>
        </div>

        <button
          type="button"
          className="guest-upload-landing__start-button"
          onClick={onStart}
        >
          사진 업로드하기
        </button>
      </div>
    </div>
  );
}

export function GuestUploadPage() {
  const weddingId = import.meta.env.VITE_WEDDING_ID;

  // 현재 뷰 상태: 'landing' → 'form' 으로 전환
  const [view, setView] = useState<PageView>('landing');
  const [isFading, setIsFading] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const files = useMemo(
    () => previewFiles.map((previewFile) => previewFile.file),
    [previewFiles],
  );

  const imageCount = useMemo(
    () => files.filter((file) => file.type.startsWith('image/')).length,
    [files],
  );

  const videoCount = useMemo(
    () => files.filter((file) => file.type.startsWith('video/')).length,
    [files],
  );

  const totalFileSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  const remainingFileCount = MAX_FILE_COUNT - files.length;

  const canSubmit =
    guestName.trim().length > 0 &&
    files.length > 0 &&
    uploadStatus !== 'uploading';

  // previewUrls cleanup
  useEffect(() => {
    return () => {
      revokePreviewUrls(previewFiles);
    };
  }, [previewFiles]);

  // 랜딩 → 폼 전환: fade-out 후 view 변경
  const handleStartUpload = () => {
    setIsFading(true);
    setTimeout(() => {
      setView('form');
      setIsFading(false);
    }, 400); // CSS transition 시간과 맞춤
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) return;

    const availableCount = MAX_FILE_COUNT - previewFiles.length;

    if (availableCount <= 0) {
      setNoticeMessage(`한 번에 최대 ${MAX_FILE_COUNT}개까지 선택할 수 있어요.`);
      event.target.value = '';
      return;
    }

    const limitedFiles = selectedFiles.slice(0, availableCount);
    const exceededCount = selectedFiles.length - limitedFiles.length;
    const nextPreviewFiles = limitedFiles.map(createPreviewFile);

    setPreviewFiles((prevFiles) => [...prevFiles, ...nextPreviewFiles]);
    setErrorMessage('');
    setUploadStatus('idle');

    if (exceededCount > 0) {
      setNoticeMessage(
        `최대 ${MAX_FILE_COUNT}개까지만 선택할 수 있어 ${exceededCount}개는 제외했어요.`,
      );
    } else {
      setNoticeMessage('');
    }

    event.target.value = '';
  };

  const handleRemoveFile = (targetId: string) => {
    setPreviewFiles((prevFiles) => {
      const targetFile = prevFiles.find(
        (previewFile) => previewFile.id === targetId,
      );

      if (targetFile?.previewUrl) {
        URL.revokeObjectURL(targetFile.previewUrl);
      }

      return prevFiles.filter((previewFile) => previewFile.id !== targetId);
    });

    setNoticeMessage('');
    setErrorMessage('');
  };

  const handleClearFiles = () => {
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setNoticeMessage('');
    setErrorMessage('');
    setUploadProgress(0);
    setUploadStatus('idle');
  };

  const handleResetForMoreUpload = () => {
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setUploadProgress(0);
    setNoticeMessage('');
    setErrorMessage('');
    setUploadStatus('idle');
  };

  const handleFullReset = () => {
    revokePreviewUrls(previewFiles);
    setGuestName('');
    setPreviewFiles([]);
    setUploadProgress(0);
    setNoticeMessage('');
    setErrorMessage('');
    setUploadStatus('idle');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!weddingId) {
      setUploadStatus('error');
      setErrorMessage('청첩장 ID 설정이 필요합니다.');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setNoticeMessage('');
      setErrorMessage('');

      await uploadGuestFiles({
        weddingId,
        guestName: guestName.trim(),
        files,
        onProgress: setUploadProgress,
      });

      revokePreviewUrls(previewFiles);
      setPreviewFiles([]);
      setUploadStatus('success');
      setUploadProgress(100);
    } catch (error) {
      console.error(error);

      setUploadStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <main
      className="guest-upload-page"
      style={{
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      {view === 'landing' ? (
        // 랜딩 화면
        <GuestUploadLanding onStart={handleStartUpload} />
      ) : (
        // 폼 화면
        <section className="guest-snap-section guest-snap-section--page">
          <h2>Guest Snap</h2>

          <p className="guest-upload-description">
            여러분의 시선이 담긴 사진과 영상을 남겨주세요.
            <br />
            로그인 없이 원본 화질 그대로 업로드하실 수 있습니다.
          </p>

          <form className="guest-upload-form" onSubmit={handleSubmit}>
            <div className="guest-upload-fields">
              <label className="guest-upload-field">
                <span>이름</span>
                <input
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="이름을 입력해 주세요"
                  disabled={uploadStatus === 'uploading'}
                  required
                />
              </label>
            </div>

            <label className="file-upload-dropzone">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                disabled={
                  uploadStatus === 'uploading' || files.length >= MAX_FILE_COUNT
                }
              />

              <span className="file-upload-dropzone__icon">＋</span>
              <strong>사진/영상 선택하기</strong>
              <small>
                한 번에 최대 {MAX_FILE_COUNT}개까지, 여러 번 나누어 올릴 수 있어요.
              </small>
            </label>

            <div className="selected-file-summary">
              <div>
                <strong>{files.length}개 선택됨</strong>
                <span>
                  사진 {imageCount}개 · 영상 {videoCount}개
                </span>
              </div>

              <div>
                <strong>{formatFileSize(totalFileSize)}</strong>
                <span>남은 선택 가능 {remainingFileCount}개</span>
              </div>
            </div>

            {noticeMessage && (
              <div className="upload-message upload-message--notice">
                {noticeMessage}
              </div>
            )}

            {previewFiles.length > 0 && (
              <>
                <div className="selected-file-actions">
                  <p>업로드 전 선택한 파일을 확인해 주세요.</p>

                  <button
                    type="button"
                    onClick={handleClearFiles}
                    disabled={uploadStatus === 'uploading'}
                  >
                    전체 삭제
                  </button>
                </div>

                <ul className="preview-file-grid">
                  {previewFiles.map((previewFile) => {
                    const { file } = previewFile;
                    const isImage = file.type.startsWith('image/');
                    const isVideo = file.type.startsWith('video/');

                    return (
                      <li key={previewFile.id} className="preview-file-card">
                        <div className="preview-file-card__media">
                          {isImage && previewFile.previewUrl ? (
                            <img src={previewFile.previewUrl} alt={file.name} />
                          ) : (
                            <div className="preview-file-card__video">
                              <span>{isVideo ? '▶' : 'FILE'}</span>
                            </div>
                          )}
                        </div>

                        <div className="preview-file-card__body">
                          <strong>{file.name}</strong>
                          <span>
                            {isVideo ? '영상' : '사진'} ·{' '}
                            {formatFileSize(file.size)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="preview-file-card__remove"
                          onClick={() => handleRemoveFile(previewFile.id)}
                          disabled={uploadStatus === 'uploading'}
                          aria-label={`${file.name} 삭제`}
                        >
                          삭제
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className="upload-progress-box">
                <div className="upload-progress-track">
                  <div
                    className="upload-progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                <p>원본 파일을 업로드 중이에요... {uploadProgress}%</p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="upload-success-card">
                <strong>업로드가 완료되었어요.</strong>

                <p>
                  소중한 사진과 영상을 남겨주셔서 감사합니다.
                  추가로 올릴 사진이 있다면 아래 버튼을 눌러 계속 업로드해 주세요.
                </p>

                <div className="upload-success-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleResetForMoreUpload}
                  >
                    사진 더 올리기
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleFullReset}
                  >
                    처음부터 다시 입력
                  </button>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="upload-message upload-message--error">
                {errorMessage}
              </div>
            )}

            {uploadStatus !== 'success' && (
              <button
                type="submit"
                className="guest-upload-submit"
                disabled={!canSubmit}
              >
                {uploadStatus === 'uploading' ? '업로드 중...' : '업로드하기'}
              </button>
            )}
          </form>
        </section>
      )}
    </main>
  );
}
