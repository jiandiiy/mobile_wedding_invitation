import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { FormEvent } from 'react';
import { useTypingEffect } from '../hooks/useTypingEffect';


// ─── Firestore ───────────────────────────────────────────────
import {
  collection,
  addDoc,
  deleteDoc,
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
type BubbleSide = 'left' | 'right';

type GuestbookMessage = {
  id: string; // Firestore 문서 ID
  target: GuestbookTarget;
  name: string;
  message: string;
  password: string; // 평문 저장 (청첩장 수준)
  createdAt: string; // 표시용 포맷 문자열
};

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}.${mm}.${dd}`; // 예: 2026.11.04
};

const TARGET_LABEL: Record<GuestbookTarget, string> = {
  groom: '신랑에게',
  bride: '신부에게',
};

const PREVIEW_COUNT = 4;
const MAX_MESSAGE = 200;

// 인덱스 → 좌/우 (짝수: 왼쪽, 홀수: 오른쪽)
const getSide = (index: number): BubbleSide =>
  index % 2 === 0 ? 'left' : 'right';

// ─── 메인 섹션 ────────────────────────────────────────────────
export function GuestbookSection() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [target, setTarget] = useState<GuestbookTarget>('groom');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eyebrowRef = useTypingEffect<HTMLParagraphElement>();

  // Firestore 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'));

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
  createdAt: ts ? formatDate(ts.toDate()) : '',
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

  // 최신 4개를 가져온 뒤 뒤집어서, 오래된 글이 위 / 최신 글이 아래 (채팅 UX)
  const previewMessages = useMemo(
    () => filteredMessages.slice(0, PREVIEW_COUNT).reverse(),
    [filteredMessages],
  );

  // 참조를 고정해 모달의 useEffect가 매 렌더마다 재실행되지 않게 함
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <section className="content-section guestbook-section">
      <p ref={eyebrowRef} className="guestbook-section__eyebrow">GUESTBOOK</p>
  <span className="guestbook-section__line" aria-hidden="true" />
  
      <h2 className="guestbook-section__heading">축하 한마디</h2>
      <p className="guestbook-section__desc">
        따뜻한 축하의 한마디를 남겨주세요.
      </p>

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

      {/* 말풍선 목록 */}
      {previewMessages.length === 0 ? (
        <div className="guestbook-empty">
          <p>아직 작성된 글이 없습니다.</p>
        </div>
      ) : (
        <div className="guestbook-chat">
          {previewMessages.map((item, index) => (
            <GuestbookBubble
              key={item.id}
              item={item}
              side={getSide(index)}
            />
          ))}
        </div>
      )}

      {/* 전체보기 (4개 초과일 때만) — 삭제는 각 말풍선의 × 버튼으로 처리 */}
      {filteredMessages.length > PREVIEW_COUNT && (
        <button
          type="button"
          className="guestbook-more"
          onClick={() => setIsModalOpen(true)}
        >
          전체보기 ({filteredMessages.length})
        </button>
      )}

      {/* 작성 폼 (항상 노출) */}
      <WriteForm target={target} />

      {/* 전체보기 모달 */}
      {isModalOpen &&
        createPortal(
          <GuestbookModal
            messages={filteredMessages}
            target={target}
            onClose={handleCloseModal}
          />,
          document.body,
        )}
    </section>
  );
}

// ─── 말풍선 + × 삭제 버튼 (미리보기/모달 공용) ────────────────
type GuestbookBubbleProps = {
  item: GuestbookMessage;
  side: BubbleSide;
};

function GuestbookBubble({ item, side }: GuestbookBubbleProps) {
  const [isAsking, setIsAsking] = useState(false); // 비밀번호 입력창 표시 여부
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const closePanel = () => {
    setIsAsking(false);
    setInputPassword('');
    setPasswordError(false);
  };

  // 비밀번호 확인 → 확인창 → 삭제
  const handleDelete = async () => {
    if (inputPassword !== item.password) {
      setPasswordError(true);
      return;
    }
    if (!window.confirm('이 글을 삭제할까요?')) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'guestbook', item.id));
      // 성공하면 onSnapshot이 목록에서 제거하므로 별도 상태 정리 불필요
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해 주세요.');
      setIsDeleting(false);
    }
  };

  return (
    <div className={`guestbook-item guestbook-item--${side}`}>
      <article className={`guestbook-bubble guestbook-bubble--${side}`}>
        <span className="guestbook-bubble__name">{item.name}</span>
        <p className="guestbook-bubble__text">{item.message}</p>

        {/* 날짜 + × 삭제 버튼 한 줄 */}
        <div className="guestbook-bubble__footer">
          <time className="guestbook-bubble__date">{item.createdAt}</time>
          <button
            type="button"
            className="guestbook-bubble__delete"
            onClick={() => (isAsking ? closePanel() : setIsAsking(true))}
            aria-label={`${item.name}님의 글 삭제`}
            aria-expanded={isAsking}
          >
            ×
          </button>
        </div>
      </article>

      {isAsking && (
        <div className="guestbook-delete-panel">
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => {
              setInputPassword(e.target.value);
              setPasswordError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDelete();
            }}
            placeholder="작성 시 입력한 비밀번호"
            maxLength={20}
            autoFocus
            aria-label="삭제 비밀번호"
          />
          <button
            type="button"
            className="guestbook-delete-panel__confirm"
            onClick={handleDelete}
            disabled={isDeleting || !inputPassword}
          >
            {isDeleting ? '삭제 중' : '삭제'}
          </button>
          {passwordError && (
            <p className="guestbook-delete-panel__error">
              비밀번호가 맞지 않습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 작성 폼 ──────────────────────────────────────────────────
type WriteFormProps = {
  target: GuestbookTarget;
};

function WriteForm({ target }: WriteFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    !!name.trim() && !!password.trim() && !!message.trim() && !isSubmitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'guestbook'), {
        target,
        name: name.trim(),
        message: message.trim(),
        password: password.trim(), // 평문 저장
        createdAt: serverTimestamp(),
      });
      // 등록 성공 시 모든 입력값 초기화
      setName('');
      setPassword('');
      setMessage('');
    } catch (error) {
      console.error('방명록 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="guestbook-form" onSubmit={handleSubmit}>
      <div className="guestbook-form__meta">
        <label className="guestbook-form__field">
          <span className="guestbook-form__from">from</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            maxLength={20}
          />
        </label>

        <input
          className="guestbook-form__field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="삭제 비밀번호"
          maxLength={20}
          aria-label="삭제 비밀번호"
        />

        <span className="guestbook-form__count">
          {message.length} / {MAX_MESSAGE}
        </span>
      </div>

      <div className="guestbook-form__composer">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="축하 메시지를 입력하세요"
          maxLength={MAX_MESSAGE}
        />
       <button
  type="submit"
  className="guestbook-form__send"
  disabled={!canSubmit}
  aria-label="메시지 등록"
>
  {isSubmitting ? (
    <span className="guestbook-form__sending">···</span>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"   // 버튼 color를 그대로 따라감
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )}
</button>
      </div>
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

        {/* 모달도 같은 말풍선 컴포넌트를 재사용 (최신 글이 위) */}
        <div className="guestbook-chat">
          {messages.map((item, index) => (
            <GuestbookBubble
              key={item.id}
              item={item}
              side={getSide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
