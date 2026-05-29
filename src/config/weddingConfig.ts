import type { WeddingConfig } from '../types/wedding';

export const weddingConfig: WeddingConfig = {
  couple: {
    groom: {
      role: 'groom',
      name: '동윤',
      fullName: '신동윤',
      fatherName: '신교철',
      motherName: '박소영',
    },
    bride: {
      role: 'bride',
      name: '지안',
      fullName: '신지안',
      fatherName: '신용진',
      motherName: '이미라',
    },
  },

  date: {
    dateText: '2027년 02월 28일 일요일',
    timeText: '오후 3시',
    isoDate: '2027-02-28T15:00:00+09:00',
  },

  venue: {
  name: '웨딩스퀘어 강변',
  hall: '아모르홀',
  address: '서울시 광진구 광나루로 56길 85, 4층',
  mapUrl: 'https://naver.me/59UlRoZ3',
  lat: 37.535095,
  lng: 127.095681,
  mapLinks: {
    kakao: 'https://map.kakao.com/link/map/웨딩스퀘어+강변점(테크노마트+3,4층),37.5357252,127.0956922',
    naver: 'https://naver.me/59UlRoZ3',
    tmap: 'https://tmap.life/place?name=웨딩스퀘어강변&lat=37.5357252&lon=127.0956922',
  },
},

  greeting: {
    title: 'Our\nWedding\nDay',
    dateText: '2027.02.28 PM 3:00',
    message: [
      '서로에게 가장 다정한 계절이 되어준 두 사람이', 
      '이제 하나의 길을 함께 걸어가려 합니다.', 
      '',
      '소중한 분들만 모시고 진행하는 작은 결혼식이지만,',
      '저희의 하나 됨을 지켜 봐주시고 격려 해주신다면,', 
      '더 없는 기쁨으로 평생 간직 하겠습니다.', 
      '앞으로 맞이할 저희의 봄날을 함께 축복해주세요.',
    ],
  },

  gallery: [
    {
      id: 1,
      src: '/images/gallery-1.jpg',
      alt: '웨딩 갤러리 이미지 1',
    },
    {
      id: 2,
      src: '/images/gallery-2.jpg',
      alt: '웨딩 갤러리 이미지 2',
    },
    {
      id: 3,
      src: '/images/gallery-3.jpg',
      alt: '웨딩 갤러리 이미지 3',
    },
    {
      id: 4,
      src: '/images/gallery-4.jpg',
      alt: '웨딩 갤러리 이미지 4',
    },
    {
      id: 5,
      src: '/images/gallery-5.jpg',
      alt: '웨딩 갤러리 이미지 5',
    },
    {
      id: 6,
      src: '/images/gallery-6.jpg',
      alt: '웨딩 갤러리 이미지 6',
    },
  ],

  video: {
    src: '/videos/wedding-film.mp4',
    poster: '/images/video-poster.jpg',
  },

  accounts: {
    groom: [
      {
        relation: '신랑',
        holder: '신동윤',
        bank: '카카오뱅크',
        number: '3333-03-9362064',
      },
    {
      relation: '아버지',
      holder: '신교철',
      bank: '카카오뱅크',
      number: '3333-03-9362064',
    },
    {
      relation: '어머니',
      holder: '박소영',
      bank: '카카오뱅크',
      number: '3333-03-9362064',
    },
  ],
  bride: [
    {
      relation: '신부',
      holder: '신지안',
      bank: '카카오뱅크',
      number: '3333-04-9083408',
    },
    {
      relation: '아버지',
      holder: '신용진',
      bank: '카카오뱅크',
      number: '3333-04-9083408',
    },
    {
      relation: '어머니',
      holder: '이미라',
      bank: '카카오뱅크',
      number: '3333-04-9083408',
    },
  ],
  },
};