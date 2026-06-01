export type Person = {
  name: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  role: 'groom' | 'bride';
};

export type WeddingDate = {
  dateText: string;
  timeText: string;
  isoDate: string;
};

export type Venue = {
  name: string;
  hall: string;
  address: string;
  mapUrl: string;
  lat?: number;
  lng?: number;
  mapLinks?: {
    naver?: string;
    kakao?: string;
    tmap?: string;
  };
};

export type GalleryImage = {
  id: number;
  src: string;
  alt: string;
};

export type VideoConfig = {
  src: string;
  poster?: string;
};

export type Account = {
  relation: string;
  holder: string;
  bank: string;
  number: string;
};

export type MessageItem = string | { text: string; bold?: boolean };

export type WeddingConfig = {
  couple: {
    groom: Person;
    bride: Person;
  };
  date: WeddingDate;
  venue: Venue;
  greeting: {
    title: string;
    dateText: string;
    message: MessageItem[];
  };
  gallery: GalleryImage[];
  video?: VideoConfig;
  accounts: {
    groom: Account[];
    bride: Account[];
  };
};