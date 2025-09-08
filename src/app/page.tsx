import { redirect } from "next/navigation";

import LoginPage from "./(auth)/login/page";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const Home = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    return <LoginPage />;
  }

  redirect("/characters");
};

export default Home;
