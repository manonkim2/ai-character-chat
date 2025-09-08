"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signupAction } from "../actions";

const SignupPage = () => {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const reason = searchParams.get("reason");

  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      {reason === "notfound" && (
        <div className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-700">
          입력하신 계정이 존재하지 않습니다. 새 계정을 생성해주세요.
        </div>
      )}
      <form
        action={async (formData) => {
          const result = await signupAction(formData);
          if (result?.error) setError(result.error);
        }}
        className="w-full max-w-sm space-y-4 rounded bg-white p-6 shadow"
      >
        <h1 className="text-xl font-bold text-center">회원가입</h1>

        <input
          type="email"
          name="email"
          defaultValue={initialEmail}
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          name="passwordConfirm"
          placeholder="Confirm Password"
          className="w-full rounded border px-3 py-2"
          required
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
        >
          회원가입
        </button>
      </form>
    </main>
  );
};

export default SignupPage;
