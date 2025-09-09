"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCharacterAction } from "../actions";
import { CircleX, Delete, DeleteIcon } from "lucide-react";

export default function DeleteCharacterButton({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    if (disabled) return;
    const ok = confirm("이 캐릭터를 삭제할까요? 대화 내용도 함께 삭제됩니다.");
    if (!ok) return;
    startTransition(async () => {
      try {
        const res = await deleteCharacterAction(id);
        if (!res?.ok) {
          alert(res?.error || "삭제할 수 없습니다.");
          return;
        }
        router.refresh();
      } catch (e) {
        alert("삭제 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      }}
      disabled={isPending || disabled}
      title={disabled ? "기본 캐릭터는 삭제할 수 없어요" : "캐릭터 삭제"}
      className="rounded text-xs disabled:opacity-30"
    >
      {isPending ? "삭제 중..." : <CircleX />}
    </button>
  );
}
