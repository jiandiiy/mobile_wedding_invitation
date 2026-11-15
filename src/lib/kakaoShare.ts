/**
 * Kakao SDK 타입 확장
 */
declare global {
  interface Window {
    Kakao: any;
  }
}

/**
 * Kakao SDK 초기화 (Promise 기반)
 * 모바일 웹뷰에서 SDK 로드 지연 대응
 * - 실패한 결과는 캐시하지 않아 다음 호출에서 재시도합니다.
 */

let kakaoInitPromise: Promise<boolean> | null = null;

export const initializeKakaoAsync = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (window.Kakao?.isInitialized()) {
    console.log('✅ Kakao는 이미 초기화됨');
    return Promise.resolve(true);
  }

  if (kakaoInitPromise) return kakaoInitPromise;

  // 카톡 WebView 감지 로그
  const isKakaoTalkWebView = /KAKAOTALK/i.test(navigator.userAgent);
  console.log('카톡 WebView?', isKakaoTalkWebView);
  console.log('User-Agent:', navigator.userAgent);

  const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
  if (!appKey) {
    console.warn('⚠️ VITE_KAKAO_APP_KEY가 설정되지 않았습니다.');
    return Promise.resolve(false);
  }

  kakaoInitPromise = new Promise<boolean>((resolve) => {
    let attempts = 0;
    const maxAttempts = 50;

    const checkAndInit = setInterval(() => {
      attempts++;

      if (window.Kakao) {
        clearInterval(checkAndInit);

        try {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(appKey);
            console.log('✅ Kakao 초기화 완료');
          }
          resolve(true);
        } catch (error) {
          console.error('❌ Kakao 초기화 실패:', error);
          resolve(false);
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(checkAndInit);
        console.error('❌ Kakao SDK 로드 타임아웃 (5초)');
        resolve(false);
      }
    }, 100);
  }).then((ok) => {
    // 실패한 결과는 캐시하지 않음 (재시도 허용)
    if (!ok) kakaoInitPromise = null;
    return ok;
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

const LOCATION_URL = 'https://kko.to/stczwqQlK8';

/**
 * URL을 절대경로로 변환
 */
const getAbsoluteUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${window.location.origin}${path}`;
};

/**
 * 디버깅 정보를 localStorage에 저장
 */
const saveDebugLog = (key: string, data: unknown) => {
  try {
    const logs = JSON.parse(localStorage.getItem('kakao_debug_logs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      key,
      data,
    });
    // 최근 10개만 유지
    localStorage.setItem('kakao_debug_logs', JSON.stringify(logs.slice(-10)));
  } catch (error) {
    console.error('디버그 로그 저장 실패:', error);
  }
};

/**
 * 공유 실패를 콘솔과 디버그 로그에 기록하고, 사용자에게 안내합니다.
 */
function handleShareError(tag: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`[${tag}]`, error);
  saveDebugLog(tag, { message });
  alert('카카오톡 공유에 실패했습니다. 잠시 후 다시 시도해 주세요.');
}

/**
 * 실제 공유 호출 (Kakao JS SDK v2)
 * - sendDefault는 콜백/Promise를 받지 않으며, 실패 시 예외를 던집니다.
 * - 반드시 클릭 이벤트 안에서 동기적으로 실행해야 합니다.
 */
const sendFeed = (config: ShareConfig): void => {
  const webUrl = getAbsoluteUrl(config.webUrl);
  const imageUrl = getAbsoluteUrl(config.imageUrl);

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: config.title,
        description: config.description,
        imageUrl,
        link: { webUrl, mobileWebUrl: webUrl },
      },
      buttons: [
        {
          title: config.buttonTitle || '청첩장 보기',
          link: { webUrl, mobileWebUrl: webUrl },
        },
        {
          title: '위치보기',
          link: { webUrl: LOCATION_URL, mobileWebUrl: LOCATION_URL },
        },
      ],
    });
    saveDebugLog('SHARE_CALLED', {});
  } catch (error) {
    handleShareError('SHARE_SEND_FAILED', error);
  }
};

/**
 * Kakao Talk으로 공유
 * - SDK가 이미 준비되어 있으면 바로 공유합니다.
 * - 준비되지 않은 경우에만 비동기로 초기화 후 공유합니다.
 */
export const shareToKakao = (config: ShareConfig): void => {
  if (window.Kakao?.isInitialized()) {
    sendFeed(config);
    return;
  }

  initializeKakaoAsync()
    .then((ok) => {
      if (ok && window.Kakao?.isInitialized()) {
        sendFeed(config);
      } else {
        handleShareError('SHARE_NOT_INITIALIZED', new Error('Kakao SDK 초기화 실패'));
      }
    })
    .catch((error: unknown) => handleShareError('SHARE_INIT_FAILED', error));
};

/**
 * 디버그 로그 조회 (개발용)
 */
export const getKakaoDebugLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('kakao_debug_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * 디버그 로그 초기화
 */
export const clearKakaoDebugLogs = () => {
  localStorage.removeItem('kakao_debug_logs');
  console.log('✅ 디버그 로그 초기화됨');
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