/**
 * Kakao SDK 초기화 (Promise 기반)
 * 모바일 웹뷰에서 SDK 로드 지연 대응
 */

let kakaoInitPromise: Promise<boolean> | null = null;

export const initializeKakaoAsync = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // 이미 초기화 중이거나 완료됨
  if (kakaoInitPromise) return kakaoInitPromise;

  kakaoInitPromise = new Promise((resolve) => {
    // 이미 초기화됨
    if (window.Kakao?.isInitialized()) {
      console.log('✅ Kakao는 이미 초기화됨');
      resolve(true);
      return;
    }

    const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
    if (!appKey) {
      console.warn('⚠️ VITE_KAKAO_APP_KEY가 설정되지 않았습니다.');
      resolve(false);
      return;
    }

    // window.Kakao를 기다리며 폴링
    let attempts = 0;
    const maxAttempts = 50; // 5초 (100ms × 50)

    const checkAndInit = setInterval(() => {
      attempts++;

      if (window.Kakao) {
        clearInterval(checkAndInit);

        if (!window.Kakao.isInitialized()) {
          try {
            window.Kakao.init(appKey);
            console.log('✅ Kakao 초기화 완료');
            resolve(true);
          } catch (error) {
            console.error('❌ Kakao 초기화 실패:', error);
            resolve(false);
          }
        } else {
          resolve(true);
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(checkAndInit);
        console.error('❌ Kakao SDK 로드 타임아웃 (5초)');
        resolve(false);
      }
    }, 100);
  });

  return kakaoInitPromise;
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
 * Kakao Talk으로 공유 (비동기)
 */
export const shareToKakao = async (config: ShareConfig): Promise<boolean> => {
  try {
    // 1. SDK 초기화 완료 대기
    const isInitialized = await initializeKakaoAsync();

    if (!isInitialized || !window.Kakao?.isInitialized()) {
      alert('카카오톡 공유 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      console.warn('⚠️ Kakao SDK가 초기화되지 않음');
      return false;
    }

    // 2. 공유 실행
    const locationUrl = 'https://kko.to/stczwqQlK8';

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

    console.log('✅ 카카오톡 공유 완료');
    return true;
  } catch (error) {
    console.error('❌ 카카오톡 공유 실패:', error);
    alert('공유 중 오류가 발생했습니다.');
    return false;
  }
};

/**
 * 카카오맵 위치보기
 */
export const openKakaoMap = () => {
  const VENUE_NAME = '웨딩스퀘어 강변';
  const LATITUDE = 37.535725176732;
  const LONGITUDE = 127.095692162256;

  const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(VENUE_NAME)},${LATITUDE},${LONGITUDE}`;
  const mobileUrl = `kakaomap://look?p=${LATITUDE},${LONGITUDE}`;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = mobileUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 500);
  } else {
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