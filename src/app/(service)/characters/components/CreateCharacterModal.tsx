"use client";

import React from "react";
import {
  useState,
  useEffect,
  useActionState,
  useCallback,
  useTransition,
} from "react";
import { createCharacterFromForm } from "../actions";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

type FormState = { ok?: boolean; error?: string; id?: string } | undefined;

import { useRouter } from "next/navigation";

export default function CreateCharacterModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const initialState: FormState = undefined;
  const [state, formAction, isPending] = useActionState(
    createCharacterFromForm,
    initialState
  );
  const [_, startTransition] = useTransition();

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // (배경 클릭으로 닫힘은 오버레이 onClick으로 처리)
  useEffect(() => {
    if (state?.ok) {
      // 성공 시: 모달 닫고 목록 새로고침, 미리보기 캐시 제거
      handleClose(true);
      // 목록 새로고침
      router.refresh();
    }
  }, [state?.ok, router]);

  // 클라이언트 마운트 이후에만 모달/폼 트리를 렌더링하여 수화 불일치 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback((fromSuccess?: boolean) => {
    setOpen(false);
    try {
      sessionStorage.removeItem("createCharacter.thumbnail.preview");
    } catch {}
    // 성공/취소 구분 없이 미리보기 초기화 신호 전달
    setResetKey((k) => k + 1);
    // fromSuccess는 현재 별도 처리 없음, 향후 토스트 등 확장 용도
  }, []);

  const uploadThumbnail = useCallback(async (file: File) => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    const uid = userData.user?.id || "anon";
    const ext = file.name?.split(".").pop() || "png";
    const objectPath = `${uid}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("thumbnails")
      .upload(objectPath, file, {
        contentType: file.type || "image/png",
        upsert: false,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: pub } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(objectPath);

    if (!pub?.publicUrl) throw new Error("썸네일 URL 생성 실패");

    return pub.publicUrl as string;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);

      const file = fd.get("thumbnailFile") as File | null;
      if (file && file.size > 0) {
        try {
          const url = await uploadThumbnail(file);
          fd.set("thumbnailUrl", url);
          fd.delete("thumbnailFile");
        } catch (err: any) {
          alert(`썸네일 업로드 실패: ${err?.message || err}`);
          return;
        }
      }

      startTransition(() => {
        // Call the server action inside a transition to satisfy React 19 requirements
        formAction(fd);
      });
    },
    [formAction, uploadThumbnail, startTransition]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-primary px-4 h-full py-sm  text-white text-fontPrimary hover:bg-primary/80 text-sm"
      >
        + 새 캐릭터 만들기
      </button>

      {mounted && open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="배경 닫기"
            onClick={() => handleClose()}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg max-h-[90dvh] overflow-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">새 캐릭터 생성</h2>
              <button
                type="button"
                onClick={() => handleClose()}
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

            <form
              action={formAction}
              className="space-y-4"
              onSubmit={handleSubmit}
            >
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

              <ThumbnailPicker resetKey={resetKey} />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleClose()}
                  className="rounded border px-4 py-2 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/80 disabled:opacity-50"
                >
                  {isPending ? "생성 중..." : "생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ThumbnailPicker({ resetKey = 0 }: { resetKey?: number }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

  useEffect(() => {
    const cached = sessionStorage.getItem("createCharacter.thumbnail.preview");
    if (cached) setPreviewUrl(cached);
  }, []);

  useEffect(() => {
    // Reset when parent requests
    setPickerError(null);
    setPreviewUrl(null);
    try {
      sessionStorage.removeItem("createCharacter.thumbnail.preview");
    } catch {}
    if (inputRef.current) inputRef.current.value = "";
  }, [resetKey]);

  return (
    <div>
      <label htmlFor="thumbnailFile" className="mb-1 block text-sm font-medium">
        썸네일 이미지 (선택)
      </label>
      <input
        id="thumbnailFile"
        name="thumbnailFile"
        type="file"
        accept="image/*"
        ref={inputRef}
        className="block w-full cursor-pointer rounded border bg-white file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
        onChange={(e) => {
          setPickerError(null);
          const file = e.target.files?.[0];
          if (!file) {
            setPreviewUrl((prev) => {
              if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
              return null;
            });
            sessionStorage.removeItem("createCharacter.thumbnail.preview");
            return;
          }

          if (!ALLOWED.includes(file.type)) {
            setPickerError(
              "지원하지 않는 이미지 형식입니다. JPG/PNG/WebP만 가능합니다."
            );
            e.currentTarget.value = "";
            setPreviewUrl((prev) => {
              if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
              return null;
            });
            sessionStorage.removeItem("createCharacter.thumbnail.preview");
            return;
          }

          if (file.size > MAX_SIZE) {
            setPickerError(
              "파일이 너무 큽니다. 최대 5MB까지 업로드 가능합니다."
            );
            e.currentTarget.value = "";
            setPreviewUrl((prev) => {
              if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
              return null;
            });
            sessionStorage.removeItem("createCharacter.thumbnail.preview");
            return;
          }

          // Base64로 세션 캐시 (next/image 호환 미리보기)
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl =
              typeof reader.result === "string" ? reader.result : null;
            if (dataUrl) {
              sessionStorage.setItem(
                "createCharacter.thumbnail.preview",
                dataUrl
              );
              setPreviewUrl(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        }}
      />
      {pickerError && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {pickerError}
        </div>
      )}
      {previewUrl && (
        <div className="mt-3 h-20 w-20 overflow-hidden rounded-full ring-1 ring-gray-200">
          <Image
            src={previewUrl}
            alt="썸네일 미리보기"
            width={80}
            height={80}
            className="h-20 w-20 object-cover"
            unoptimized
            priority
          />
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">JPG/PNG/WebP, 최대 5MB</p>
    </div>
  );
}
