import { useState, useRef } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  characterId: string;
};

export function useChat(
  characterId: string,
  systemPrompt?: string,
  initialMessages: Msg[] = []
) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

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
    if (typeof evt?.delta?.output_text === "string") return evt.delta.output_text;
    return "";
  }

  async function streamFrom(payloadMessages: { role: string; content: string }[]) {
    setLoading(true);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    const res = await fetch("/api/chat", {
      method: "POST",
      signal: controllerRef.current.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId,
        system: systemPrompt,
        messages: payloadMessages,
      }),
    });

    if (!res.ok || !res.body) {
      setLoading(false);
      throw new Error("API 오류");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let partial = "";

    const ai: Msg = {
      role: "assistant",
      content: "",
      ts: Date.now(),
      characterId,
    };
    setMessages((m) => [...m, ai]);

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
        } catch {}
      }
    }

    setLoading(false);
  }

  async function send(text: string) {
    if (text.trim().length === 0) return;
    if (text.length > 200) throw new Error("200자 제한");

    const userMsg: Msg = {
      role: "user",
      content: text,
      ts: Date.now(),
      characterId,
    };
    const base = messages.concat(userMsg);
    setMessages((m) => [...m, userMsg]);
    await streamFrom(base.map(({ role, content }) => ({ role, content })));
  }

  function abort() {
    controllerRef.current?.abort();
    setLoading(false);
  }

  // 마지막 사용자 메시지를 기준으로 재전송
  async function resendLast() {
    if (loading) return;
    const lastUserIdx = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") return i;
      }
      return -1;
    })();
    if (lastUserIdx < 0) return;

    // 재전송 시도: 대상 사용자 메시지 이후의 응답(어시스턴트)을 제거
    const base = messages.slice(0, lastUserIdx + 1);
    setMessages(base);

    await streamFrom(base.map(({ role, content }) => ({ role, content })));
  }

  return { messages, send, loading, abort, resendLast };
}
