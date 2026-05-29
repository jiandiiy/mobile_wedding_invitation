import type { WeddingConfig } from '../types/wedding';
import { MusicPlayerButton } from './MusicPlayerButton';

type HeroSectionProps = {
  config: WeddingConfig;
};

export function HeroSection({ config }: HeroSectionProps) {
  const { couple } = config;

  return (
    <section className="hero-section hero-section--brand">
      <img
        className="hero-section__background"
        src="/images/hero-couple.jpg"
        alt={`${couple.groom.name}과 ${couple.bride.name} 웨딩 사진`}
      />

      <div className="hero-section__overlay" />

        <MusicPlayerButton />


      <div className="hero-center-copy">
  <p className="hero-center-copy__title">A New Chapter</p>

  <strong className="hero-center-copy__subtitle">
    We’re Getting Married
  </strong>
</div>

<div className="hero-bottom-info">
  <span>2027.02.28</span>
  <span>SUN 3:00 PM</span>
</div>
    </section>
  );
}