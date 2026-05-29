import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';



const MAX_FILE_COUNT = 100;

type PageView = 'landing' | 'form';
type FormStep = 'name-input' | 'uploading' | 'success' | 'error';

type PreviewFile = {
  id: string;
  file: File;
  previewUrl: string | null;
  progress: number; // 0-100
};

type UploadAbortMap = {
  [fileId: string]: AbortController;
};

function createPreviewFile(file: File): PreviewFile {
  const isImage = file.type.startsWith('image/');

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: isImage ? URL.createObjectURL(file) : null,
    progress: 0,
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

      <div className="guest-upload-landing__body">
        <div className="guest-upload-landing__info-box">
          <p className="guest-upload-landing__deadline">
            📅 마감일: <strong>2027년 2월 28일까지</strong>
          </p>

          <p className="guest-upload-landing__headline">
            📷 저희의 스냅 작가님이 되어주세요 
          </p>

          <ul className="guest-upload-landing__list">
            <li>행복한 신랑 &amp; 신부 사진</li>
            <li>신랑 &amp; 신부 행진</li>
            <li>가족 &amp; 친구들과 함께한 순간</li>
            <li>여러분들의 사진</li>
          </ul>

          <p className="guest-upload-landing__gift">
            🎁 가장 멋진 컷을 남겨주신 분께 <br />
            <strong>감사의 선물을 드리겠습니다!</strong>
          </p>

          <p className="guest-upload-landing__cta-hint">
            결혼식 당일날, 아래 업로드 버튼을 통해 사진과 영상을 올려주세요!
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

const API_BASE_URL = 'https://asia-northeast1-mobile-wedding-invitatio-d2312.cloudfunctions.net';

export function GuestUploadPage() {
  const navigate = useNavigate();
  const weddingId = import.meta.env.VITE_WEDDING_ID;

  // 페이지 뷰: 'landing' → 'form'
  const [view, setView] = useState<PageView>('landing');
  const [isFading, setIsFading] = useState(false);

  // 폼 스텝: name-input → uploading → success/error
  const [formStep, setFormStep] = useState<FormStep>('name-input');
  const [guestName, setGuestName] = useState('');
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortMapRef = useRef<UploadAbortMap>({});

  // previewUrls cleanup
  useEffect(() => {
    return () => {
      revokePreviewUrls(previewFiles);
    };
  }, [previewFiles]);

  // 랜딩 → 폼 전환
  const handleStartUpload = () => {
    setIsFading(true);
    setTimeout(() => {
      setView('form');
      setIsFading(false);
    }, 400);
  };

  // 페이지 닫기
  const handleClose = () => {
    if (view === 'form') {
      setIsFading(true);
      setTimeout(() => {
        setView('landing');
        setFormStep('name-input');
        setGuestName('');
        revokePreviewUrls(previewFiles);
        setPreviewFiles([]);
        setErrorMessage('');
        setIsFading(false);
      }, 400);
    } else {
      navigate('/');
    }
  };

  // 이름 입력 후 업로드 버튼 클릭 → 파일 선택 열기
  const handleStartFileSelect = () => {
    if (guestName.trim().length > 0) {
      fileInputRef.current?.click();
    }
  };

  // 파일별 진행률 업데이트
  const updateFileProgress = (fileId: string, progress: number) => {
    setPreviewFiles((prev) =>
      prev.map((pf) =>
        pf.id === fileId ? { ...pf, progress } : pf
      )
    );
  };

  // 파일 선택 완료 → 자동 업로드 시작
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) return;

    const nextPreviewFiles = selectedFiles.slice(0, MAX_FILE_COUNT).map(createPreviewFile);
    setPreviewFiles(nextPreviewFiles);

    // 파일 선택 완료 후 바로 업로드 상태로 전환
    setFormStep('uploading');

    // 자동 업로드 시작
    await performUpload(nextPreviewFiles);

    // 파일 input 초기화
    event.target.value = '';
  };

  // 업로드 수행 (파일별 개별 업로드)
  const performUpload = async (filesToUpload: PreviewFile[]) => {
    if (!weddingId) {
      setFormStep('error');
      setErrorMessage('청첩장 ID 설정이 필요합니다.');
      return;
    }

    try {
      setErrorMessage('');
      uploadAbortMapRef.current = {};

      // 각 파일을 개별적으로 업로드
      const uploadPromises = filesToUpload.map(async (previewFile) => {
        const abortController = new AbortController();
        uploadAbortMapRef.current[previewFile.id] = abortController;

        try {
          // 파일별 FormData 생성
          const formData = new FormData();
          formData.append('weddingId', weddingId);
          formData.append('guestName', guestName.trim());
          formData.append('file', previewFile.file);

          // 파일 업로드 (XMLHttpRequest로 진행률 추적)
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                updateFileProgress(previewFile.id, percentComplete);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                updateFileProgress(previewFile.id, 100);
                resolve();
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload cancelled'));
            });

            // AbortController 연결
            abortController.signal.addEventListener('abort', () => {
              xhr.abort();
            });

            xhr.open('POST', `${API_BASE_URL}/guestUploadApi`);
            xhr.send(formData);
          });
        } catch (error) {
          if (error instanceof Error && error.message === 'Upload cancelled') {
            updateFileProgress(previewFile.id, 0);
          } else {
            throw error;
          }
        }
      });

      await Promise.all(uploadPromises);
      setFormStep('success');
    } catch (error) {
      console.error(error);
      setFormStep('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  // 파일별 삭제 (업로드 중 취소)
  const handleRemoveFile = (fileId: string) => {
    // 업로드 중이면 abort
    if (uploadAbortMapRef.current[fileId]) {
      uploadAbortMapRef.current[fileId].abort();
      delete uploadAbortMapRef.current[fileId];
    }

    setPreviewFiles((prev) => {
      const removed = prev.find((pf) => pf.id === fileId);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((pf) => pf.id !== fileId);
    });
  };

  // 전체 업로드 취소
  const handleCancelAll = () => {
    Object.values(uploadAbortMapRef.current).forEach((controller) => {
      controller.abort();
    });
    uploadAbortMapRef.current = {};
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setErrorMessage('');
    setFormStep('name-input');
    setGuestName('');
  };

  // 성공 후 다시 업로드
  const handleUploadMore = () => {
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setFormStep('name-input');
    setGuestName('');
  };

  // 성공 후 랜딩으로 돌아가기
  const handleBackToLanding = () => {
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setFormStep('name-input');
    setGuestName('');
    setIsFading(true);
    setTimeout(() => {
      setView('landing');
      setIsFading(false);
    }, 400);
  };

  // 에러 후 다시 시도
  const handleRetry = () => {
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setErrorMessage('');
    setFormStep('name-input');
    setGuestName('');
  };

  return (
    <main
      className="guest-upload-page"
      style={{
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <button
        type="button"
        className="guest-upload-page__close"
        onClick={handleClose}
        aria-label="이전으로 돌아가기"
      >
        ✕
      </button>

      {view === 'landing' ? (
        <GuestUploadLanding onStart={handleStartUpload} />
      ) : (
        <section className="guest-snap-section guest-snap-section--page">
          <h2>Guest Snap</h2>

          <p className="guest-upload-description">
            여러분의 시선이 담긴 사진과 영상을 남겨주세요.
            <br />
            로그인 없이 원본 화질 그대로 업로드하실 수 있습니다.
          </p>

          {/* Step 1: 이름 입력 */}
          {formStep === 'name-input' && (
            <div className="guest-upload-form-step">
              <div className="guest-upload-fields">
                <label className="guest-upload-field">
                  <span>이름</span>
                  <input
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="이름을 입력해 주세요"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && guestName.trim().length > 0) {
                        handleStartFileSelect();
                      }
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                className="guest-upload-submit"
                disabled={guestName.trim().length === 0}
                onClick={handleStartFileSelect}
              >
                사진 업로드하기
              </button>

              {/* 숨겨진 파일 input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Step 2: 업로드 중 */}
          {formStep === 'uploading' && (
            <div className="guest-upload-form-step">
              <div className="upload-files-grid">
                {previewFiles.map((previewFile) => {
                  const isImage = previewFile.file.type.startsWith('image/');
                  return (
                    <div key={previewFile.id} className="upload-file-card">
                      <div className="upload-file-card__media">
                        {isImage && previewFile.previewUrl ? (
                          <img
                            src={previewFile.previewUrl}
                            alt={previewFile.file.name}
                          />
                        ) : (
                          <div className="upload-file-card__placeholder">
                            {isImage ? '📸' : '🎥'}
                          </div>
                        )}
                        <div className="upload-file-card__progress-overlay">
                          <div className="upload-file-card__progress-track">
                            <div
                              className="upload-file-card__progress-bar"
                              style={{ width: `${previewFile.progress}%` }}
                            />
                          </div>
                          <span className="upload-file-card__progress-text">
                            {previewFile.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="upload-file-card__info">
                        <strong>{previewFile.file.name}</strong>
                        <button
                          type="button"
                          className="upload-file-card__remove"
                          onClick={() => handleRemoveFile(previewFile.id)}
                          aria-label="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="guest-upload-cancel"
                onClick={handleCancelAll}
              >
                전체 취소
              </button>
            </div>
          )}

          {/* Step 3: 성공 */}
          {formStep === 'success' && (
            <div className="guest-upload-form-step">
              <div className="upload-files-grid">
                {previewFiles.map((previewFile) => {
                  const isImage = previewFile.file.type.startsWith('image/');
                  return (
                    <div key={previewFile.id} className="upload-file-card upload-file-card--completed">
                      <div className="upload-file-card__media">
                        {isImage && previewFile.previewUrl ? (
                          <img
                            src={previewFile.previewUrl}
                            alt={previewFile.file.name}
                          />
                        ) : (
                          <div className="upload-file-card__placeholder">
                            {isImage ? '📸' : '🎥'}
                          </div>
                        )}
                        <div className="upload-file-card__success-badge">
                          ✓
                        </div>
                      </div>
                      <div className="upload-file-card__info">
                        <strong>{previewFile.file.name}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                    onClick={handleUploadMore}
                  >
                    사진 더 올리기
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleBackToLanding}
                  >
                    처음으로 돌아가기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 에러 */}
          {formStep === 'error' && (
            <div className="guest-upload-form-step">
              <div className="upload-message upload-message--error">
                {errorMessage}
              </div>

              <div className="upload-error-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleRetry}
                >
                  다시 시도
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleBackToLanding}
                >
                  처음으로 돌아가기
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}