import { Link } from 'react-router-dom';

export function GuestUploadSection() {
  return (
    <section className="guest-snap-section">
      <h2>Guest Snap</h2>

      <p className="guest-upload-description">
        여러분의 시선이 담긴 사진과 영상을 남겨주세요.
        <br />
        로그인 없이 원본 화질 그대로 업로드하실 수 있습니다.
      </p>

      {/* 페이지 이동 — button 대신 Link로 의미에 맞게 */}
      <Link to="/guest-upload" className="guest-upload-open-button">
        업로드하기
      </Link>
    </section>
  );
}
