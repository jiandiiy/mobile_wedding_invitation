import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTypingEffect } from '../hooks/useTypingEffect';


export function GuestUploadSection() {
   const [isGuestbookPassed, setIsGuestbookPassed] = useState(false);

  // 방명록을 지난 뒤에만 타이핑 시작
  const titleRef = useTypingEffect<HTMLHeadingElement>(90, isGuestbookPassed);

  useEffect(() => {
    if (isGuestbookPassed) return;

    const guestbook = document.querySelector('.guestbook-section');
    if (!guestbook) return;

    const observer = new IntersectionObserver(([entry]) => {
      // 화면에서 벗어났고, 섹션 아래쪽 끝이 화면 위(bottom < 0)에 있을 때만 통과로 판단
      if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
        setIsGuestbookPassed(true);
        observer.disconnect();
      }
    });

    observer.observe(guestbook);

    return () => observer.disconnect();
  }, [isGuestbookPassed]);

  return (
    <section className="guest-snap-section">
      <h2 ref={titleRef}>GUEST SNAP</h2>
      <span className="guest-snap-section__line" aria-hidden="true" />


      <p className="guest-upload-description">
        여러분의 시선이 담긴 사진과 영상을 남겨주세요.
        <br />
        로그인 없이 원본 화질 그대로 업로드하실 수 있습니다.
      </p>

      {/* 페이지 이동 — button 대신 Link로 의미에 맞게 */}
      <Link to="/guest-upload" className="guest-upload-open-button">
        사진 올리기
      </Link>
    </section>
  );
}
