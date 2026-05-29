import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { FormEvent } from 'react';

// ─── Firestore ───────────────────────────────────────────────
import {
  collection,
  addDoc,
  updateDoc,
  //deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // 본인 firebase 초기화 경로에 맞게 수정

// ─── 타입 ─────────────────────────────────────────────────────
type GuestbookTarget = 'groom' | 'bride';

type GuestbookMessage = {
  id: string;           // Firestore 문서 ID
  target: GuestbookTarget;
  name: string;
  message: string;
  password: string;     // 평문 저장 (청첩장 수준)
  createdAt: string;    // 표시용 포맷 문자열
};

const TARGET_LABEL: Record<GuestbookTarget, string> = {
  groom: '신랑에게',
  bride: '신부에게',
};

const PREVIEW_COUNT = 4;

// ─── 메인 섹션 ────────────────────────────────────────────────
export function GuestbookSection() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [target, setTarget] = useState<GuestbookTarget>('groom');
  const [isWriting, setIsWriting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Firestore 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, 'guestbook'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const ts = data.createdAt as Timestamp | null;

        return {
          id: docSnap.id,
          target: data.target as GuestbookTarget,
          name: data.name as string,
          message: data.message as string,
          password: data.password as string,
          createdAt: ts
            ? ts.toDate().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
            : '',
        } satisfies GuestbookMessage;
      });

      setMessages(docs);
    });

    return () => unsubscribe();
  }, []);

  const filteredMessages = useMemo(
    () => messages.filter((item) => item.target === target),
    [messages, target],
  );

  const previewMessages = filteredMessages.slice(0, PREVIEW_COUNT);

  return (
    <section className="content-section guestbook-section">
      <h2 className="guestbook-section__heading">방명록</h2>
      {/* 탭 */}
      <div
        className="guestbook-tabs"
        role="tablist"
        aria-label="방명록 대상 선택"
      >
        <button
          type="button"
          className={target === 'groom' ? 'is-active' : ''}
          onClick={() => setTarget('groom')}
          aria-pressed={target === 'groom'}
        >
          신랑에게
        </button>

        <button
          type="button"
          className={target === 'bride' ? 'is-active' : ''}
          onClick={() => setTarget('bride')}
          aria-pressed={target === 'bride'}
        >
          신부에게
        </button>
      </div>

      {/* 카드 그리드 */}
      {previewMessages.length === 0 ? (
        <div className="guestbook-empty">
          <p>아직 작성된 방명록이 없습니다.</p>
          <p>첫 방명록을 작성해주세요.</p>
        </div>
      ) : (
        <div className="guestbook-cards">
          {previewMessages.map((item) => (
            <GuestbookCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="guestbook-section__actions">
        {filteredMessages.length > 0 && (
          <button
            type="button"
            className="guestbook-action-button"
            onClick={() => setIsModalOpen(true)}
          >
            전체보기
          </button>
        )}

        <button
          type="button"
          className="guestbook-action-button guestbook-action-button--primary"
          onClick={() => setIsWriting((prev) => !prev)}
        >
          {isWriting ? '닫기' : '작성하기'}
        </button>
      </div>

      {/* 작성 폼 */}
      {isWriting && (
        <WriteForm
          target={target}
          onChangeTarget={setTarget}
          onSuccess={() => setIsWriting(false)}
        />
      )}

      {/* 전체보기 모달 */}
      {isModalOpen &&
        createPortal(
          <GuestbookModal
            messages={filteredMessages}
            target={target}
            onClose={() => setIsModalOpen(false)}
          />,
          document.body,
        )}
    </section>
  );
}

// ─── 카드 (미리보기) ──────────────────────────────────────────
type GuestbookCardProps = { item: GuestbookMessage };

function GuestbookCard({ item }: GuestbookCardProps) {
  return (
    <article className="guestbook-card">
      <p className="guestbook-card__message">{item.message}</p>
      <footer className="guestbook-card__footer">
        <span>– {item.name} –</span>
      </footer>
    </article>
  );
}

// ─── 작성 폼 ──────────────────────────────────────────────────
type WriteFormProps = {
  target: GuestbookTarget;
  onChangeTarget: (t: GuestbookTarget) => void;
  onSuccess: () => void;
};

function WriteForm({ target, onChangeTarget, onSuccess }: WriteFormProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimName = name.trim();
    const trimMessage = message.trim();
    const trimPassword = password.trim();

    if (!trimName || !trimMessage || !trimPassword) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'guestbook'), {
        target,
        name: trimName,
        message: trimMessage,
        password: trimPassword, // 평문 저장
        createdAt: serverTimestamp(),
      });
      onSuccess();
    } catch (error) {
      console.error('방명록 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="guestbook-form" onSubmit={handleSubmit}>
      <label className="guestbook-form__label">
        남기는 대상
        <select
          value={target}
          onChange={(e) => onChangeTarget(e.target.value as GuestbookTarget)}
        >
          <option value="groom">신랑에게</option>
          <option value="bride">신부에게</option>
        </select>
      </label>

      <label className="guestbook-form__label">
        이름
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해 주세요"
          maxLength={20}
        />
      </label>

      <label className="guestbook-form__label">
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="수정 시 사용할 비밀번호"
          maxLength={20}
        />
      </label>

      <label className="guestbook-form__label">
        메시지
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="축하 메시지를 남겨주세요"
          maxLength={200}
          rows={5}
        />
      </label>

      <button
        type="submit"
        className="guestbook-submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? '저장 중...' : '방명록 남기기'}
      </button>
    </form>
  );
}

// ─── 전체보기 모달 ────────────────────────────────────────────
type GuestbookModalProps = {
  messages: GuestbookMessage[];
  target: GuestbookTarget;
  onClose: () => void;
};

function GuestbookModal({ messages, target, onClose }: GuestbookModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="guestbook-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestbook-modal-title"
    >
      <button
        type="button"
        className="guestbook-modal__backdrop"
        onClick={onClose}
        aria-label="모달 닫기"
      />

      <div className="guestbook-modal__panel">
        <button
          type="button"
          className="guestbook-modal__close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="guestbook-modal__heading">
          <span className="guestbook-heading__line" />
          <span className="guestbook-heading__title">Wedding Guest book</span>
          <span className="guestbook-heading__line" />
        </div>

        <h2 id="guestbook-modal-title" className="guestbook-modal__h2">
          {TARGET_LABEL[target]}
        </h2>

        <ul className="guestbook-modal__list">
          {messages.map((item) => (
            <GuestbookModalItem key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── 모달 아이템 (수정 포함) ──────────────────────────────────
type GuestbookModalItemProps = { item: GuestbookMessage };

type ItemMode = 'view' | 'password-check' | 'edit' | 'delete-confirm';

function GuestbookModalItem({ item }: GuestbookModalItemProps) {
  const [mode, setMode] = useState<ItemMode>('view');
  const [inputPassword, setInputPassword] = useState('');
  const [editMessage, setEditMessage] = useState(item.message);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // 수정 모드 진입 시 textarea 포커스
  useEffect(() => {
    if (mode === 'edit') {
      editRef.current?.focus();
    }
  }, [mode]);

  // 비밀번호 확인 후 → 수정/삭제 선택 화면으로
  const handlePasswordCheck = () => {
    if (inputPassword === item.password) {
      setPasswordError(false);
      setMode('delete-confirm');
    } else {
      setPasswordError(true);
    }
  };

  //const handleDelete = async () => {
  //  setIsSubmitting(true);
  //  try {
  //    await deleteDoc(doc(db, 'guestbook', item.id));
  //    // 삭제 후 모달 아이템은 onSnapshot이 알아서 제거
  //  } catch (error) {
  //    console.error('삭제 실패:', error);
  //    alert('삭제에 실패했습니다. 다시 시도해 주세요.');
  //    setIsSubmitting(false);
  //  }
  //};

  const handleEdit = async () => {
    const trimmed = editMessage.trim();
    if (!trimmed || trimmed === item.message) {
      setMode('view');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateDoc(doc(db, 'guestbook', item.id), {
        message: trimmed,
      });
      setMode('view');
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMode('view');
    setInputPassword('');
    setEditMessage(item.message);
    setPasswordError(false);
  };

  // ── view 모드
  if (mode === 'view') {
    return (
      <li className="guestbook-modal__item">
        <p className="guestbook-modal__message">{item.message}</p>
        <div className="guestbook-modal__meta">
          <div className="guestbook-modal__meta-left">
            <strong>{item.name}</strong>
            <span>{item.createdAt}</span>
          </div>
          {/* 비밀번호 확인 진입점 — 수정/삭제는 확인 후 선택 */}
          <button
            type="button"
            className="guestbook-edit-trigger"
            onClick={() => setMode('password-check')}
          >
            수정 ·
          </button>
        </div>
      </li>
    );
  }

  // ── 비밀번호 확인 모드
  if (mode === 'password-check') {
    return (
      <li className="guestbook-modal__item guestbook-modal__item--editing">
        <p className="guestbook-modal__item-name">{item.name}</p>

        <div className="guestbook-password-check">
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => {
              setInputPassword(e.target.value);
              setPasswordError(false);
            }}
            placeholder="비밀번호를 입력해 주세요"
            maxLength={20}
            // 엔터 키로도 확인 가능
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePasswordCheck();
            }}
          />
          {passwordError && (
            <p className="guestbook-password-check__error">
              비밀번호가 맞지 않습니다.
            </p>
          )}
          <div className="guestbook-modal__edit-actions">
            <button
              type="button"
              className="guestbook-edit-button guestbook-edit-button--confirm"
              onClick={handlePasswordCheck}
            >
              확인
            </button>
            <button
              type="button"
              className="guestbook-edit-button"
              onClick={handleCancel}
            >
              취소
            </button>
          </div>
        </div>
      </li>
    );
  }

  // ── 비밀번호 확인 후 수정/삭제 선택 모드
  if (mode === 'delete-confirm') {
    return (
      <li className="guestbook-modal__item guestbook-modal__item--editing">
        <p className="guestbook-modal__item-name">{item.name}</p>
        <p className="guestbook-modal__delete-desc">
          수정하거나 삭제할 수 있습니다.
        </p>
        <div className="guestbook-modal__edit-actions">
          <button
            type="button"
            className="guestbook-edit-button guestbook-edit-button--confirm"
            onClick={() => setMode('edit')}
          >
            수정
          </button>
          {/*<button
            type="button"
            className="guestbook-edit-button guestbook-edit-button--delete"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? '삭제 중...' : '삭제'}
          </button>*/}
          <button
            type="button"
            className="guestbook-edit-button"
            onClick={handleCancel}
          >
            취소
          </button>
        </div>
      </li>
    );
  }

  // ── 편집 모드
  return (
    <li className="guestbook-modal__item guestbook-modal__item--editing">
      <p className="guestbook-modal__item-name">{item.name}</p>

      <textarea
        ref={editRef}
        className="guestbook-edit-textarea"
        value={editMessage}
        onChange={(e) => setEditMessage(e.target.value)}
        maxLength={200}
        rows={4}
      />

      <div className="guestbook-modal__edit-actions">
        <button
          type="button"
          className="guestbook-edit-button guestbook-edit-button--confirm"
          onClick={handleEdit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          className="guestbook-edit-button"
          onClick={handleCancel}
        >
          취소
        </button>
      </div>
    </li>
  );
}
