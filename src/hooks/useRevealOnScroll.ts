import { useEffect, useRef, useState } from 'react';

export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;

    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      {
        // 요소가 어느 정도 화면 안으로 들어왔을 때만 등장
        threshold: 0.65,

        // 너무 일찍 뜨지 않도록 아래쪽 기준을 조금 당김
        rootMargin: '0px 0px -30% 0px',
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    ref,
    className: isVisible ? 'reveal-up is-visible' : 'reveal-up',
  };
}