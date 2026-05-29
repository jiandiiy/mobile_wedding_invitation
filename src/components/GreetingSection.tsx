import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { WeddingConfig } from '../types/wedding';

type GreetingSectionProps = {
  config: WeddingConfig;
};

type ContactGroup = {
  title: string;
  contacts: ContactItem[];
};

type ContactItem = {
  relation: string;
  name: string;
  phone: string;
};

type RevealItem =
  | {
      type: 'title';
      id: string;
      text: string;
      className: string;
    }
  | {
      type: 'date';
      id: string;
      text: string;
    }
  | {
      type: 'message';
      id: string;
      text: string;
    }
  | {
      type: 'space';
      id: string;
    }
  | {
      type: 'photo';
      id: 'bride-photo' | 'groom-photo';
    }
  | {
      type: 'family';
      id: 'groom-family' | 'bride-family';
    }
  | {
      type: 'contact-button';
      id: 'contact-button';
    };

const CONTACT_GROUPS: ContactGroup[] = [
  {
    title: '신랑측',
    contacts: [
      {
        relation: '신랑',
        name: '신동윤',
        phone: '010-4492-2623',
      },
      {
        relation: '신랑 아버지',
        name: '신교철',
        phone: '010-5348-9454',
      },
      {
        relation: '신랑 어머니',
        name: '박소영',
        phone: '010-2053-9454',
      },
    ],
  },
  {
    title: '신부측',
    contacts: [
      {
        relation: '신부',
        name: '신지안',
        phone: '010-4966-3066',
      },
      {
        relation: '신부 아버지',
        name: '신용진',
        phone: '010-8520-3066',
      },
      {
        relation: '신부 어머니',
        name: '이미라',
        phone: '010-7685-0878',
      },
    ],
  },
];

