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
 */

let kakaoInitPromise: Promise<boolean> | null = null;

export const initializeKakaoAsync = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (kakaoInitPromise) return kakaoInitPromise;

  kakaoInitPromise = new Promise((resolve) => {
    if (window.Kakao?.isInitialized()) {
      console.log('✅ Kakao는 이미 초기화됨');
      resolve(true);
      return;
    }
// kakaoShare.ts에 추가 - 카톡 WebView 감지
    const isKakaoTalkWebView = /KAKAOTALK/i.test(navigator.userAgent);
console.log('카톡 WebView?', isKakaoTalkWebView);
console.log('User-Agent:', navigator.userAgent);

    const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
    if (!appKey) {
      console.warn('⚠️ VITE_KAKAO_APP_KEY가 설정되지 않았습니다.');
      resolve(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 50;

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
 * Kakao Talk으로 공유 (비동기)
 */
export const shareToKakao = async (config: ShareConfig): Promise<boolean> => {
  try {
    const isInitialized = await initializeKakaoAsync();

    if (!isInitialized || !window.Kakao?.isInitialized()) {
      const errorMsg = 'Kakao SDK 미초기화';
      saveDebugLog('SHARE_FAILED', { reason: errorMsg });
      alert('카카오톡 공유 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      console.warn(`⚠️ ${errorMsg}`);
      return false;
    }

    const locationUrl = 'https://kko.to/stczwqQlK8';

    // 공유 요청 정보 로깅
    const shareData = {
      title: config.title,
      imageUrl: getAbsoluteUrl(config.imageUrl),
      webUrl: getAbsoluteUrl(config.webUrl),
    };
    saveDebugLog('SHARE_ATTEMPT', shareData);

    // ✅ 콜백 추가: success & fail
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
      success: (res: any) => {
        console.log('✅ 카카오톡 공유 완료', res);
        saveDebugLog('SHARE_SUCCESS', res);
      },
      fail: (error: any) => {
        console.error('❌ 카카오톡 공유 API 실패:', error);
        saveDebugLog('SHARE_FAILED', {
          error: error?.message || String(error),
          errorCode: error?.code,
        });
        alert('공유 중 오류가 발생했습니다.');
      },
    });

    return true;
  } catch (error) {
    console.error('❌ 카카오톡 공유 실패 (예외):', error);
    saveDebugLog('SHARE_ERROR', {
      message: error instanceof Error ? error.message : String(error),
    });
    alert('공유 중 오류가 발생했습니다.');
    return false;
  }
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