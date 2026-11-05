import { useState } from 'react';

import { useTypingEffect } from '../hooks/useTypingEffect';

type InfoItem = {
  id: string;
  label: string;   // 왼쪽 영문 라벨
  title: string;   // 제목
  lines: string[]; // 줄 단위 본문
};

const INFO_ITEMS: InfoItem[] = [
  {
    id: 'meal',
    label: 'MEAL',
    title: '식사 안내',
    lines: ['3층 연회장 뷔페 이용'],
  },
  {
    id: 'parking',
    label: 'PARKING',
    title: '주차 안내',
    lines: [
      '강변 테크노마트 건물 지하 3층 ~ 지하 5층 주차장 이용 (2시간 무료, 출차 전 웨딩홀 안내데스크에서 주차등록 필요)',
    ],
  },
];

export function InformationSection() {
  // 한 번에 하나만 열림 (여러 개를 열고 싶으면 string[]로 변경)
  const eyebrowRef = useTypingEffect<HTMLParagraphElement>();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  return (
    <section className="content-section info-section">
      <p ref={eyebrowRef} className="info-section__eyebrow">INFORMATION</p>
      <span className="info-section__line" aria-hidden="true" />
      <h2 className="info-section__title">안내 사항</h2>

      <ul className="info-list">
        {INFO_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <li key={item.id} className="info-item">
              <button
                type="button"
                className="info-item__header"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`info-panel-${item.id}`}
              >
                <span className="info-item__label">{item.label}</span>
                <span className="info-item__name">{item.title}</span>
                <span className="info-item__icon" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {/* grid 0fr → 1fr 로 높이 애니메이션 */}
              <div
                id={`info-panel-${item.id}`}
                className={`info-item__panel ${isOpen ? 'is-open' : ''}`}
                role="region"
                aria-hidden={!isOpen}
              >
                <div className="info-item__panel-inner">
                  {item.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}