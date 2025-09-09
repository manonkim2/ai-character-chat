import Link from "next/link";
import ChatClient from "./client";
import { requireUser } from "@/utils/auth/server";
import { getCharacterInfo } from "@/utils/characters";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const info = await getCharacterInfo(user.id, id);

  return (
    <div className="flex h-[calc(100dvh-120px)] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/characters"
          className="text-sm text-fontSecondary hover:underline"
        >
          ← 캐릭터 선택으로
        </Link>
        <div className="text-sm text-fontSecondary">{info?.name || `캐릭터 ID: ${id}`}</div>
      </div>
      <ChatClient characterId={id} systemPrompt={info?.prompt} />
    </div>
  );
}
