import type { WeddingConfig } from '../types/wedding';

type HeroSectionProps = {
  config: WeddingConfig;
};

export function HeroSection({ config }: HeroSectionProps) {
  const { couple } = config;

  return (
    <section className="hero-section hero-section--brand">
      <img
        className="hero-section__background"
        src="/images/hero-couple-2.webp"
        alt={`${couple.groom.name}과 ${couple.bride.name} 웨딩 사진`}
      />

      <div className="hero-section__overlay" />

      <p className="hero-top-names">
  {couple.groom.fullName} 
</p>

      <p className="hero-top-names--and"> {couple.bride.fullName}</p>
      

      <div className="hero-center-copy">
  <p className="hero-center-copy__title">A New Chapter</p>

  <strong className="hero-center-copy__subtitle">
    We’re Getting Married
  </strong>
</div>

<div className="hero-bottom-info">
  <span>2027.02.28 <br /> 일요일 오후 3시</span> 
  <span>웨딩 스퀘어 <br /> 4층 아모르홀</span>
</div>
    </section>
  );
}