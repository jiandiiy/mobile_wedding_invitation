import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import type { GalleryImage } from '../types/wedding';

type GallerySectionProps = {
  images: GalleryImage[];
};

const SWIPE_THRESHOLD = 50; // px: 이 이상 밀면 사진 넘김

export function GallerySection({ images }: GallerySectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loadedImageIds, setLoadedImageIds] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const { sectionRef, visibleIndex } = useSequentialReveal({
    itemCount: 3,
    interval: 240,
  });

  const selectedImageIndex = useMemo(() => {
    if (selectedImageId === null) return -1;
    return images.findIndex((image) => image.id === selectedImageId);
  }, [images, selectedImageId]);

  const selectedImage =
    selectedImageIndex >= 0 ? images[selectedImageIndex] : null;

  const getRevealClassName = (index: number, className = '') =>
    [className, 'reveal-up', visibleIndex >= index ? 'is-visible' : '']
      .filter(Boolean)
      .join(' ');

  const handleClose = useCallback(() => {
    setSelectedImageId(null);
  }, []);

  const handleMove = (direction: 'prev' | 'next') => {
    if (images.length === 0) return;

    setActiveIndex((prevIndex) =>
      direction === 'prev'
        ? (prevIndex - 1 + images.length) % images.length
        : (prevIndex + 1) % images.length,
    );
  };

  const handleModalMove = useCallback(
    (direction: 'prev' | 'next') => {
      if (selectedImageIndex < 0) return;

      const nextIndex =
        direction === 'prev'
          ? (selectedImageIndex - 1 + images.length) % images.length
          : (selectedImageIndex + 1) % images.length;

      setSelectedImageId(images[nextIndex].id);
      setActiveIndex(nextIndex); // 팝업을 닫았을 때 슬라이더도 같은 사진에 맞춤
    },
    [images, selectedImageIndex],
  );

  // 스와이프: pointerdown 위치와 pointerup 위치의 차이로 판단
  const handlePointerDown = (event: ReactPointerEvent) => {
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: ReactPointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    // 가로 이동이 충분하고, 세로보다 클 때만 스와이프로 인정
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    handleModalMove(dx < 0 ? 'next' : 'prev');
  };

  const handleImageLoad = (imageId: number) => {
    setLoadedImageIds((prevIds) =>
      prevIds.includes(imageId) ? prevIds : [...prevIds, imageId],
    );
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const activeSlide = slider.children[activeIndex] as HTMLElement | undefined;
    if (!activeSlide) return;

    const sliderCenter = slider.clientWidth / 2;
    const slideCenter = activeSlide.offsetLeft + activeSlide.clientWidth / 2;

    slider.scrollTo({
      left: slideCenter - sliderCenter,
      behavior: 'smooth',
    });
  }, [activeIndex]);

  // 팝업이 열려 있는 동안: 키보드 조작 + 배경 스크롤 잠금
  const isModalOpen = selectedImage !== null;

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
      if (event.key === 'ArrowLeft') handleModalMove('prev');
      if (event.key === 'ArrowRight') handleModalMove('next');
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, handleClose, handleModalMove]);

  if (images.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="gallery-section">
      <h2 className={getRevealClassName(0)}>GALLERY</h2>

      <div className={getRevealClassName(1, 'gallery-tabs')}>
        <span>Our Story</span>
        <span>Wedding Photo</span>
      </div>

      <div className={getRevealClassName(2, 'gallery-slider-wrap')}>
        <button
          type="button"
          className="gallery-arrow gallery-arrow--prev"
          onClick={() => handleMove('prev')}
          aria-label="이전 사진"
        >
          ‹
        </button>

        <div ref={sliderRef} className="gallery-slider">
          {images.map((image, index) => {
            const isLoaded = loadedImageIds.includes(image.id);
            const isActive = index === activeIndex;

            return (
              <button
                key={image.id}
                type="button"
                className={[
                  'gallery-slide',
                  'image-tone',
                  'image-tone--mono',
                  isActive ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setActiveIndex(index);
                  setSelectedImageId(image.id);
                }}
                aria-label={`${image.alt} 크게 보기`}
              >
                {!isLoaded && <span className="image-skeleton" />}

                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  className={isLoaded ? 'is-loaded' : ''}
                  onLoad={() => handleImageLoad(image.id)}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="gallery-arrow gallery-arrow--next"
          onClick={() => handleMove('next')}
          aria-label="다음 사진"
        >
          ›
        </button>
      </div>

      {/* body에 직접 붙여서, 부모의 transform/overflow 영향 없이 현재 화면 기준으로 표시 */}
      {selectedImage &&
        createPortal(
          <div
            className="gallery-modal-backdrop"
            role="presentation"
            onClick={handleClose}
            // 가로 터치를 브라우저가 가로채면 pointerup이 오지 않아 스와이프가 죽음
            style={{ touchAction: 'pan-y' }}
          >
            <div
              className="gallery-modal"
              role="dialog"
              aria-modal="true"
              aria-label={selectedImage.alt}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                swipeStart.current = null;
              }}
              style={{ touchAction: 'pan-y' }}
            >
              <div className="gallery-modal__header">
                <span>
                  {selectedImageIndex + 1} / {images.length}
                </span>

                <button type="button" onClick={handleClose} aria-label="닫기">
                  ✕
                </button>
              </div>

              <div className="gallery-modal__content">
                {images.length > 1 && (
                  <button
                    type="button"
                    className="gallery-modal__nav gallery-modal__nav--prev"
                    onClick={() => handleModalMove('prev')}
                    aria-label="이전 사진"
                  >
                    
                  </button>
                )}

                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  draggable={false}
                />

                {images.length > 1 && (
                  <button
                    type="button"
                    className="gallery-modal__nav gallery-modal__nav--next"
                    onClick={() => handleModalMove('next')}
                    aria-label="다음 사진"
                  >
                    
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

type UseSequentialRevealParams = {
  itemCount: number;
  interval?: number;
};

function useSequentialReveal({
  itemCount,
  interval = 180,
}: UseSequentialRevealParams) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(-1);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setHasStarted(true);
        observer.unobserve(entry.target);
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -12% 0px',
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const timers = Array.from({ length: itemCount }, (_, index) =>
      window.setTimeout(() => {
        setVisibleIndex(index);
      }, index * interval),
    );

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [hasStarted, interval, itemCount]);

  return {
    sectionRef,
    visibleIndex,
  };
}
