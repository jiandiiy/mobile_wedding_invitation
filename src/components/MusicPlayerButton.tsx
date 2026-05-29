import { useRef, useState } from 'react';

const BGM_SRC = '/audio/wedding-bgm.mp3';

export function MusicPlayerButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudioError, setHasAudioError] = useState(false);

  const handleToggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      setHasAudioError(false);
      audio.volume = 0.45;
      audio.muted = false;

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('BGM 재생 실패:', error);
      setIsPlaying(false);
      setHasAudioError(true);
    }
  };

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={BGM_SRC}
        loop
        preload="auto"
        playsInline
        onCanPlay={() => setHasAudioError(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(event) => {
          console.error('BGM 파일 로드 실패:', event.currentTarget.error);
          setHasAudioError(true);
          setIsPlaying(false);
        }}
      />

      <button
        type="button"
        className={isPlaying ? 'music-button is-playing' : 'music-button'}
        onClick={handleToggleMusic}
        aria-label={isPlaying ? '배경음악 끄기' : '배경음악 켜기'}
      >
        <span>{hasAudioError ? '!' : isPlaying ? 'Ⅱ' : '♪'}</span>
      </button>
    </div>
  );
}