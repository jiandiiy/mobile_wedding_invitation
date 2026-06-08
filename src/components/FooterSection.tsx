import { useState, useEffect } from 'react';
import { weddingConfig } from '../config/weddingConfig';
import { initializeKakaoAsync, shareToKakao, copyToClipboard } from '../lib/kakaoShare';

export function FooterSection() {
  const { groom, bride } = weddingConfig.couple;
  const { dateText } = weddingConfig.date;
  const { name: venueName, hall: venueHall } = weddingConfig.venue;

  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle');
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const mainPageUrl = window.location.origin;

  // Kakao SDK 초기화
  useEffect(() => {
    initializeKakaoAsync().then((isReady) => {
      setIsKakaoReady(isReady);
      if (!isReady) {
        console.warn('⚠️ 카카오 SDK 초기화 실패 - 공유 기능 비활성화됨');
      }
    });
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
    if (!isKakaoReady || isSharing) return;

    setIsSharing(true);

    const description = `${dateText}\n${venueName} ${venueHall}`;

    const success = await shareToKakao({
      title: `${groom.fullName} ♥️ ${bride.fullName} 결혼합니다.`,
      description,
      imageUrl: '/images/wedding-image.jpg',
      webUrl: mainPageUrl,
      buttonTitle: '청첩장 보기',
    });

    setIsSharing(false);

    // 공유 성공 시 피드백 (선택사항)
    if (success) {
      console.log('✅ 공유 버튼 클릭 완료');
    }
  };

  return (
    <footer className="footer-section">
      {/* 공유 기능 - 상단 */}
      <div className="footer-section__share">
        <button
          type="button"
          className="footer-share-button footer-share-button--kakao"
          onClick={handleShareToKakao}
          disabled={!isKakaoReady || isSharing}
          aria-label="카카오톡으로 공유"
          title={!isKakaoReady ? '카카오 SDK 초기화 중입니다...' : ''}
        >
          <span className="footer-share-button__icon">
            {isSharing ? '⏳' : '💬'}
          </span>
          <span className="footer-share-button__text">
            {isSharing ? '공유 중...' : '카카오톡으로 공유하기'}
          </span>
        </button>

        <button
          type="button"
          className="footer-share-button footer-share-button--link"
          onClick={handleCopyLink}
          aria-label="청첩장 링크 복사"
        >
          <span className="footer-share-button__icon">🔗</span>
          <span className="footer-share-button__text">
            {copyFeedback === 'copied' ? '복사됨!' : '청첩장 링크 복사하기'}
          </span>
        </button>
      </div>

      {/* 기본 정보 - 하단 */}
      <div className="footer-section__info">
        <p className="footer-section__names">
          {groom.fullName} &amp; {bride.fullName}
        </p>
        <p className="footer-section__date">{dateText}</p>
      </div>
    </footer>
  );
}