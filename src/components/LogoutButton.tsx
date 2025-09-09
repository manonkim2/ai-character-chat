"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded px-lg py-sm text-fontPrimary text-sm border"
    >
      로그아웃
    </button>
  );
};

export default LogoutButton;
