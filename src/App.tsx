import { useState, useEffect, useRef } from 'react';

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import { AccountSection } from './components/AccountSection';
import { FooterSection } from './components/FooterSection';
import { GallerySection } from './components/GallerySection';
import { GreetingSection } from './components/GreetingSection';
import { GuestUploadSection } from './components/GuestUploadSection';
import { HeroSection } from './components/HeroSection';
import { InvitationLayout } from './components/InvitationLayout';
import { weddingConfig } from './config/weddingConfig';
import { useAuthUser } from './hooks/useAuthUser';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { GuestUploadPage } from './pages/GuestUploadPage';
import { WeddingDateSection } from './components/WeddingDateSection';
import { LocationSection } from './components/LocationSection';
import { GuestbookSection } from './components/GuestbookSection';
import IntroOverlay from './components/IntroOverlay';
import {
  MusicPlayerButton,
  type MusicPlayerHandle,
} from './components/MusicPlayerButton';



function InvitationPage() {
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const musicRef = useRef<MusicPlayerHandle>(null);

  return (
    <>
    <MusicPlayerButton ref={musicRef} visible={isIntroFinished} />
      {!isIntroFinished && (
          <IntroOverlay
          photoSrc="/images/hero-couple-1.webp"
          onOpen={() => musicRef.current?.play()}       
          onComplete={() => setIsIntroFinished(true)} // 문이 완전히 열린 뒤 호출
        />
      )}

      {isIntroFinished && (
        <div className="app-content is-visible">
          <InvitationLayout>
            <HeroSection config={weddingConfig} />
            <GreetingSection config={weddingConfig} />
            <GallerySection images={weddingConfig.gallery} />
            <WeddingDateSection config={weddingConfig} />
            <LocationSection config={weddingConfig} />
            <AccountSection config={weddingConfig} />
            <GuestbookSection />
            <GuestUploadSection />
            <FooterSection />
          </InvitationLayout>
        </div>
      )}
    </>
  );
}

function AdminRoute() {
  const navigate = useNavigate();
  const { user, isAdmin, isAuthLoading } = useAuthUser();

  if (isAuthLoading) {
    return (
      <main className="admin-page">
        <section className="admin-login-card">
          관리자 인증 상태를 확인하는 중입니다...
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          const weddingId = import.meta.env.VITE_WEDDING_ID;
          navigate(`/admin/${weddingId}`);
        }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-login-card">
          <p className="section-label">Admin</p>
          <h1>접근 권한이 없습니다</h1>
          <p>관리자 권한이 부여된 계정으로 로그인해 주세요.</p>
        </section>
      </main>
    );
  }

  return <AdminDashboardPage />;
}

function App() {
  useEffect(() => {
  const appKey = import.meta.env.VITE_KAKAO_APP_KEY;
  
  if (!appKey) {
    console.error('❌ VITE_KAKAO_APP_KEY가 설정되지 않았습니다.');
    return;
  }

  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
    console.log('✅ Kakao SDK 초기화 완료');
  }
}, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitationPage />} />
        <Route path="/guest-upload" element={<GuestUploadPage />} />
        {/* 로그인 페이지 */}
        <Route path="/admin" element={<AdminRoute />} />
        {/* 어드민 대시보드 */}
        <Route path="/admin/:weddingId" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;