import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';

import { auth } from '../lib/firebase';

type AdminLoginPageProps = {
  onLoginSuccess?: () => void;
};

export function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL ?? '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      await signInWithEmailAndPassword(auth, email, password);

      onLoginSuccess?.();
    } catch (error) {
      console.error(error);
      setErrorMessage('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-login-card">
        <p className="section-label">Admin</p>
        <h1>관리자 로그인</h1>
        <p>
          신랑·신부님만 하객이 업로드한 사진과 영상을 확인할 수 있습니다.
        </p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="관리자 이메일"
              required
            />
          </label>

          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
            />
          </label>

          {errorMessage && (
            <div className="upload-message upload-message--error">
              {errorMessage}
            </div>
          )}

          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </section>
    </main>
  );
}