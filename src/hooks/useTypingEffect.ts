// src/hooks/useTypingEffect.ts
import { useLayoutEffect, useRef } from 'react';

/**
 * 요소의 텍스트를 한 글자씩 타이핑합니다.
 * @param speed   글자당 간격(ms)
 * @param enabled false인 동안은 텍스트를 숨기고 커서만 보여 줍니다.
 */
export function useTypingEffect<T extends HTMLElement>(speed = 280, enabled = true) {
  const ref = useRef<T>(null);

  // useLayoutEffect: 페인트 전에 텍스트를 비워 전체 문장이 잠깐 보이는 현상을 막습니다.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 원본은 최초 1회만 저장합니다 (텍스트를 비운 뒤에도 원문을 유지하기 위함)
    const fullText = (el.dataset.typingText ??= el.textContent ?? '');
    const chars = Array.from(fullText);

    el.setAttribute('aria-label', fullText);
    el.textContent = '';
    el.classList.remove('is-typed');
    el.classList.add('is-typing');

    if (!enabled) return;

    let index = 0;
    let timer: number | undefined;

    const type = () => {
      index += 1;
      el.textContent = chars.slice(0, index).join('');

      if (index < chars.length) {
        timer = window.setTimeout(type, speed);
      } else {
        el.classList.remove('is-typing');
        el.classList.add('is-typed');
      }
    };

    // 화면에 50% 이상 보이는 순간 시작
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          type();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [speed, enabled]);

  return ref;
}