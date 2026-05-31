/**
 * Kakao SDK 초기화
 */
export const initializeKakao = () => {
  if (typeof window === 'undefined') return;

  if (window.Kakao && !window.Kakao.isInitialized()) {
    const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
    if (appKey) {
      window.Kakao.init(appKey);
      console.log('✅ Kakao 초기화 완료');
    } else {
      console.warn('⚠️ VITE_KAKAO_APP_KEY가 설정되지 않았습니다.');
    }
  }
};

interface ShareConfig {
  title: string;
  description: string;
  imageUrl: string;
  webUrl: string;
  buttonTitle?: string;
}

/**
 * URL을 절대경로로 변환
 */
const getAbsoluteUrl = (path: string): string => {
  if (typeof window === 'undefined') return path;
  if (path.startsWith('http')) return path;
  return `${window.location.origin}${path}`;
};

/**
 * Kakao Talk으로 공유
 */
export const shareToKakao = (config: ShareConfig) => {
  if (!window.Kakao?.isInitialized()) {
    alert('카카오톡 공유 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  try {
    const locationUrl = 'https://map.kakao.com/link/to/웨딩스퀘어강변,37.535725176732,127.095692162256';
    
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: config.title,
        description: config.description,
        imageUrl: getAbsoluteUrl(config.imageUrl),
        link: {
          webUrl: getAbsoluteUrl(config.webUrl),
          mobileWebUrl: getAbsoluteUrl(config.webUrl),
        },
      },
      buttons: [
        {
          title: config.buttonTitle || '청첩장 보기',
          link: {
            webUrl: getAbsoluteUrl(config.webUrl),
            mobileWebUrl: getAbsoluteUrl(config.webUrl),
          },
        },
        {
          title: '위치보기',
          link: {
            webUrl: locationUrl,
            mobileWebUrl: locationUrl,
          },
        },
      ],
    });
  } catch (error) {
    console.error('카카오톡 공유 실패:', error);
    alert('공유 중 오류가 발생했습니다.');
  }
};

/**
 * 카카오맵 위치보기
 */
export const openKakaoMap = () => {
  const VENUE_NAME = '웨딩스퀘어 강변';
  const LATITUDE = 37.535725176732;
  const LONGITUDE = 127.095692162256;

  // 웹 URL (카카오맵)
  const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(VENUE_NAME)},${LATITUDE},${LONGITUDE}`;

  // 모바일 앱 URL
  const mobileUrl = `kakaomap://look?p=${LATITUDE},${LONGITUDE}`;

  // 모바일 환경인지 체크
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // 모바일: 카카오맵 앱으로 시도, 없으면 웹으로 폴백
    window.location.href = mobileUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 500);
  } else {
    // 웹: 카카오맵 웹 버전으로 새 탭 열기
    window.open(webUrl, '_blank');
  }
};

/**
 * 클립보드에 텍스트 복사
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
};