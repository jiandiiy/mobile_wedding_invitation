import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

export function InvitationLayout({ children }: PropsWithChildren) {
  // 이미지 우클릭 메뉴·드래그 저장 방지
  useEffect(() => {
    const block = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };

    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
    };
  }, []);

  return (
    <main className="invitation-shell">
      <div className="invitation-frame">
        <div className="invitation-card">{children}</div>
      </div>
    </main>
  );
}