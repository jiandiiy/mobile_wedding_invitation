import JSZip from 'jszip';
import { signOut } from 'firebase/auth';
import { useEffect, useMemo, useRef, useState } from 'react';

import { auth } from '../lib/firebase';
import {
  createAdminMediaFile,
  createAdminMediaFiles,
  deleteGuestUpload,
  deleteSingleGuestFile,
  groupUploadsByGuest,
  subscribeGuestUploads,
} from '../services/adminUploadService';
import type {
  AdminMediaFile,
  GuestUploadDocument,
  GuestUploadGroup,
} from '../types/admin';
import type { GuestUploadFile } from '../types/upload';
import { formatFileSize } from '../utils/file';

type FileTypeFilter = 'all' | 'image' | 'video';
type SortOption = 'latest' | 'oldest' | 'name';

type ModalState = {
  file: AdminMediaFile;
  index: number;
};

function formatDateTime(date: Date | null) {
  if (!date) return '날짜 없음';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function safeZipFileName(fileName: string) {
  return fileName
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/_+/g, '_');
}

function getUploadTotalSize(upload: GuestUploadDocument) {
  return upload.files.reduce((sum, file) => sum + file.size, 0);
}

function getGroupTotalSize(group: GuestUploadGroup) {
  return group.uploads.reduce((sum, upload) => sum + getUploadTotalSize(upload), 0);
}

function getUploadTimeValue(upload: GuestUploadDocument) {
  return upload.createdAt?.getTime() ?? 0;
}

