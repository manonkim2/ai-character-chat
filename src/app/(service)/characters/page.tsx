export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";

import { requireUser } from "@/utils/auth/server";
import { getCharactersAction } from "./actions";
import CreateCharacterModal from "./components/CreateCharacterModal";

const CharactersPage = async () => {
  const user = await requireUser();
  const userId = user.id;
  const characters = await getCharactersAction(userId);

  return (
    <div>
      <div className="flex justify-between items-center py-md">
        <h1 className="text-lg font-bold">
          원하는 캐릭터를 선택하고 이야기를 시작해보세요.
        </h1>
        <CreateCharacterModal />
      </div>
      <div className="grid grid-cols-3 gap-xl">
        {characters.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="border p-lg shadow hover:shadow-lg flex flex-col items-center"
          >
            <Image
              src={c.thumbnail || "/default_user.png"}
              alt={c.name}
              height={110}
              width={110}
              className="rounded-full border"
            />
            <h2 className="mt-4 text-center font-semibold text-lg mb-sm">
              {c.name}
            </h2>
            <span className="text-sm text-fontSecondary">{c.prompt}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CharactersPage;
