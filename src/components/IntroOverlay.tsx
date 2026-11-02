import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './IntroOverlay.css';

const DOOR_DURATION_MS = 3600;
const FADE_DURATION_MS = 900;


// public/images/close-door.jpg 에 사진을 넣어 주세요
const DEFAULT_DOOR_SRC = '/images/close-door.webp';

type Phase = 'idle' | 'opening' | 'fading';

interface IntroOverlayProps {
  /** 문 뒤에 보일 사진 경로 (public 기준) */
  photoSrc: string;
  /** 닫힌 문 사진 경로 (public 기준). 반으로 나눠 좌/우 문으로 사용 */
  doorSrc?: string;
  title?: string;
  subtitle?: string;
  /** 탭한 순간 호출 (배경음악 재생 등에 사용) */
  onOpen?: () => void;
  /** 문이 모두 열리고 오버레이가 사라진 뒤 호출 */
  onComplete: () => void;
}

// 사진의 바깥 3%(경첩·문틀)를 잘라내는 값
const DOOR_BG = {
  size: '212.8% 101%',
  position: { left: '5.7% 50%', right: '94.3% 50%' },
} as const;

function Door({ side, src }: { side: 'left' | 'right'; src: string }) {
  return (
    <div
      className={`intro-door intro-door--${side}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: DOOR_BG.size,
        backgroundPosition: DOOR_BG.position[side],
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

export function IntroOverlay({
  photoSrc,
  doorSrc = DEFAULT_DOOR_SRC,
  onOpen,
  onComplete,
}: IntroOverlayProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<number[]>([]);

  // 모션 감소 설정이면 건너뛰지 않고 짧게만 재생합니다
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const doorMs = reduced ? 2000 : DOOR_DURATION_MS;
  const fadeMs = reduced ? 600 : FADE_DURATION_MS;

  // 최신 콜백을 ref에 보관해서 리렌더로 타이머가 재설정되지 않게 합니다
  const onCompleteRef = useRef(onComplete);
  const onOpenRef = useRef(onOpen);
  onCompleteRef.current = onComplete;
  onOpenRef.current = onOpen;

  // 사진 프리로드: 문이 열릴 때 사진이 깜빡이지 않도록
  useEffect(() => {
    [photoSrc, doorSrc].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [photoSrc, doorSrc]);

  // 오프닝 중 본문 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => window.clearTimeout(id));
  }, []);

  const handleOpen = useCallback(() => {
    if (phase !== 'idle') return; // 중복 탭 방지

    onOpenRef.current?.();
    setPhase('opening');

    // 1) 문이 열리는 시간 → 페이드아웃 시작
    timers.current.push(window.setTimeout(() => setPhase('fading'), doorMs));
    // 2) 페이드아웃이 끝나면 부모에게 알림
    timers.current.push(
      window.setTimeout(() => onCompleteRef.current(), doorMs + fadeMs),
    );
  }, [phase, doorMs, fadeMs]);

  const className = [
    'intro-overlay',
    phase === 'opening' ? 'is-opening' : '',
    phase === 'fading' ? 'is-fading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      aria-label="청첩장 열기"
      // 시간 값을 TSX 한 곳에서만 관리하도록 CSS 변수로 주입합니다
      style={
        {
          '--door-duration': `${doorMs}ms`,
          '--fade-duration': `${fadeMs}ms`,
        } as CSSProperties
      }
    >
      {/* 문 뒤에 보이는 사진 */}
      <div
        className="intro-photo"
        style={{ backgroundImage: `url(${photoSrc})` }}
      />

      {/* 양쪽 문 */}
      <Door side="left" src={doorSrc} />
      <Door side="right" src={doorSrc} />

      {/* 화면 전체 터치 영역 */}
      <button type="button" className="intro-content" onClick={handleOpen}>
        <span className="intro-label">화면을 터치해 주세요</span>
      </button>
    </div>
  );
}

export default IntroOverlay;
