"use client";

import { useChat } from "@/hooks/useChat";
import { useEffect, useRef, useState } from "react";

export default function ChatClient({ characterId, systemPrompt }: { characterId: string; systemPrompt?: string | null }) {
  const { messages, send, loading, abort } = useChat(characterId, systemPrompt || undefined);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  return (
    <div className="flex h-full flex-col rounded-lg border bg-bgSecondary p-3">
      <div ref={listRef} className="flex-1 space-y-3 overflow-auto pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                m.role === "user"
                  ? "bg-primary text-primaryForeground"
                  : "bg-white text-fontPrimary dark:bg-bgPrimary"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
              <div className="mt-1 text-[10px] opacity-70">
                {new Date(m.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-center text-xs text-fontSecondary">
            응답 생성 중...
          </div>
        )}
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          const value = text.slice(0, 200);
          setText("");
          try {
            await send(value);
          } catch (err) {
            console.error(err);
          }
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          placeholder="메시지를 입력하세요 (최대 200자)"
          className="min-h-[44px] flex-1 resize-none rounded-md border bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-bgPrimary"
          rows={2}
        />
        <div className="flex w-[140px] flex-col items-stretch gap-2">
          <button
            type="submit"
            disabled={loading || text.trim().length === 0}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primaryForeground disabled:opacity-50"
          >
            보내기
          </button>
          <button
            type="button"
            disabled={!loading}
            onClick={abort}
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
          >
            중지
          </button>
        </div>
      </form>

      <div className="mt-1 text-right text-[10px] text-fontSecondary">
        {text.length}/200
      </div>
    </div>
  );
}
