import { useEffect, useRef, useState } from 'react';

import type { WeddingConfig } from '../types/wedding';
import { Toast } from './Toast';

type LocationSectionProps = {
  config: WeddingConfig;
};

const NAVER_MAP_SCRIPT_ID = 'naver-map-script';

const DEFAULT_LATITUDE = 37.535095;
const DEFAULT_LONGITUDE = 127.095681;

const TRANSPORT_ITEMS = [
  {
    label: '지하철',
    descriptions: ['2호선 강변역 (강변테크노마트 판매동 B1 연결)'],
  },
  {
    label: '버스',
    descriptions: [
      '광진01, 광진03, 광진04, 광진05, 강동01, 1, 1-1, 1-3, 9, 9-1, 11, 13, 13-2, 15, 78, 91, 92, 93, 95, 96, 97, 100, 112-1, 1006, 1112, 1113, 1113-1, 1113-2, 1117, 1650, 1660, 2000-1, 2000-3, 2224, M2352, 3212, 3214, 5600, 5700A, 5700B, 6705, 9304번 이용',
    ],
  },
  {
    label: '자가용 이용시',
    descriptions: [
      '내비게이션 검색: 웨딩스퀘어 강변',
      '주차: 강변 테크노마트 건물 내 지하주차장 이용',
    ],
  },
];

export function LocationSection({ config }: LocationSectionProps) {
  const { venue } = config;

  const mapRef = useRef<HTMLDivElement | null>(null);
  const isMapInitializedRef = useRef(false);

  const [toastMessage, setToastMessage] = useState('');
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  const naverMapUrl = venue.mapLinks?.naver ?? venue.mapUrl;
  const kakaoMapUrl = venue.mapLinks?.kakao ?? venue.mapUrl;
  const tMapUrl = venue.mapLinks?.tmap ?? venue.mapUrl;

  const latitude = venue.lat ?? DEFAULT_LATITUDE;
  const longitude = venue.lng ?? DEFAULT_LONGITUDE;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(venue.address);
      setToastMessage('주소가 복사되었습니다.');
    } catch (error) {
      console.error(error);
      setToastMessage('주소 복사에 실패했습니다. 주소를 직접 선택해 주세요.');
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      setMapStatus('error');
      return;
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.naver?.maps) {
        setMapStatus('error');
        return;
      }

      if (isMapInitializedRef.current) return;

      const position = new window.naver.maps.LatLng(latitude, longitude);

      const map = new window.naver.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
        minZoom: 12,
        maxZoom: 19,
        scrollWheel: false,
        draggable: true,
        pinchZoom: true,
        mapDataControl: false,
        scaleControl: false,
        logoControl: true,
        mapTypeControl: false,
        zoomControl: false,
      });

      new window.naver.maps.Marker({
        position,
        map,
      });

      isMapInitializedRef.current = true;
      setMapStatus('ready');
    };

    if (window.naver?.maps) {
      initializeMap();
      return;
    }

    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', initializeMap);
      existingScript.addEventListener('error', () => setMapStatus('error'));

      return () => {
        existingScript.removeEventListener('load', initializeMap);
      };
    }

    const script = document.createElement('script');

    script.id = NAVER_MAP_SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = initializeMap;
    script.onerror = () => {
      setMapStatus('error');
    };

    document.head.appendChild(script);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!toastMessage) return;

    const timerId = window.setTimeout(() => {
      setToastMessage('');
    }, 2200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toastMessage]);

  return (
    <section className="content-section location-section">
      <h2 className="location-section__title">WEDDING LOCATION</h2>

      <p className="location-section__venue">{venue.name}</p>

      <div className="location-map-box">
        <div
          ref={mapRef}
          className="location-map-box__map"
          aria-label={`${venue.name} 지도`}
        >
          {mapStatus === 'loading' && (
            <span className="location-map-box__message">
              지도를 불러오는 중입니다.
            </span>
          )}

          {mapStatus === 'error' && (
            <span className="location-map-box__message">
              지도를 불러오지 못했습니다.
            </span>
          )}
        </div>

        <div className="location-address-row">
          <p>{venue.address}</p>

          <button
            type="button"
            className="location-address-row__copy"
            onClick={handleCopyAddress}
            aria-label="주소 복사"
>
  <span aria-hidden="true" className="copy-icon" />
</button>
        </div>
      </div>

      <div className="transport-list">
        {TRANSPORT_ITEMS.map((item) => (
          <article key={item.label} className="transport-item">
            <strong>{item.label}</strong>

            <div>
              {item.descriptions.map((description) => (
                <p key={description}>{description}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="location-map-actions">
        <a href={naverMapUrl} target="_blank" rel="noreferrer">
          <span>N</span>
          네이버 지도
        </a>

        <a href={tMapUrl} target="_blank" rel="noreferrer">
          <span>T</span>
          티맵
        </a>

        <a href={kakaoMapUrl} target="_blank" rel="noreferrer">
          <span>K</span>
          카카오내비
        </a>
      </div>

      <Toast message={toastMessage} />
    </section>
  );
}