import { createSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/login");
  return data.user;
}
