import { useEffect, useState } from 'react';
import type { WeddingConfig } from '../types/wedding';

type IntroScreenProps = {
  config: WeddingConfig;
  onFinish: () => void;
};

// src/components/IntroScreen.tsx
export function IntroScreen({ config, onFinish }: IntroScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setIsVisible(true), 400);
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 2800);
    const finishTimer = window.setTimeout(() => onFinish(), 3800);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <section
      className={[
        'intro-screen',
        isVisible ? 'is-visible' : '',
        isLeaving ? 'is-leaving' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 이미지가 화면 전체를 꽉 채움 */}
      <div className="intro-screen__image-wrap">
        <img
          className="intro-screen__image"
          src="/images/hero-couple.jpg"
          alt={`${config.couple.groom.name}과 ${config.couple.bride.name} 웨딩 사진`}
        />
      </div>

      {/* 텍스트는 이미지 위에 오버레이 */}
      <div className="intro-screen__content">
        <p className="intro-screen__subtitle">Our First Page</p>
      </div>
    </section>
  );
}