export function AdminDashboardPage() {
  const weddingId = import.meta.env.VITE_WEDDING_ID;

  const previousUploadCountRef = useRef(0);
  const isInitialSnapshotRef = useRef(true);

  const [uploads, setUploads] = useState<GuestUploadDocument[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [searchText, setSearchText] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('latest');

  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingUploadId, setIsDeletingUploadId] = useState('');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [deletingFilePath, setDeletingFilePath] = useState('');
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [newUploadCount, setNewUploadCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const sortedUploads = useMemo(() => {
    const nextUploads = [...uploads];

    if (sortOption === 'latest') {
      return nextUploads.sort((a, b) => getUploadTimeValue(b) - getUploadTimeValue(a));
    }

    if (sortOption === 'oldest') {
      return nextUploads.sort((a, b) => getUploadTimeValue(a) - getUploadTimeValue(b));
    }

    return nextUploads.sort((a, b) => a.guestName.localeCompare(b.guestName, 'ko'));
  }, [uploads, sortOption]);

  const groups = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const grouped = groupUploadsByGuest(sortedUploads);

    return grouped
      .map((group) => {
        const filteredUploads = group.uploads
          .map((upload) => {
            const files = upload.files.filter((file) => {
              if (fileTypeFilter === 'all') return true;
              return file.type === fileTypeFilter;
            });

            return {
              ...upload,
              files,
              fileCount: files.length,
            };
          })
          .filter((upload) => upload.files.length > 0);

        return {
          ...group,
          uploads: filteredUploads,
          totalFileCount: filteredUploads.reduce(
            (sum, upload) => sum + upload.fileCount,
            0,
          ),
        };
      })
      .filter((group) => {
        if (group.uploads.length === 0) return false;

        if (!keyword) return true;

        const haystack = [
          group.guestName,
          group.guestPhone ?? '',
          ...group.uploads.flatMap((upload) =>
            upload.files.map((file) => file.name),
          ),
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      });
  }, [sortedUploads, searchText, fileTypeFilter]);

  const selectedGroup = useMemo<GuestUploadGroup | null>(() => {
    if (groups.length === 0) return null;

    return (
      groups.find((group) => group.guestKey === selectedGroupKey) ?? groups[0]
    );
  }, [groups, selectedGroupKey]);

  const selectedGroupFiles = useMemo(() => {
    if (!selectedGroup) return [];

    return selectedGroup.uploads.flatMap((upload) => upload.files);
  }, [selectedGroup]);

  const totalFileCount = useMemo(
    () => uploads.reduce((sum, upload) => sum + upload.fileCount, 0),
    [uploads],
  );

  const totalFileSize = useMemo(
    () =>
      uploads.reduce(
        (sum, upload) =>
          sum + upload.files.reduce((fileSum, file) => fileSum + file.size, 0),
        0,
      ),
    [uploads],
  );

  useEffect(() => {
    if (!weddingId) {
      setErrorMessage('청첩장 ID 설정이 필요합니다.');
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeGuestUploads(
      weddingId,
      (nextUploads) => {
        const previousCount = previousUploadCountRef.current;

        setUploads(nextUploads);
        setIsLoading(false);
        setErrorMessage('');

        if (isInitialSnapshotRef.current) {
          isInitialSnapshotRef.current = false;
        } else if (nextUploads.length > previousCount) {
          setNewUploadCount((prev) => prev + (nextUploads.length - previousCount));
        }

        previousUploadCountRef.current = nextUploads.length;

        if (nextUploads.length > 0) {
          const nextGroups = groupUploadsByGuest(nextUploads);

          setSelectedGroupKey((prevKey) => {
            if (prevKey && nextGroups.some((group) => group.guestKey === prevKey)) {
              return prevKey;
            }

            return nextGroups[0]?.guestKey ?? '';
          });
        } else {
          setSelectedGroupKey('');
        }
      },
      (error) => {
        console.error(error);
        setErrorMessage('업로드 목록을 실시간으로 불러오지 못했습니다.');
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [weddingId]);

  const handleSelectGroup = (guestKey: string) => {
    setSelectedGroupKey(guestKey);
    setNewUploadCount(0);
  };

  const handleDeleteUpload = async (upload: GuestUploadDocument) => {
    const isConfirmed = window.confirm(
      `${upload.guestName}님의 업로드 기록과 파일 전체를 삭제할까요?`,
    );

    if (!isConfirmed) return;

    try {
      setIsDeletingUploadId(upload.id);

      await deleteGuestUpload({
        weddingId,
        uploadId: upload.id,
        storagePaths: upload.files.map((file) => file.storagePath),
      });
    } catch (error) {
      console.error(error);
      alert('삭제 중 문제가 발생했습니다.');
    } finally {
      setIsDeletingUploadId('');
    }
  };

  const handleDeleteSingleFile = async (
    upload: GuestUploadDocument,
    file: GuestUploadFile,
  ) => {
    const isConfirmed = window.confirm(`${file.name} 파일을 삭제할까요?`);

    if (!isConfirmed) return;

    try {
      setDeletingFilePath(file.storagePath);

      await deleteSingleGuestFile({
        weddingId,
        upload,
        file,
      });
    } catch (error) {
      console.error(error);
      alert('파일 삭제 중 문제가 발생했습니다.');
    } finally {
      setDeletingFilePath('');
    }
  };

  const handleOpenMediaModal = async (file: GuestUploadFile) => {
    try {
      const mediaFile = await createAdminMediaFile(file);
      const index = selectedGroupFiles.findIndex(
        (item) => item.storagePath === file.storagePath,
      );

      setModalState({
        file: mediaFile,
        index: index >= 0 ? index : 0,
      });
    } catch (error) {
      console.error(error);
      alert('미디어를 불러오지 못했습니다.');
    }
  };

  const handleMoveModal = async (direction: 'prev' | 'next') => {
    if (!modalState || selectedGroupFiles.length === 0) return;

    const nextIndex =
      direction === 'next'
        ? (modalState.index + 1) % selectedGroupFiles.length
        : (modalState.index - 1 + selectedGroupFiles.length) %
          selectedGroupFiles.length;

    try {
      const nextMediaFile = await createAdminMediaFile(selectedGroupFiles[nextIndex]);

      setModalState({
        file: nextMediaFile,
        index: nextIndex,
      });
    } catch (error) {
      console.error(error);
      alert('다음 미디어를 불러오지 못했습니다.');
    }
  };

  const handleDownloadGroupZip = async () => {
    if (!selectedGroup) return;

    try {
      setIsDownloadingZip(true);
      setZipProgress(0);

      const zip = new JSZip();
      const allFiles = selectedGroup.uploads.flatMap((upload) => upload.files);
      const mediaFiles = await createAdminMediaFiles(allFiles);

      for (let index = 0; index < mediaFiles.length; index += 1) {
        const file = mediaFiles[index];
        const response = await fetch(file.downloadUrl);
        const blob = await response.blob();

        const fileName = `${String(index + 1).padStart(3, '0')}_${safeZipFileName(
          file.name,
        )}`;

        zip.file(fileName, blob);
        setZipProgress(Math.round(((index + 1) / mediaFiles.length) * 80));
      }

      const zipBlob = await zip.generateAsync(
        { type: 'blob' },
        (metadata) => {
          setZipProgress(80 + Math.round(metadata.percent * 0.2));
        },
      );

      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `${selectedGroup.guestName}_게스트스냅.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(zipUrl);
      setZipProgress(100);
    } catch (error) {
      console.error(error);
      alert('ZIP 다운로드 중 문제가 발생했습니다.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="section-label">Guest Snap Admin</p>
          <h1>하객 업로드 관리</h1>
          <p>
            하객별로 업로드된 사진과 영상을 실시간으로 확인하고 관리할 수 있습니다.
          </p>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>
          로그아웃
        </button>
      </header>

      {newUploadCount > 0 && (
        <button
          type="button"
          className="new-upload-banner"
          onClick={() => setNewUploadCount(0)}
        >
          새 업로드 {newUploadCount}건이 도착했어요. 확인하기
        </button>
      )}

      <section className="admin-summary-grid">
        <div>
          <span>하객 그룹</span>
          <strong>{groups.length}명</strong>
        </div>
        <div>
          <span>전체 파일</span>
          <strong>{totalFileCount}개</strong>
        </div>
        <div>
          <span>전체 용량</span>
          <strong>{formatFileSize(totalFileSize)}</strong>
        </div>
      </section>

      <section className="admin-toolbar">
        <label>
          <span>검색</span>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="하객 이름, 연락처, 파일명 검색"
          />
        </label>

        <label>
          <span>파일 타입</span>
          <select
            value={fileTypeFilter}
            onChange={(event) =>
              setFileTypeFilter(event.target.value as FileTypeFilter)
            }
          >
            <option value="all">전체</option>
            <option value="image">사진만</option>
            <option value="video">영상만</option>
          </select>
        </label>

        <label>
          <span>정렬</span>
          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="name">이름순</option>
          </select>
        </label>
      </section>

      {errorMessage && (
        <div className="upload-message upload-message--error">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="admin-empty-state">업로드 목록을 불러오는 중입니다...</div>
      ) : groups.length === 0 ? (
        <div className="admin-empty-state">
          조건에 맞는 업로드가 없습니다.
        </div>
      ) : (
        <section className="admin-layout">
          <aside className="guest-group-list">
            {groups.map((group) => (
              <button
                key={group.guestKey}
                type="button"
                className={
                  group.guestKey === selectedGroup?.guestKey
                    ? 'guest-group-item is-active'
                    : 'guest-group-item'
                }
                onClick={() => handleSelectGroup(group.guestKey)}
              >
                <strong>{group.guestName}</strong>
                <span>{group.guestPhone ?? '연락처 없음'}</span>
                <small>{formatFileSize(getGroupTotalSize(group))}</small>
                <em>{group.totalFileCount}개</em>
              </button>
            ))}
          </aside>

          <section className="guest-upload-detail">
            {selectedGroup && (
              <>
                <div className="guest-upload-detail-header">
                  <div>
                    <h2>{selectedGroup.guestName}</h2>
                    <p>
                      {selectedGroup.guestPhone ?? '연락처 없음'} · 총{' '}
                      {selectedGroup.totalFileCount}개 ·{' '}
                      {formatFileSize(getGroupTotalSize(selectedGroup))}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="primary-button admin-zip-button"
                    onClick={handleDownloadGroupZip}
                    disabled={isDownloadingZip}
                  >
                    {isDownloadingZip
                      ? `ZIP 생성 중... ${zipProgress}%`
                      : '하객 전체 ZIP 다운로드'}
                  </button>
                </div>

                {isDownloadingZip && (
                  <div className="zip-progress-box">
                    <div className="upload-progress-track">
                      <div
                        className="upload-progress-bar"
                        style={{ width: `${zipProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="admin-upload-list">
                  {selectedGroup.uploads.map((upload) => (
                    <article key={upload.id} className="admin-upload-card">
                      <div className="admin-upload-card-header">
                        <div>
                          <strong>{formatDateTime(upload.createdAt)}</strong>
                          <span>
                            {upload.fileCount}개 파일 ·{' '}
                            {formatFileSize(getUploadTotalSize(upload))}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDeleteUpload(upload)}
                          disabled={isDeletingUploadId === upload.id}
                        >
                          {isDeletingUploadId === upload.id
                            ? '삭제 중...'
                            : '업로드 전체 삭제'}
                        </button>
                      </div>

                      <ul className="admin-media-grid">
                        {upload.files.map((file) => (
                          <AdminMediaItem
                            key={file.id}
                            file={file}
                            isDeleting={deletingFilePath === file.storagePath}
                            onOpen={() => handleOpenMediaModal(file)}
                            onDelete={() => handleDeleteSingleFile(upload, file)}
                          />
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
      )}

      {modalState && (
        <MediaModal
          file={modalState.file}
          currentIndex={modalState.index + 1}
          totalCount={selectedGroupFiles.length}
          onClose={() => setModalState(null)}
          onPrev={() => handleMoveModal('prev')}
          onNext={() => handleMoveModal('next')}
        />
      )}
    </main>
  );
}

type AdminMediaItemProps = {
  file: GuestUploadFile;
  isDeleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

function AdminMediaItem({
  file,
  isDeleting,
  onOpen,
  onDelete,
}: AdminMediaItemProps) {
  const [mediaFile, setMediaFile] = useState<AdminMediaFile | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';

  useEffect(() => {
    let ignore = false;

    async function loadDownloadUrl() {
      try {
        setIsLoadingUrl(true);
        setErrorMessage('');

        const nextMediaFile = await createAdminMediaFile(file);

        if (!ignore) {
          setMediaFile(nextMediaFile);
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setErrorMessage('파일을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) {
          setIsLoadingUrl(false);
        }
      }
    }

    void loadDownloadUrl();

    return () => {
      ignore = true;
    };
  }, [file]);

  return (
    <li className="admin-media-item">
      <button
        type="button"
        className="admin-media-preview"
        onClick={onOpen}
        disabled={!mediaFile}
      >
        {isLoadingUrl && (
          <div className="admin-media-placeholder">불러오는 중...</div>
        )}

        {!isLoadingUrl && errorMessage && (
          <div className="admin-media-placeholder">{errorMessage}</div>
        )}

        {!isLoadingUrl && mediaFile && isImage && (
          <img src={mediaFile.downloadUrl} alt={mediaFile.name} />
        )}

        {!isLoadingUrl && mediaFile && isVideo && (
          <video src={mediaFile.downloadUrl} muted playsInline preload="metadata" />
        )}
      </button>

      <div className="admin-media-body">
        <strong>{file.name}</strong>
        <span>
          {isVideo ? '영상' : '사진'} · {formatFileSize(file.size)}
        </span>

        {mediaFile ? (
          <a href={mediaFile.downloadUrl} target="_blank" rel="noreferrer" download>
            다운로드
          </a>
        ) : (
          <button type="button" disabled>
            다운로드 준비 중
          </button>
        )}

        <button
          type="button"
          className="admin-file-delete-button"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? '삭제 중...' : '파일 삭제'}
        </button>
      </div>
    </li>
  );
}

type MediaModalProps = {
  file: AdminMediaFile;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function MediaModal({
  file,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
}: MediaModalProps) {
  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'ArrowLeft') {
        onPrev();
      }

      if (event.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div className="media-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="media-modal"
        role="dialog"
        aria-modal="true"
        aria-label={file.name}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="media-modal-header">
          <strong>{file.name}</strong>
          <span>
            {currentIndex} / {totalCount}
          </span>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="media-modal-content">
          <button
            type="button"
            className="media-modal-nav media-modal-nav--prev"
            onClick={onPrev}
            aria-label="이전 미디어"
          >
            ‹
          </button>

          {isImage && <img src={file.downloadUrl} alt={file.name} />}
          {isVideo && (
            <video src={file.downloadUrl} controls playsInline autoPlay />
          )}

          <button
            type="button"
            className="media-modal-nav media-modal-nav--next"
            onClick={onNext}
            aria-label="다음 미디어"
          >
            ›
          </button>
        </div>

        <div className="media-modal-footer">
          <span>{formatFileSize(file.size)}</span>
          <a href={file.downloadUrl} target="_blank" rel="noreferrer" download>
            원본 다운로드
          </a>
        </div>
      </div>
    </div>
  );
}