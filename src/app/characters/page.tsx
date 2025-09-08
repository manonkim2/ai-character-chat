export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import Logout from "./components/logout";

export default async function CharactersPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <p className="mb-4 text-gray-600">Hello, {data.user.email}</p>
      <h1 className="text-2xl font-bold">캐릭터 선택 페이지</h1>
      <Logout />
    </div>
  );
}
