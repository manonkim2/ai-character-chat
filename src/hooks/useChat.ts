import { useState, useRef } from "react";

type Msg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  characterId: string;
};

export function useChat(characterId: string, systemPrompt?: string) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function send(text: string) {
    if (text.trim().length === 0) return;
    if (text.length > 200) throw new Error("200자 제한");

    const userMsg: Msg = {
      role: "user",
      content: text,
      ts: Date.now(),
      characterId,
    };
    setMessages((m) => [...m, userMsg]);
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
        messages: messages
          .concat(userMsg)
          .map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!res.ok || !res.body) {
      setLoading(false);
      throw new Error("API 오류");
    }

    // SSE 수신
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

          let textDelta = "";
          if (typeof evt === "string") {
            textDelta = evt;
          }
          if (!textDelta && typeof evt?.delta === "string") {
            textDelta = evt.delta;
          }
          if (!textDelta && typeof evt?.output_text === "string") {
            textDelta = evt.output_text;
          }
          if (!textDelta && typeof evt?.delta?.text === "string") {
            textDelta = evt.delta.text;
          }
          if (!textDelta && typeof evt?.text === "string") {
            textDelta = evt.text;
          }
          if (
            !textDelta &&
            Array.isArray(evt?.content) &&
            typeof evt.content[0]?.text === "string"
          ) {
            textDelta = evt.content[0].text;
          }
          if (
            !textDelta &&
            Array.isArray(evt?.delta?.content) &&
            typeof evt.delta.content[0]?.text === "string"
          ) {
            textDelta = evt.delta.content[0].text;
          }
          if (!textDelta && typeof evt?.delta?.output_text === "string") {
            textDelta = evt.delta.output_text;
          }
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

  function abort() {
    controllerRef.current?.abort();
    setLoading(false);
  }

  return { messages, send, loading, abort };
}
