"use client";

import { useChat } from "@/hooks/useChat";
import { useEffect, useRef, useState } from "react";
import { saveConversationAction } from "@/app/(service)/characters/actions";
import { useRouter } from "next/navigation";

type Msg = {
  role: "user" | "assistant";
  content: string;
  ts: number;
  characterId: string;
};

export default function ChatClient({
  characterId,
  systemPrompt,
  title,
  initialMessages = [],
}: {
  characterId: string;
  systemPrompt?: string | null;
  title?: string | null;
  initialMessages?: Msg[];
}) {
  const { messages, send, loading, abort } = useChat(
    characterId,
    systemPrompt || undefined,
    initialMessages
  );
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  return (
    <div className="flex h-full flex-col rounded-lg border dark:border-none bg-bgSecondary p-0">
      <header className="sticky top-0 z-10 border-b bg-bgSecondary/80 backdrop-blur-md dark:border-gray-500">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-fontPrimary">
              {title || `캐릭터 #${characterId.slice(0, 6)}`}
            </div>
            {systemPrompt ? (
              <div
                className="mt-0.5 truncate text-xs text-fontSecondary/80"
                title={systemPrompt}
              >
                {systemPrompt}
              </div>
            ) : (
              <div className="mt-0.5 text-xs text-fontSecondary/60">
                프롬프트가 설정되지 않았습니다.
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={exiting}
            onClick={async () => {
              try {
                setExiting(true);
                const toSave = messages.map(({ role, content, ts }) => ({
                  role,
                  content,
                  ts,
                }));
                await saveConversationAction(characterId, toSave);
                router.push("/characters");
              } finally {
                setExiting(false);
              }
            }}
            className="rounded-md border px-3 py-1.5 text-xs text-fontSecondary hover:bg-white/10 hover:text-fontPrimary disabled:opacity-50 dark:hover:bg-bgPrimary/60"
          >
            {exiting ? "저장 중..." : "대화 저장 후 채팅창 나가기"}
          </button>
        </div>
      </header>
      <div ref={listRef} className="flex-1 space-y-2.5 overflow-auto px-4 py-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[78%] rounded-2xl border border-white/10 px-3 py-2 text-sm shadow-sm ${
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
          <div className="text-center text-xs text-fontSecondary/80">
            응답 생성 중...
          </div>
        )}
      </div>

      <form
        className="border-t px-4 py-3 dark:border-gray-500"
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
        <div className="flex gap-md">
          <div className="relative flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 200))}
              placeholder="메시지를 입력하세요 (최대 200자)"
              className="w-full h-full resize-none rounded-lg border border-white/10 bg-white/50 p-md text-sm text-fontPrimary outline-none ring-0 placeholder:text-fontSecondary/60 focus:border-white/20 dark:bg-bgPrimary/80"
              rows={3}
            />
            <div className="pointer-events-none absolute bottom-2 right-2 select-none rounded-md bg-black/40 px-2 py-0.5 text-[10px] text-white dark:bg-black/30">
              {text.length}/200
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || text.trim().length === 0}
            className="rounded-lg bg-primary px-4 text-sm text-white py-sm shadow-sm transition hover:opacity-90 disabled:opacity-50"
            aria-label="메시지 보내기"
            title="메시지 보내기"
          >
            보내기
          </button>
        </div>
      </form>
    </div>
  );
}
