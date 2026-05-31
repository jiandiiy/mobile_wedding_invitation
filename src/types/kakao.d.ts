interface KakaoShareSettings {
  templateId: number;
  templateArgs?: Record<string, string>;
}

interface KakaoShareLink {
  webUrl?: string;
  mobileWebUrl?: string;
  androidAppUrl?: string;
  iosAppUrl?: string;
}

interface Kakao {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (settings: {
      objectType: string;
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: KakaoShareLink;
      };
      social?: {
        likeCount: number;
        commentCount: number;
        sharedCount: number;
      };
      buttons: Array<{
        title: string;
        link: KakaoShareLink;
      }>;
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao: Kakao;
  }
}

export {};