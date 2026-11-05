import { useState, useEffect } from 'react';
import { weddingConfig } from '../config/weddingConfig';
import {
  initializeKakaoAsync,
  shareToKakao,
  copyToClipboard,
} from '../lib/kakaoShare';

const MARQUEE_TEXT =
  'GET MARRIED • DONG YOON & JI AN • SAVE THE DATE • 2027.02.28 •';

export function FooterSection() {
  const { groom, bride } = weddingConfig.couple;
  const { dateText } = weddingConfig.date;
  const { name: venueName, hall: venueHall } = weddingConfig.venue;

  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle');
  const [isSharing, setIsSharing] = useState(false);

  const mainPageUrl = import.meta.env.VITE_SITE_URL ?? window.location.origin;

  // Kakao SDK 초기화
  useEffect(() => {
    initializeKakaoAsync();
  }, []);

  // 링크 복사
  const handleCopyLink = async () => {
    const success = await copyToClipboard(mainPageUrl);
    if (success) {
      setCopyFeedback('copied');
      setTimeout(() => setCopyFeedback('idle'), 2000);
    } else {
      alert('링크 복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유
  const handleShareToKakao = async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      // 공유할 때마다 SDK 재초기화 (카톡 웹뷰 대응)
      await initializeKakaoAsync();

      const description = `${dateText}\n${venueName} ${venueHall}`;

      shareToKakao({
        title: `${groom.fullName} ♥️ ${bride.fullName} 결혼합니다.`,
        description,
        imageUrl: `${mainPageUrl}/images/hero-couple-1.webp`,
        webUrl: mainPageUrl,
        buttonTitle: '청첩장 보기',
      });
    } catch (error) {
      console.error('카카오톡 공유 실패:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <footer className="footer-section">
      {/* 상단 사진 */}
      <div className="footer-section__photo">
        <img
          src="/images/footer.webp"
          alt="백조 사진"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* 필기체 감사 인사 */}
      <p className="footer-section__thanks">Thank you</p>

      <p className="footer-section__message">
        저희 두 사람의 시작을
        <br />
        함께해 주셔서 감사합니다.
      </p>

      <p className="footer-section__names">
        {groom.fullName} · {bride.fullName} 올림
      </p>

      {/* 공유 버튼 */}
      <div className="footer-section__actions">
        <button
          type="button"
          onClick={handleShareToKakao}
          disabled={isSharing}
          aria-label="카카오톡으로 공유"
        >
          <span className="footer-section__kakao-icon" aria-hidden="true">
            TALK
          </span>
          {isSharing ? '공유 중...' : '카카오톡 공유'}
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="청첩장 링크 복사"
        >
          {copyFeedback === 'copied' ? '복사됨!' : 'URL 복사'}
        </button>
      </div>

      {/* 하단 마퀴 띠 */}
      <div className="footer-marquee" aria-label={MARQUEE_TEXT}>
        <div className="footer-marquee__track" aria-hidden="true">
          {/* 같은 묶음 2개를 -50%만큼 이동시키면 끊김 없이 반복 */}
          {[0, 1].map((group) => (
            <div key={group} className="footer-marquee__group">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i}>{MARQUEE_TEXT}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}