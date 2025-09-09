export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getCharactersAction } from "./actions";
import Image from "next/image";
import Link from "next/link";
import CreateCharacterModal from "./CreateCharacterModal";

// - [x] 기본 제공 캐릭터 3개
// - [x] 사용자 정의 캐릭터 생성
// * [x] 캐릭터 이름 설정
// * [x] 캐릭터 프롬프트 정의
// * 썸네일 이미지 업로드 (파일 선택)
// - 캐릭터별 독립적 대화 관리
// - 캐릭터 선택 UI (썸네일 표시)

export default async function CharactersPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }
  const userId = data.user.id;
  const characters = await getCharactersAction(userId);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">캐릭터 선택</h1>
      <div className="grid grid-cols-3 gap-6">
        {characters.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="rounded-lg border bg-card p-4 shadow hover:shadow-lg transition"
          >
            <div className="relative h-32 w-32 mx-auto">
              <Image
                src={c.thumbnail || "/default_user.png"}
                alt={c.name}
                height={80}
                width={80}
                className="object-cover rounded-full"
              />
            </div>
            <h2 className="mt-4 text-center font-semibold">{c.name}</h2>
          </Link>
        ))}
      </div>

      {/* 추후 모달/폼으로 연결 */}
      <div className="mt-6">
        <CreateCharacterModal />
      </div>
    </div>
  );
}
