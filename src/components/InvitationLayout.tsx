import type { PropsWithChildren } from 'react';


export function InvitationLayout({ children }: PropsWithChildren) {
  return (
    <main className="invitation-shell">
      <div className="invitation-frame">
        <div className="invitation-card">{children}</div>
      </div>

    </main>
  );
}