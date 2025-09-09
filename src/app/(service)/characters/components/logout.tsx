"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const Logout = () => {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <button
        onClick={handleLogout}
        className="mt-4 rounded bg-gray-800 px-4 py-2 text-white"
      >
        로그아웃
      </button>
    </>
  );
};

export default Logout;
