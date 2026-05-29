import { useEffect, useMemo, useRef, useState } from 'react';

import type { GalleryImage } from '../types/wedding';

type GallerySectionProps = {
  images: GalleryImage[];
};

export function GallerySection({ images }: GallerySectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [loadedImageIds, setLoadedImageIds] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement | null>(null);

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

  const handleClose = () => {
    setSelectedImageId(null);
  };

  const handleMove = (direction: 'prev' | 'next') => {
    if (images.length === 0) return;

    setActiveIndex((prevIndex) =>
      direction === 'prev'
        ? (prevIndex - 1 + images.length) % images.length
        : (prevIndex + 1) % images.length,
    );
  };

  const handleModalMove = (direction: 'prev' | 'next') => {
    if (selectedImageIndex < 0) return;

    const nextIndex =
      direction === 'prev'
        ? (selectedImageIndex - 1 + images.length) % images.length
        : (selectedImageIndex + 1) % images.length;

    setSelectedImageId(images[nextIndex].id);
  };

  const handleImageLoad = (imageId: number) => {
    setLoadedImageIds((prevIds) => {
      if (prevIds.includes(imageId)) return prevIds;

      return [...prevIds, imageId];
    });
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

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }

      if (event.key === 'ArrowLeft') {
        handleModalMove('prev');
      }

      if (event.key === 'ArrowRight') {
        handleModalMove('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage, selectedImageIndex]);

  if (images.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="gallery-section">
      <h2 className={getRevealClassName(0)}>WEDDING GALLERY</h2>

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

      {selectedImage && (
        <div
          className="gallery-modal-backdrop"
          role="presentation"
          onClick={handleClose}
        >
          <div
            className="gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.alt}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gallery-modal__header">
              <span>
                {selectedImageIndex + 1} / {images.length}
              </span>

              <button type="button" onClick={handleClose}>
                닫기
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
                  ‹
                </button>
              )}

              <img src={selectedImage.src} alt={selectedImage.alt} />

              {images.length > 1 && (
                <button
                  type="button"
                  className="gallery-modal__nav gallery-modal__nav--next"
                  onClick={() => handleModalMove('next')}
                  aria-label="다음 사진"
                >
                  ›
                </button>
              )}
            </div>
          </div>
        </div>
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