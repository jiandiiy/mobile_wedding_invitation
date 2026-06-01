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
    dateText: '2027년 02월 28일 일요일 오후3시',
    timeText: '오후 3시',
    isoDate: '2027-02-28T15:00:00+09:00',
  },

  venue: {
  name: '웨딩스퀘어 강변',
  hall: '아모르홀',
  address: '서울시 광진구 광나루로 56길 85(구의동 546-4), 웨딩스퀘어 강변 4층 아모르홀',
  mapUrl: 'https://naver.me/FdCx2LFq',
  lat: 37.535095,
  lng: 127.095681,
  mapLinks: {
    kakao: 'https://kko.to/stczwqQlK8',
    naver: 'https://naver.me/FdCx2LFq',
    tmap: 'https://tmap.life/7357e7da',
  },
},

  greeting: {
    title: 'Our\nWedding\nDay',
    dateText: '2027.02.28 PM 3:00',
    message: [
      { text: '"하늘 아래 내가 받은 가장 커다란 선물은 오늘입니다.', bold: true },
    { text: '오늘 받은 선물 가운데서도 가장 아름다운 선물은 당신입니다."', bold: true },
      { text: '- 나태주, <선물> -', bold: true },
      '',
      '당신의 나지막한 목소리와 웃는 얼굴을 곁에서 지켜보는 것만으로도',
      '매일 아침 한 아름 바다를 안은 듯한 기쁨을 느낍니다.',
      '', 
      '이 기적 같은 선물을 소중히 여기며,', 
      '서로의 평범한 일상을 가장 특별한 순간으로', 
      '만들어가는 부부가 되겠습니다.',
      '저희의 행복한 시작을 함께 해주시고 응원 해주시면 감사하겠습니다.',
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
      bank: '국민은행',
      number: '504502-95-114485',
    },
    {
      relation: '어머니',
      holder: '박소영',
      bank: '우리은행',
      number: '467-08-177470',
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
      bank: '신한은행',
      number: '110-349-891741',
    },
    {
      relation: '어머니',
      holder: '이미라',
      bank: '신한은행',
      number: '110-501-074180',
    },
  ],
  },
};