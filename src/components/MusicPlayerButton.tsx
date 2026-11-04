import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const BGM_SRC = '/audio/wedding-bgm.mp3';

export interface MusicPlayerHandle {
  play: () => void;
}

interface MusicPlayerButtonProps {
  /** false면 버튼만 숨기고 오디오는 유지합니다 */
  visible?: boolean;
}

export const MusicPlayerButton = forwardRef<
  MusicPlayerHandle,
  MusicPlayerButtonProps
>(function MusicPlayerButton({ visible = true }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.volume = 0.45;
      audio.muted = false;
      await audio.play();
      setHasAudioError(false);
    } catch (error) {
      // 자동 재생이 막히면 조용히 꺼진 상태로 두고, 버튼으로 켜게 합니다
      console.warn('BGM 재생 실패:', error);
    }
  };

  useImperativeHandle(ref, () => ({ play }));

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void play();
    else audio.pause();
  };

  return (
    <div className="music-player">
      {/* 항상 마운트: 인트로 중 문을 탭할 때 재생하려면 필요합니다 */}
      <audio
        ref={audioRef}
        src={BGM_SRC}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('BGM 파일 로드 실패:', e.currentTarget.error);
          setHasAudioError(true);
          setIsPlaying(false);
        }}
      />

      {visible && (
        <button
          type="button"
          className={isPlaying ? 'music-button is-playing' : 'music-button'}
          onClick={handleToggle}
          aria-label={isPlaying ? '배경음악 끄기' : '배경음악 켜기'}
        >
          <span>{hasAudioError ? '!' : isPlaying ? 'Ⅱ' : '♫'}</span>
        </button>
      )}
    </div>
  );
});