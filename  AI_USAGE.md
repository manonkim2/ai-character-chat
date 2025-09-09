# AI Usage (Claude API 활용 정리)

## 📌 개요

본 프로젝트는 **Claude API**를 활용하여 AI 캐릭터별 대화 기능을 제공합니다.  
Claude의 강점인 **긴 맥락 유지**와 **안정적인 텍스트 응답**을 통해 사용자 경험을 강화했습니다.

---

## 🔑 API Key 관리

- `ANTHROPIC_API_KEY`는 **서버 환경변수**에서만 관리합니다.
- `.env.example`에 키 항목을 포함시켜, 로컬 실행 시 손쉽게 설정 가능.
- 클라이언트 코드에는 API 키가 절대 노출되지 않도록, **Next.js Route Handler**를 통해 프록시 요청을 구성했습니다.

---

## ⚙️ 요청 흐름

1. **클라이언트** → `/api/chat` 엔드포인트로 메시지 전송
2. **서버(Route Handler)** → Anthropic Claude API 호출
3. **SSE(Server-Sent Events)**를 통해 응답을 스트리밍으로 전달
4. **클라이언트** → 스트리밍 델타를 받아 대화창에 실시간 반영

---

## 📤 API 요청 예시

```ts
const resp = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 512,
    stream: true,
    messages: [{ role: "user", content: "안녕! 자기소개 해줘" }],
  }),
});
```

---

## 📥 응답 스트리밍 처리

- Claude API는 **SSE 이벤트 스트림**으로 결과를 반환합니다.
- 이벤트 타입별 처리:
  - `message_start` → 응답 메시지 초기화
  - `content_block_delta` → 텍스트 델타 추가
  - `message_stop` → 최종 완료 상태로 업데이트
- 클라이언트는 `TextDecoder`로 스트림을 디코딩하고, `useChat` 훅을 통해 실시간으로 UI에 반영합니다.

---

## 🧩 프롬프트 설계

- 캐릭터별 말투/성격을 유지하기 위해 **System Prompt**를 정의했습니다.
- 예시:
  - 캐릭터 A: “상냥하고 친절한 조언가. 따뜻하게 답변.”
  - 캐릭터 B: “날카로운 분석가. 사실 기반으로 냉철하게 대답.”
- 사용자 정의 캐릭터는 입력한 프롬프트를 DB(Supabase + Prisma)에 저장하고 재사용합니다.

---

## 🛡️ 에러 및 네트워크 처리

- **200자 제한**: 서버/클라이언트 양쪽에서 검증
- **에러 재시도 로직**: 3회 지수 백오프 재시도 구현
- **메시지 재전송 기능**: 개별 메시지 단위 재전송 가능 (실패 메시지 선택 재시도)
- **에러 UI 처리**: 실패 메시지는 붉은색 테두리 및 '전송 실패' 레이블 표시, 상단 배너로 전체 실패 상태 안내
- **Abort**: 사용자가 응답을 중간에 취소 가능
