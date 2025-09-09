"use server";

import db from "@/lib/db";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { requireUser } from "@/utils/auth/server";

// 기본 캐릭터
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

type FormState = { ok?: boolean; error?: string; id?: string } | undefined;

export const createCharacterFromForm = async (
  _prevState: FormState,
  formData: FormData
) => {
  const supabase = await createSupabaseServerClient();
  const user = await requireUser();
  const userId = user.id;
  const name = String(formData.get("name") || "").trim();
  const prompt = String(formData.get("prompt") || "").trim();
  const file = formData.get("thumbnailFile");
  const thumbnailFromUrl = String(formData.get("thumbnailUrl") || "").trim();
  let thumbnail: string | undefined = thumbnailFromUrl || undefined;

  if (!name) {
    return { ok: false, error: "이름을 입력해주세요." } as const;
  }
  if (!prompt) {
    return { ok: false, error: "프롬프트를 입력해주세요." } as const;
  }

  try {
    // 파일 업로드 처리 (클라이언트 업로드 URL이 없을 때만)
    if (!thumbnail && file && typeof file !== "string") {
      const f = file as File;
      if (f.size > 0) {
        // 서버 측 파일 유효성 검사
        const allowed = ["image/jpeg", "image/png", "image/webp"] as const;
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (!allowed.includes(f.type as any)) {
          return {
            ok: false,
            error:
              "지원하지 않는 이미지 형식입니다. JPG/PNG/WebP만 가능합니다.",
          } as const;
        }
        if (f.size > maxSize) {
          return {
            ok: false,
            error: "파일이 너무 큽니다. 최대 50MB까지 업로드 가능합니다.",
          } as const;
        }

        const bucket = "thumbnails";
        const ext = f.name?.split(".").pop() || "png";
        const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(objectPath, f, {
            contentType: f.type || "image/png",
            upsert: false,
          });

        if (uploadErr) {
          return {
            ok: false,
            error: `썸네일 업로드 실패: ${uploadErr.message}`,
          } as const;
        }

        const { data: pub } = supabase.storage
          .from(bucket)
          .getPublicUrl(objectPath);
        if (!pub?.publicUrl) {
          return {
            ok: false,
            error: "썸네일 URL 생성에 실패했습니다.",
          } as const;
        }
        thumbnail = pub.publicUrl;
      }
    }

    const created = await db.character.create({
      data: { userId, name, prompt, thumbnail },
    });
    return { ok: true, id: created.id } as const;
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

// 기본 캐릭터 매핑 헬퍼 및 저장용 ID 가공
const getDefaultById = (userId: string, id: string) =>
  defaultCharacters(userId).find((c) => c.id === id);

const storageIdFor = (userId: string, characterId: string) =>
  characterId.startsWith("default-") ? `${userId}::${characterId}` : characterId;

// 메시지 조회 (기본 캐릭터는 유저별 가상 ID로 매핑)
export const getMessagesAction = async (userId: string, characterId: string) => {
  const storageId = storageIdFor(userId, characterId);
  return db.message.findMany({
    where: { userId, characterId: storageId },
    orderBy: { createdAt: "asc" },
  });
};

// 대화 저장: 기존 내역 덮어쓰기 (기본 캐릭터도 저장 가능)
export const saveConversationAction = async (
  characterId: string,
  messages: { role: "user" | "assistant"; content: string; ts?: number }[]
) => {
  const user = await requireUser();
  const userId = user.id;

  const storageId = storageIdFor(userId, characterId);

  // 기본 캐릭터인 경우 FK 만족을 위해 사용자별 가상 캐릭터 upsert
  if (characterId.startsWith("default-")) {
    const def = getDefaultById(userId, characterId);
    if (def) {
      await db.character.upsert({
        where: { id: storageId },
        create: {
          id: storageId,
          userId,
          name: def.name,
          prompt: def.prompt,
          thumbnail: def.thumbnail,
        },
        update: {},
      });
    }
  }

  await db.$transaction([
    db.message.deleteMany({ where: { userId, characterId: storageId } }),
    db.message.createMany({
      data: messages.map((m) => ({
        userId,
        characterId: storageId,
        role: m.role,
        content: m.content,
        createdAt: m.ts ? new Date(m.ts) : new Date(),
      })),
    }),
  ]);

  return { ok: true as const, count: messages.length };
};
