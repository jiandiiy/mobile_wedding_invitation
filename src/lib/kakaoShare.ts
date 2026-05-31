// src/lib/kakaoShare.ts

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
  imageUrl: string; // 반드시 절대경로 (예: https://...)
  webUrl: string;
  buttonTitle?: string;
}

/**
 * 상대경로를 절대경로로 변환
 */
const getAbsoluteUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  const baseUrl = window.location.origin;
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
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
    // imageUrl을 절대경로로 변환
    const absoluteImageUrl = getAbsoluteUrl(config.imageUrl);
    const absoluteWebUrl = getAbsoluteUrl(config.webUrl);

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: config.title,
        description: config.description,
        imageUrl: absoluteImageUrl, // ✅ 절대경로 사용
        link: {
          webUrl: absoluteWebUrl,
          mobileWebUrl: absoluteWebUrl,
        },
      },
      buttons: [
        {
          title: config.buttonTitle || '청첩장 보기',
          link: {
            webUrl: absoluteWebUrl,
            mobileWebUrl: absoluteWebUrl,
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