import ChatClient from "./client";
import { requireUser } from "@/utils/auth/server";
import { getCharacterInfo } from "@/utils/characters";
import { getMessagesAction } from "@/app/(service)/characters/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const info = await getCharacterInfo(user.id, id);
  const initial = await getMessagesAction(user.id, id);

  return (
    <div className="flex h-[calc(100dvh-120px)] flex-col">
      <ChatClient
        characterId={id}
        systemPrompt={info?.prompt}
        title={info?.name || `캐릭터 ID: ${id}`}
        initialMessages={initial.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          ts: new Date(m.createdAt).getTime(),
          characterId: id,
        }))}
      />
    </div>
  );
}
