import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_COUNT = 100;

type PageView = 'landing' | 'form';
type FormStep = 'name-input' | 'uploading' | 'success' | 'error';

type PreviewFile = {
  id: string;
  file: File;
  previewUrl: string | null;
  progress: number;
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

function GuestUploadLanding({ onStart, onAdminClick }: { onStart: () => void; onAdminClick: () => void }) {
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
          <p className="guest-upload-landing__headline">📷 저희의 스냅 작가님이 되어주세요 </p>
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

        {/* 어드민 접근 버튼 */}
        <button
          type="button"
          className="guest-upload-landing__admin-button"
          onClick={onAdminClick}
          aria-label="관리자 페이지"
        >
          📊 관리자
        </button>
      </div>
    </div>
  );
}

const API_BASE_URL =
  'https://asia-northeast1-mobile-wedding-invitatio-d2312.cloudfunctions.net';

export function GuestUploadPage() {
  const navigate = useNavigate();
  const weddingId = import.meta.env.VITE_WEDDING_ID;

  const [view, setView] = useState<PageView>('landing');
  const [isFading, setIsFading] = useState(false);
  const [formStep, setFormStep] = useState<FormStep>('name-input');
  const [guestName, setGuestName] = useState('');
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  // Revoke blob URLs only when leaving 'success' → 'name-input'
  useEffect(() => {
    return () => {
      if (formStep === 'success') {
        revokePreviewUrls(previewFiles);
      }
    };
  }, [formStep, previewFiles]);

  const handleStartUpload = () => {
    setIsFading(true);
    setTimeout(() => {
      setView('form');
      setIsFading(false);
    }, 400);
  };

  const handleAdminAccess = () => {
    navigate('/admin/jian-dongyun-2027');
  };

  const handleClose = () => {
    if (view === 'form') {
      setIsFading(true);
      setTimeout(() => {
        revokePreviewUrls(previewFiles);
        setPreviewFiles([]);
        setView('landing');
        setFormStep('name-input');
        setGuestName('');
        setErrorMessage('');
        setIsFading(false);
      }, 400);
    } else {
      navigate('/');
    }
  };

  const handleStartFileSelect = () => {
    if (guestName.trim().length > 0) {
      fileInputRef.current?.click();
    }
  };

  const updateAllFilesProgress = (progress: number) => {
    setPreviewFiles((prev) =>
      prev.map((pf) => ({ ...pf, progress }))
    );
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const nextPreviewFiles = selectedFiles
      .slice(0, MAX_FILE_COUNT)
      .map(createPreviewFile);
    setPreviewFiles(nextPreviewFiles);
    setFormStep('uploading');

    await performUpload(nextPreviewFiles);

    event.target.value = '';
  };

  const performUpload = async (filesToUpload: PreviewFile[]) => {
    if (!weddingId) {
      setFormStep('error');
      setErrorMessage('청첩장 ID 설정이 필요합니다.');
      return;
    }

    try {
      setErrorMessage('');
      uploadAbortControllerRef.current = new AbortController();

      // ✅ FormData 구성
      const formData = new FormData();
      formData.append('weddingId', weddingId);
      formData.append('guestName', guestName.trim());

      filesToUpload.forEach((previewFile) => {
        formData.append('files', previewFile.file);
      });

      // 🔍 디버깅: FormData 내용 확인
      console.group('📦 FormData 디버깅');
      console.log('weddingId:', weddingId);
      console.log('guestName:', guestName.trim());
      console.log('파일 개수:', filesToUpload.length);
      filesToUpload.forEach((pf, i) => {
        console.log(`  [${i}] ${pf.file.name} (${pf.file.size} bytes, ${pf.file.type})`);
      });
      console.groupEnd();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // 🔍 요청 시작 시 디버깅
        xhr.upload.addEventListener('start', () => {
          console.log('📤 XHR 업로드 시작');
        });

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            console.log(`📊 업로드 진행: ${e.loaded}/${e.total} bytes (${percentComplete}%)`);
            updateAllFilesProgress(percentComplete);
          }
        });

        xhr.addEventListener('loadstart', () => {
          console.log('🚀 XHR loadstart');
        });

        xhr.addEventListener('load', () => {
          console.log(`✅ XHR load (상태: ${xhr.status})`);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✅ 업로드 성공');
            updateAllFilesProgress(100);
            resolve();
          } else {
            console.error(`❌ 업로드 실패 상태: ${xhr.status}`);
            console.error('응답:', xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('❌ XHR 네트워크 에러');
          reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
          console.error('❌ XHR 취소됨');
          reject(new Error('Upload cancelled'));
        });

        uploadAbortControllerRef.current?.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        console.log('📡 XHR 요청 전송:', `${API_BASE_URL}/guestUploadApi`);
        xhr.open('POST', `${API_BASE_URL}/guestUploadApi`);
        xhr.send(formData);
      });

      setFormStep('success');
    } catch (error) {
      console.error('❌ performUpload 에러:', error);
      setFormStep('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setPreviewFiles((prev) => {
      const removed = prev.find((pf) => pf.id === fileId);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((pf) => pf.id !== fileId);
    });
  };

  const handleCancelAll = () => {
    uploadAbortControllerRef.current?.abort();
    uploadAbortControllerRef.current = null;
    setErrorMessage('');
    setFormStep('name-input');
  };

  const handleUploadMore = () => {
    revokePreviewUrls(previewFiles);
    setPreviewFiles([]);
    setFormStep('name-input');
    setGuestName('');
  };

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

  const handleRetry = () => {
    setErrorMessage('');
    setFormStep('name-input');
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
        <GuestUploadLanding onStart={handleStartUpload} onAdminClick={handleAdminAccess} />
      ) : (
        <section className="guest-snap-section guest-snap-section--page">
          <h2>Guest Snap</h2>

          <p className="guest-upload-description">
            여러분의 시선이 담긴 사진과 영상을 남겨주세요.
            <br />
            로그인 없이 원본 화질 그대로 업로드하실 수 있습니다.
          </p>

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

          {formStep === 'success' && (
            <div className="guest-upload-form-step">
              <div className="upload-files-grid">
                {previewFiles.map((previewFile) => {
                  const isImage = previewFile.file.type.startsWith('image/');
                  return (
                    <div
                      key={previewFile.id}
                      className="upload-file-card upload-file-card--completed"
                    >
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