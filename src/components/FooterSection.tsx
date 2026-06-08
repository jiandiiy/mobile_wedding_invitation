import { useState, useEffect } from 'react';
import { weddingConfig } from '../config/weddingConfig';
import { 
  initializeKakaoAsync, 
  shareToKakao, 
  copyToClipboard,
  getKakaoDebugLogs,
  clearKakaoDebugLogs 
} from '../lib/kakaoShare';

export function FooterSection() {
  const { groom, bride } = weddingConfig.couple;
  const { dateText } = weddingConfig.date;
  const { name: venueName, hall: venueHall } = weddingConfig.venue;

  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied'>('idle');
  const [isSharing, setIsSharing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string>('');

  const mainPageUrl = window.location.origin;

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
        imageUrl: '/images/wedding-image.jpg',
        webUrl: mainPageUrl,
        buttonTitle: '청첩장 보기',
      });
    } catch (error) {
      console.error('카카오톡 공유 실패:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // 디버그 로그 확인
  const handleCheckDebugLogs = () => {
    const logs = getKakaoDebugLogs();
    setDebugLogs(JSON.stringify(logs, null, 2));
    setShowDebug(true);
  };

  // 디버그 로그 초기화
  const handleClearDebugLogs = () => {
    clearKakaoDebugLogs();
    setDebugLogs('');
    setShowDebug(false);
  };

  return (
    <footer className="footer-section">
      {/* 공유 기능 - 상단 */}
      <div className="footer-section__share">
        <button
          type="button"
          className="footer-share-button footer-share-button--kakao"
          onClick={handleShareToKakao}
          disabled={isSharing}
          aria-label="카카오톡으로 공유"
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

      {/* 개발용 디버그 패널 (배포 전 제거) */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
        <button
          type="button"
          onClick={handleCheckDebugLogs}
          style={{
            padding: '8px 12px',
            marginRight: '8px',
            fontSize: '12px',
            background: '#f0f0f0',
            border: '1px solid #999',
            cursor: 'pointer',
          }}
        >
          📋 디버그 로그 확인
        </button>
        <button
          type="button"
          onClick={handleClearDebugLogs}
          style={{
            padding: '8px 12px',
            fontSize: '12px',
            background: '#f0f0f0',
            border: '1px solid #999',
            cursor: 'pointer',
          }}
        >
          🗑️ 로그 초기화
        </button>

        {showDebug && (
          <pre
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '11px',
              maxHeight: '300px',
              overflowY: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {debugLogs || '(로그 없음)'}
          </pre>
        )}
      </div>
    </footer>
  );
}