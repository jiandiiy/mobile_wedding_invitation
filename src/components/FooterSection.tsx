import { weddingConfig } from '../config/weddingConfig';

export function FooterSection() {
  const { groom, bride } = weddingConfig.couple;
  const { dateText } = weddingConfig.date;

  return (
    <footer className="footer-section">
      <p className="footer-section__names">
        {groom.name} &amp; {bride.name}
      </p>
      <p className="footer-section__date">{dateText}</p>
    </footer>
  );
}