import { useEffect, useRef, useState } from 'react';

import type { VideoConfig } from '../types/wedding';

type VideoSectionProps = {
  video?: VideoConfig;
};

export function VideoSection({ video }: VideoSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -12% 0px',
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!video) return null;

  return (
    <section ref={sectionRef} className="content-section video-section">
      <video
        className={`wedding-video ${getRevealClassName(isVisible, 2)}`}
        src={video.src}
        poster={video.poster}
        controls
        playsInline
      />
    </section>
  );
}

function getRevealClassName(isVisible: boolean, order: number) {
  return [
    'reveal-up',
    isVisible ? 'is-visible' : '',
    `reveal-order-${order}`,
  ]
    .filter(Boolean)
    .join(' ');
}