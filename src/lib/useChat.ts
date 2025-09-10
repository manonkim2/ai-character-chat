import { useState, useRef } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  characterId: string;
  failed?: boolean;
};

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      const err: any = new Error("Aborted");
      err.name = "AbortError";
      reject(err);
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
  });
}

const RETRY_MAX = 3;
const BACKOFF_BASE_MS = 500;
const MAX_INPUT_LEN = 200;

export function useChat(
  characterId: string,
  systemPrompt?: string,
  initialMessages: Msg[] = []
) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  // 에러 배너 대신 메시지 단위로 failed 플래그 처리

  function extractTextDelta(evt: any): string {
    if (typeof evt === "string") return evt;
    if (typeof evt?.delta === "string") return evt.delta;
    if (typeof evt?.output_text === "string") return evt.output_text;
    if (typeof evt?.delta?.text === "string") return evt.delta.text;
    if (typeof evt?.text === "string") return evt.text;
    if (Array.isArray(evt?.content) && typeof evt.content[0]?.text === "string")
      return evt.content[0].text;
    if (
      Array.isArray(evt?.delta?.content) &&
      typeof evt.delta.content[0]?.text === "string"
    )
      return evt.delta.content[0].text;
    if (typeof evt?.delta?.output_text === "string")
      return evt.delta.output_text;
    return "";
  }

  function removeLastAssistantByTs(ts: number | null) {
    if (!ts) return;
    setMessages((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.role === "assistant" && last.ts === ts) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }

  function toPayload(msgs: Msg[]) {
    return msgs.map(({ role, content }) => ({ role, content }));
  }

  function lastUserIndex(msgs: Msg[]) {
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === "user") return i;
    return -1;
  }

  async function streamFrom(
    payloadMessages: { role: string; content: string }[],
    initiatorTs: number
  ) {
    setLoading(true);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    const signal = controllerRef.current.signal;
    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      let appendedAi = false;
      let retryable = true;
      let assistantTs: number | null = null;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId,
            system: systemPrompt,
            messages: payloadMessages,
          }),
        });

        retryable = res.status >= 500 || res.status === 429;

        if (!res.ok || !res.body) throw new Error("API 오류");

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/event-stream")) throw new Error("API 응답 형식 오류");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let partial = "";

        const ai: Msg = {
          role: "assistant",
          content: "",
          ts: Date.now(),
          characterId,
        };
        assistantTs = ai.ts;
        setMessages((m) => [...m, ai]);
        appendedAi = true;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          partial += decoder.decode(value, { stream: true });

          const lines = partial.split("\n");
          partial = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const evt = JSON.parse(json);

              if (evt?.type === "error" || evt?.error) {
                throw new Error(
                  evt?.error?.message || evt?.message || "상위 모델 오류"
                );
              }

              const textDelta = extractTextDelta(evt);
              if (textDelta) {
                setMessages((m) => {
                  const copy = m.slice();
                  const lastIdx = copy.length - 1;
                  copy[lastIdx] = {
                    ...copy[lastIdx],
                    content: copy[lastIdx].content + textDelta,
                  };
                  return copy;
                });
              }
            } catch {
              throw new Error("스트림 파싱 오류");
            }
          }
        }

        setLoading(false);
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") {
          if (appendedAi) removeLastAssistantByTs(assistantTs);
          setLoading(false);
          return;
        }

        if (appendedAi) removeLastAssistantByTs(assistantTs);
        if (attempt >= RETRY_MAX || !retryable) {
          setMessages((prev) => {
            const idx = prev.findIndex(
              (m) => m.role === "user" && m.ts === initiatorTs
            );
            if (idx === -1) return prev;
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], failed: true };
            return copy;
          });
          break;
        }

        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
        try {
          await sleep(delay, signal);
        } catch {
          setLoading(false);
          return;
        }
      }
    }
    setLoading(false);
  }

  async function send(text: string) {
    if (text.trim().length === 0) return;
    if (text.length > MAX_INPUT_LEN) throw new Error("200자 제한");

    const userMsg: Msg = {
      role: "user",
      content: text,
      ts: Date.now(),
      characterId,
      failed: false,
    };
    const base = messages.concat(userMsg);
    setMessages((m) => [...m, userMsg]);
    await streamFrom(toPayload(base), userMsg.ts);
  }

  function abort() {
    controllerRef.current?.abort();
    setLoading(false);
  }

  async function resendAtIndex(index: number) {
    if (loading) return;
    if (index < 0 || index >= messages.length) return;
    if (messages[index].role !== "user") return;
    const initiator = messages[index];
    const base = messages
      .slice(0, index + 1)
      .map((m, i) => (i === index ? { ...m, failed: false } : m));
    setMessages(base);
    await streamFrom(toPayload(base), initiator.ts);
  }

  // 마지막 사용자 메시지를 기준으로 재전송
  async function resendLast() {
    if (loading) return;
    const lastUserIdx = lastUserIndex(messages);
    if (lastUserIdx < 0) return;
    await resendAtIndex(lastUserIdx);
  }

  return { messages, send, loading, abort, resendLast, resendAtIndex };
}