export function GreetingSection({ config }: GreetingSectionProps) {
  const { couple, greeting } = config;

  const [isContactOpen, setIsContactOpen] = useState(false);

  const revealItems = useMemo<RevealItem[]>(() => {
    const titleItems: RevealItem[] = greeting.title
      .split('\n')
      .map((line, index) => ({
        type: 'title',
        id: `title-${index}`,
        text: line,
        className:
          line.toLowerCase() === 'day'
            ? 'greeting-heading__serif greeting-heading__serif--day'
            : 'greeting-heading__serif',
      }));

    const messageItems: RevealItem[] = greeting.message.map((line, index) =>
      line === ''
        ? {
            type: 'space',
            id: `message-space-${index}`,
          }
        : {
            type: 'message',
            id: `message-${index}`,
            text: line,
          },
    );

    return [
      ...titleItems,
      {
        type: 'date',
        id: 'date',
        text: greeting.dateText,
      },
      ...messageItems,
      {
        type: 'photo',
        id: 'bride-photo',
      },
      {
        type: 'photo',
        id: 'groom-photo',
      },
      {
        type: 'family',
        id: 'groom-family',
      },
      {
        type: 'family',
        id: 'bride-family',
      },
      {
        type: 'contact-button',
        id: 'contact-button',
      },
    ];
  }, [greeting.dateText, greeting.message, greeting.title]);

  const { sectionRef, visibleIndex } = useSequentialReveal({
    itemCount: revealItems.filter((item) => item.type !== 'space').length,
    interval: 260,
  });

  let revealIndex = -1;

  const getRevealClassName = (className = '') => {
    revealIndex += 1;

    return [
      className,
      'reveal-up',
      visibleIndex >= revealIndex ? 'is-visible' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <>
      <section ref={sectionRef} className="content-section greeting-section">
        <div className="greeting-heading">
          {revealItems.map((item) => {
            if (item.type !== 'title') return null;

            return (
              <span
                key={item.id}
                className={getRevealClassName(item.className)}
              >
                {item.text}
              </span>
            );
          })}
        </div>

        {revealItems.map((item) => {
          if (item.type !== 'date') return null;

          return (
            <p key={item.id} className={getRevealClassName('greeting-date')}>
              {item.text}
            </p>
          );
        })}

        <div className="greeting-message">
          {revealItems.map((item) => {
            if (item.type === 'space') {
              return <div key={item.id} className="greeting-message__space" />;
            }

            if (item.type !== 'message') return null;

            return (
              <p key={item.id} className={getRevealClassName()}>
                {item.text}
              </p>
            );
          })}
        </div>

        <div className="couple-photo-row">
          <article
            className={getRevealClassName(
              'couple-photo-card couple-photo-card--bride',
            )}
          >
            <div className="couple-photo-card__image image-tone image-tone--soft-mono">
              <img src="/images/bride.jpg" alt="신부 사진" />
            </div>

            <p className="couple-photo-card__caption">
              <em>신부.</em>
              <strong>{couple.bride.name}</strong>
            </p>
          </article>

          <article
            className={getRevealClassName(
              'couple-photo-card couple-photo-card--groom',
            )}
          >
            <div className="couple-photo-card__image image-tone image-tone--soft-mono">
              <img src="/images/groom.jpg" alt="신랑 사진" />
            </div>

            <p className="couple-photo-card__caption">
              <em>신랑.</em>
              <strong>{couple.groom.name}</strong>
            </p>
          </article>
        </div>

        <div className="couple-family-list">
          <div className={getRevealClassName('couple-family-list__row')}>
            <span className="couple-family-list__parents">
              {couple.groom.fatherName} · {couple.groom.motherName}
            </span>
            <span className="couple-family-list__relation">의 아들</span>
            <strong className="couple-family-list__person">
              {couple.groom.fullName}
            </strong>
          </div>

          <div className={getRevealClassName('couple-family-list__row')}>
            <span className="couple-family-list__parents">
              {couple.bride.fatherName} · {couple.bride.motherName}
            </span>
            <span className="couple-family-list__relation">의 딸</span>
            <strong className="couple-family-list__person">
              {couple.bride.fullName}
            </strong>
          </div>
        </div>

        <div className={getRevealClassName('greeting-contact-area')}>
          <button
            type="button"
            className="greeting-contact-button"
            onClick={() => setIsContactOpen(true)}
          >
            연락하기
          </button>
        </div>
      </section>

      {isContactOpen && (
        <ContactModal onClose={() => setIsContactOpen(false)} />
      )}
    </>
  );
}

type ContactModalProps = {
  onClose: () => void;
};

function ContactModal({ onClose }: ContactModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      alert('연락처가 복사되었습니다.');
    } catch (error) {
      console.error(error);
      alert('복사에 실패했습니다. 연락처를 직접 선택해 주세요.');
    }
  };

  return createPortal(
    <div
      className="contact-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <button
        type="button"
        className="contact-modal__backdrop"
        onClick={onClose}
        aria-label="연락처 모달 닫기"
      />

      <div className="contact-modal__panel">
        <button
          type="button"
          className="contact-modal__close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="contact-modal__heading">
          <span />
          <h2 id="contact-modal-title">Contact</h2>
          <span />
        </div>

        {CONTACT_GROUPS.map((group) => (
          <section key={group.title} className="contact-group">
            <h3>{group.title}</h3>

            <div className="contact-list">
              {group.contacts.map((contact) => (
                <div
                  key={`${group.title}-${contact.relation}-${contact.name}`}
                  className="contact-row"
                >
                  <span className="contact-row__relation">
                    {contact.relation}
                  </span>

                  <strong className="contact-row__name">
                    {contact.name}
                  </strong>

                  <div className="contact-row__actions">
                    <a
                      href={`tel:${contact.phone.replaceAll('-', '')}`}
                      className="contact-row__button"
                      aria-label={`${contact.name}에게 전화하기`}
                    >
                      <span aria-hidden="true" className="phone-icon" />
                    </a>

                    <button
                      type="button"
                      className="contact-row__button"
                      onClick={() => handleCopyPhone(contact.phone)}
                      aria-label={`${contact.name} 연락처 복사`}
                    >
                      <span aria-hidden="true" className="copy-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}

type UseSequentialRevealParams = {
  itemCount: number;
  interval?: number;
};

function useSequentialReveal({
  itemCount,
  interval = 220,
}: UseSequentialRevealParams) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(-1);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setHasStarted(true);
        observer.unobserve(entry.target);
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -20% 0px',
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    setVisibleIndex(-1);

    const timers = Array.from({ length: itemCount }, (_, index) =>
      window.setTimeout(() => {
        setVisibleIndex(index);
      }, index * interval),
    );

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [hasStarted, interval, itemCount]);

  return {
    sectionRef,
    visibleIndex,
  };
}
