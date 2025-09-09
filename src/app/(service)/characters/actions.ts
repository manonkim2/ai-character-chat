"use server";

import db from "@/lib/db";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// 기본 캐릭터 하드코딩
const defaultCharacters = (userId: string) => [
  {
    id: "default-1",
    userId,
    name: "친절한 상담가",
    prompt: "사용자의 고민을 따뜻하게 들어주고 위로해주는 상담가.",
    thumbnail: "/default_user.png",
    createdAt: new Date(),
  },
  {
    id: "default-2",
    userId,
    name: "차가운 조언자",
    prompt: "객관적이고 냉철하게 직설적으로 피드백하는 조언자.",
    thumbnail: "/default_user.png",
    createdAt: new Date(),
  },
  {
    id: "default-3",
    userId,
    name: "밝은 친구",
    prompt: "밝고 긍정적으로 힘을 주는 친구 같은 캐릭터.",
    thumbnail: "/default_user.png",
    createdAt: new Date(),
  },
];

// 폼 기반 캐릭터 생성 (서버 액션)
type FormState = { ok?: boolean; error?: string } | undefined;
export const createCharacterFromForm = async (
  _prevState: FormState,
  formData: FormData
) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  const userId = data.user.id;
  const name = String(formData.get("name") || "").trim();
  const prompt = String(formData.get("prompt") || "").trim();
  const thumbnailRaw = formData.get("thumbnail");
  const thumbnail = thumbnailRaw ? String(thumbnailRaw).trim() : undefined;

  if (!name) {
    return { ok: false, error: "이름을 입력해주세요." } as const;
  }
  if (!prompt) {
    return { ok: false, error: "프롬프트를 입력해주세요." } as const;
  }

  try {
    const created = await db.character.create({
      data: { userId, name, prompt, thumbnail },
    });
    redirect(`/chat/${created.id}`);
  } catch (e) {
    return { ok: false, error: "캐릭터 생성 중 오류가 발생했습니다." } as const;
  }
};

// 캐릭터 목록 조회
export const getCharactersAction = async (userId: string) => {
  const custom = await db.character.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return [...defaultCharacters(userId), ...custom];
};
