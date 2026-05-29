import { useEffect, useState } from 'react';
import type { WeddingConfig } from '../types/wedding';

type IntroScreenProps = {
  config: WeddingConfig;
  onFinish: () => void;
};

export function IntroScreen({ config, onFinish }: IntroScreenProps) {
  const { couple } = config;
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 400);

    const leaveTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, 2800);

    const finishTimer = window.setTimeout(() => {
      onFinish();
    }, 3800);

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
      <div className="intro-screen__inner">
        <div className="intro-screen__image-wrap">
          <img
            className="intro-screen__image"
            src="/images/hero-couple.jpg"
            alt={`${couple.groom.name}과 ${couple.bride.name} 웨딩 사진`}
          />
        </div>

        <div className="intro-screen__content">
          <p>We’re Getting Married</p>

          <h1>
            <span>{couple.groom.name}</span>
            <em>&amp;</em>
            <span>{couple.bride.name}</span>
          </h1>
        </div>
      </div>
    </section>
  );
}