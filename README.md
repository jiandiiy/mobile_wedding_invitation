# mobile_wedding_invitation
# 💍 모바일 웨딩 청첩장

> React + TypeScript + Firebase로 구현한 모바일 웨딩 청첩장 웹앱입니다.

<br />

## 📌 프로젝트 소개

실제 결혼식에 사용하기 위해 직접 기획·개발한 모바일 청첩장입니다.  
단순한 정적 청첩장을 넘어, 하객이 직접 사진을 업로드하고 방명록을 남길 수 있는 **인터랙티브한 경험**을 목표로 했습니다.

<br />

## 🚀 주요 기능

| 기능 | 설명 |
|------|------|
| 📷 하객 사진 업로드 | 하객이 직접 찍은 사진·영상을 Firebase Storage에 업로드 |
| 📬 실시간 알림 | 업로드 시 Firebase Functions → 텔레그램 봇으로 즉시 알림 수신 |
| 📝 방명록 | Firestore 실시간 구독, 신랑·신부 탭 분리, 작성·수정 기능 |
| 🗂️ 전체보기 모달 | 방명록 전체 목록을 모달로 확인, 비밀번호 인증 후 수정 가능 |
| 📱 모바일 최적화 | 모바일 기기 기준으로 설계된 반응형 레이아웃 |

<br />

## 🛠️ 기술 스택

**Frontend**
- React 18 + TypeScript
- Vite
- React Router v6

**Backend / Infra**
- Firebase Firestore — 방명록 실시간 DB
- Firebase Storage — 하객 사진·영상 저장
- Firebase Functions (Node.js) — Storage 트리거 → 텔레그램 알림
- Firebase Hosting — 정적 배포

**기타**
- Telegram Bot API — 업로드 실시간 알림

<br />

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── GuestbookSection.tsx     # 방명록 섹션 (탭, 카드, 작성 폼, 모달)
│   ├── GuestUploadSection.tsx   # 사진 업로드 안내 + 링크 버튼
│   └── ...
├── pages/
│   └── GuestUploadPage.tsx      # 하객 업로드 랜딩 + 폼 (fade 전환)
├── services/
│   └── guestUploadService.ts    # Storage 업로드 로직
├── lib/
│   └── firebase.ts              # Firebase 초기화
└── App.tsx                      # 라우팅 설정
functions/
└── src/
    └── index.ts                 # onGuestUpload (Storage 트리거)
```

<br />

## ⚙️ 환경변수

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 설정합니다.

```env
VITE_WEDDING_ID=your_wedding_id
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Firebase Functions 환경변수는 아래와 같이 설정합니다.

```bash
firebase functions:secrets:set TELEGRAM_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

<br />

## 🔥 Firebase 데이터 구조

```
Firestore
└── guestbook/{docId}
    ├── target: "groom" | "bride"
    ├── name: string
    ├── message: string
    ├── password: string
    └── createdAt: Timestamp

Storage
└── weddings/{weddingId}/guest-snaps/{guestFolderName}/{fileName}
```

<br />

## 💡 구현 포인트

- **Firestore 실시간 구독** — `onSnapshot`으로 방명록을 실시간 반영, 별도 새로고침 불필요
- **Firebase Functions Storage 트리거** — 업로드 완료 즉시 텔레그램으로 파일명·업로더 정보 전송 (`asia-northeast1` 리전)
- **멀티 파일 업로드** — 이미지·영상 동시 선택, 드래그앤드롭 지원, 파일별 미리보기 카드
- **비밀번호 인증 수정** — 별도 인증 서버 없이 Firestore 문서 내 비밀번호 대조로 수정 플로우 구현
- **페이지 전환 애니메이션** — 랜딩 → 업로드 폼 화면 간 CSS fade 트랜지션

<br />

## 📄 라이선스

개인 프로젝트입니다. 코드 참고는 자유이나, 디자인 에셋(이미지, 폰트 등)의 무단 사용은 삼가주세요.
