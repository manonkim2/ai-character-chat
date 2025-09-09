"use client";

import { useState, useEffect, useActionState } from "react";
import { createCharacterFromForm } from "./actions";

type FormState = { ok?: boolean; error?: string } | undefined;

export default function CreateCharacterModal() {
  const [open, setOpen] = useState(false);

  const initialState: FormState = { ok: true };
  const [state, formAction] = useActionState(
    createCharacterFromForm,
    initialState
  );

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // (배경 클릭으로 닫힘은 오버레이 onClick으로 처리)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/80"
      >
        + 새 캐릭터 만들기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="배경 닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg max-h-[90dvh] overflow-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">새 캐릭터 생성</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-2 hover:bg-gray-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {state?.error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium"
                >
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="예: 다정한 조언가"
                  className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="prompt"
                  className="mb-1 block text-sm font-medium"
                >
                  프롬프트
                </label>
                <textarea
                  id="prompt"
                  name="prompt"
                  required
                  rows={5}
                  placeholder="캐릭터의 말투, 역할, 성격 등을 상세히 적어주세요."
                  className="w-full resize-none rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="thumbnail"
                  className="mb-1 block text-sm font-medium"
                >
                  썸네일 이미지 URL (선택)
                </label>
                <input
                  id="thumbnail"
                  name="thumbnail"
                  type="url"
                  placeholder="https://..."
                  className="w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  파일 업로드는 추후 연결 예정입니다.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border px-4 py-2 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/80"
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
