import { useEffect, useRef, useState } from 'react';

import type { WeddingConfig } from '../types/wedding';

type WeddingDateSectionProps = {
  config: WeddingConfig;
};

type CalendarItem =
  | {
      type: 'empty';
      key: string;
    }
  | {
      type: 'day';
      key: string;
      day: number;
    };

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function WeddingDateSection({ config }: WeddingDateSectionProps) {
  const weddingDate = new Date(config.date.isoDate);

  const year = weddingDate.getFullYear();
  const month = weddingDate.getMonth();
  const weddingDay = weddingDate.getDate();

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
  }).format(weddingDate);

  const fullDateLabel = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
  }).format(weddingDate);

  const firstDateOfMonth = new Date(year, month, 1);
  const lastDateOfMonth = new Date(year, month + 1, 0);

  const firstDayIndex = firstDateOfMonth.getDay();
  const daysInMonth = lastDateOfMonth.getDate();

  const leadingEmptyDays: CalendarItem[] = Array.from(
    { length: firstDayIndex },
    (_, index) => ({
      type: 'empty',
      key: `empty-start-${index}`,
    }),
  );

  const monthDays: CalendarItem[] = Array.from(
    { length: daysInMonth },
    (_, index) => ({
      type: 'day',
      key: `day-${index + 1}`,
      day: index + 1,
    }),
  );

  const trailingEmptyDays: CalendarItem[] = Array.from(
    { length: 42 - leadingEmptyDays.length - monthDays.length },
    (_, index) => ({
      type: 'empty',
      key: `empty-end-${index}`,
    }),
  );

  const calendarDays = [
    ...leadingEmptyDays,
    ...monthDays,
    ...trailingEmptyDays,
  ];

  const today = new Date();
today.setHours(0, 0, 0, 0);

const targetDate = new Date(weddingDate);
targetDate.setHours(0, 0, 0, 0);

const diffTime = targetDate.getTime() - today.getTime();
  const dDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const { sectionRef, visibleIndex } = useSequentialReveal({
    itemCount: 5,
    interval: 260,
  });

  const getRevealClassName = (index: number, className = '') =>
    [
      className,
      'reveal-up',
      visibleIndex >= index ? 'is-visible' : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <section ref={sectionRef} className="content-section wedding-date-section">
      <h2 className={getRevealClassName(0)}>{monthLabel}.</h2>

      <div className="calendar-card">
        <div className={getRevealClassName(1, 'calendar-weekdays')}>
          {WEEK_DAYS.map((weekDay) => (
            <span key={weekDay}>{weekDay}</span>
          ))}
        </div>

        <div className={getRevealClassName(2, 'calendar-grid')}>
          {calendarDays.map((item) =>
            item.type === 'empty' ? (
              <span key={item.key} className="calendar-day is-empty" />
            ) : (
              <span
                key={item.key}
                className={
                  item.day === weddingDay
                    ? 'calendar-day is-wedding-day'
                    : 'calendar-day'
                }
              >
                {item.day}
              </span>
            ),
          )}
        </div>

        <p className={getRevealClassName(3, 'calendar-card__date')}>
          {fullDateLabel}
        </p>

        <p className={getRevealClassName(4, 'calendar-card__dday')}>
          {dDay >= 0 ? `D-${dDay}일 ෆ` : '함께해주셔서 감사합니다 ෆ'}
        </p>
      </div>
    </section>
  );
}

type UseSequentialRevealParams = {
  itemCount: number;
  interval?: number;
};

function useSequentialReveal({
  itemCount,
  interval = 180,
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
        threshold: 0.18,
        rootMargin: '0px 0px -12% 0px',
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

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