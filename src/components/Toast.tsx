import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

type ToastProps = {
  message: string;
  parentRef: RefObject<HTMLElement | null>;
};

export function Toast({ message, parentRef }: ToastProps) {
  const [position, setPosition] = useState({ bottom: 32, left: 0 });

  useEffect(() => {
    if (!message || !parentRef.current) return;

    // AccountSection의 위치 계산
    const rect = parentRef.current.getBoundingClientRect();
    setPosition({
      bottom: window.innerHeight - rect.top + 16, // 섹션 위쪽에 배치
      left: rect.left + rect.width / 2, // 섹션 중앙 기준
    });
  }, [message, parentRef]);

  if (!message) return null;

  return (
    <div
      className="toast"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: `${position.bottom}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {message}
    </div>
  );
}