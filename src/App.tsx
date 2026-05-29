import { useState } from 'react';

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
import { VideoSection } from './components/VideoSection';
import { weddingConfig } from './config/weddingConfig';
import { useAuthUser } from './hooks/useAuthUser';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { GuestUploadPage } from './pages/GuestUploadPage'; // 추가
import { WeddingDateSection } from './components/WeddingDateSection';
import { LocationSection } from './components/LocationSection';
import { GuestbookSection } from './components/GuestbookSection';
import { IntroScreen } from './components/IntroScreen';

function InvitationPage() {
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  return (
    <>
      {!isIntroFinished && (
        <IntroScreen
          config={weddingConfig}
          onFinish={() => setIsIntroFinished(true)}
        />
      )}

      {isIntroFinished && (
        <div className="app-content is-visible">
          <InvitationLayout>
            <HeroSection config={weddingConfig} />
            <GreetingSection config={weddingConfig} />
            <GallerySection images={weddingConfig.gallery} />
            <WeddingDateSection config={weddingConfig} />
            <VideoSection video={weddingConfig.video} />
            <LocationSection config={weddingConfig} />
            <AccountSection config={weddingConfig} />
            <GuestUploadSection />
            <GuestbookSection />
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
    return <AdminLoginPage onLoginSuccess={() => navigate('/admin')} />;
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitationPage />} />
        <Route path="/guest-upload" element={<GuestUploadPage />} /> {/* 추가 */}
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
