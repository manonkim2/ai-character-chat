import db from "@/lib/db";

type CharacterInfo = {
  id: string;
  name: string;
  prompt: string;
  thumbnail?: string | null;
};

const defaultMap: Record<string, CharacterInfo> = {
  "default-1": {
    id: "default-1",
    name: "친절한 상담가",
    prompt: "사용자의 고민을 따뜻하게 들어주고 위로해주는 상담가.",
    thumbnail: "/default_user.png",
  },
  "default-2": {
    id: "default-2",
    name: "차가운 조언자",
    prompt: "객관적이고 냉철하게 직설적으로 피드백하는 조언자.",
    thumbnail: "/default_user.png",
  },
  "default-3": {
    id: "default-3",
    name: "밝은 친구",
    prompt: "밝고 긍정적으로 힘을 주는 친구 같은 캐릭터.",
    thumbnail: "/default_user.png",
  },
};

export async function getCharacterInfo(userId: string, id: string): Promise<CharacterInfo | null> {
  if (defaultMap[id]) return defaultMap[id];
  const ch = await db.character.findFirst({ where: { id, userId } });
  if (!ch) return null;
  return { id: ch.id, name: ch.name, prompt: ch.prompt, thumbnail: ch.thumbnail };
}

