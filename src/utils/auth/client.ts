import { createClient } from "@/utils/supabase/client";

export async function getCurrentUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

