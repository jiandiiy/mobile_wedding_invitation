import { useState } from 'react';
import { weddingConfig } from '../config/weddingConfig';

export function FooterSection() {
  const { groom, bride } = weddingConfig.couple;
  const { dateText } = weddingConfig.date;
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle');

  const mainPageUrl = window.location.origin;

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mainPageUrl);
      setCopyFeedback('copied');
      setTimeout(() => setCopyFeedback('idle'), 2000);
    } catch (err) {
      console.error('링크 복사 실패:', err);
      alert('링크 복사에 실패했습니다.');
    }
  };

  // 카카오톡 공유 (카카오 SDK 초기화 후 사용)
  const handleShareToKakao = () => {
  if (!window.Kakao?.isInitialized()) {
    alert('카카오톡 공유 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `${groom.name} & ${bride.name}의 결혼식`,
      description: dateText,
      imageUrl: 'https://jidong-wedding.vercel.app/images/wedding-image.jpg', // 실제 이미지 URL
      link: {
        webUrl: window.location.href,
        mobileWebUrl: window.location.href,
      },
    },
    buttons: [
      {
        title: '초대장 보기',
        link: {
          webUrl: window.location.href,
          mobileWebUrl: window.location.href,
        },
      },
    ],
  });
};

  return (
    <footer className="footer-section">
      {/* 공유 기능 - 상단 */}
      <div className="footer-section__share">
        <button
          type="button"
          className="footer-share-button footer-share-button--kakao"
          onClick={handleShareToKakao}
          aria-label="카카오톡으로 공유"
        >
          <span className="footer-share-button__icon">💬</span>
          <span className="footer-share-button__text">카카오톡으로 공유하기</span>
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
          {groom.name} &amp; {bride.name}
        </p>
        <p className="footer-section__date">{dateText}</p>
      </div>
    </footer>
  );
}