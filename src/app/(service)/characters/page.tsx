export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";

import { requireUser } from "@/utils/auth/server";
import { getCharactersAction } from "./actions";
import CreateCharacterModal from "./components/CreateCharacterModal";
import DeleteCharacterButton from "./components/DeleteCharacterButton";

const CharactersPage = async () => {
  const user = await requireUser();
  const userId = user.id;
  const characters = await getCharactersAction(userId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-md justify-between items-center py-md">
        <h1 className="text-md sm:text-lg font-bold">
          원하는 캐릭터를 선택하고 이야기를 시작해보세요.
        </h1>
        <CreateCharacterModal />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-md sm:gap-xl">
        {characters.map((c) => {
          const isDefault = c.id.startsWith("default-");
          return (
            <div
              key={c.id}
              className="relative border p-lg shadow hover:shadow-lg flex flex-col items-center py-2xl"
            >
              <div className="absolute right-2 top-2">
                <DeleteCharacterButton id={c.id} disabled={isDefault} />
              </div>
              <Link
                href={`/chat/${c.id}`}
                className="w-full flex flex-col items-center"
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharactersPage;
