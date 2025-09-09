# AI Character Chat

AI 캐릭터와 대화를 나눌 수 있는 **AI 채팅 서비스**입니다.  
Next.js 프론트엔드와 Supabase + Prisma 백엔드를 기반으로 하며, **Anthropic Claude API**를 사용합니다.

---

## 🚀 실행 방법

### 1. 저장소 클론

```bash
git clone git@github.com:manonkim2/ai-character-chat.git
cd ai-character-chat
```

### 2. 의존성 설치

```bash
yarn install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 아래 항목을 채워주세요.  
`.env.example` 파일을 참고하세요.

### 4. Prisma 초기화

```bash
npx prisma migrate dev
```

### 5. 로컬 실행

```bash
yarn run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## ✨ 주요 기능

### 1) 인증 및 권한

- Supabase Auth 로그인 / 로그아웃
- 비로그인 시 접근 제한

### 2) AI 캐릭터

- 기본 제공 캐릭터 3종
- 사용자 정의 캐릭터 생성 (이름, 프롬프트, 썸네일)
- 캐릭터별 독립 대화 관리

### 3) 채팅

- Claude API 기반 메시지 송수신
- 1회 요청 200자 제한
- 대화 내역 및 타임스탬프 표시
- 로딩 상태 표시
- 메시지 재전송 기능
- 에러 재시도 로직
- 여러 탭 간 실시간 동기화

### 4) 데이터 관리

- Prisma + Supabase DB로 캐릭터/대화 관리
- 캐릭터별 대화 분리
- 새로고침 후 대화 복원
- 사용자 생성 캐릭터 저장

### 5) UI/UX

- 반응형 디자인
- 다크모드

---

## 🛠️ 기술 스택

- **프론트엔드**: Next.js (App Router), TypeScript, TailwindCSS
- **백엔드**: Supabase (Postgres), Prisma ORM
- **AI API**: Anthropic Claude Messages API
- **인증**: Supabase Auth

---

## 📂 프로젝트 구조

```
ai-character-chat/
 ├─ prisma/               # Prisma 스키마 & 마이그레이션
 ├─ src/
 │   ├─ app/              # Next.js App Router
 │   │   ├─ (auth)/       # 로그인/로그아웃
 │   │   ├─ (service)/    # 캐릭터 & 채팅 서비스
 │   ├─ components/       # UI 컴포넌트
 │   ├─ hooks/            # 커스텀 훅 (useChat 등)
 │   ├─ utils/            # Supabase/프록시/헬퍼
 ├─ .env.example
 ├─ package.json
 └─ README.md
```
