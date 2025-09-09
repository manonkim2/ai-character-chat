"use client";

import { useState } from "react";
import { loginAction } from "../actions";

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="h-[calc(100vh-90px)] flex items-center justify-center">
      <form
        action={async (formData) => {
          const result = await loginAction(formData);
          if (result?.error) setError(result.error);
        }}
        className="w-full max-w-sm space-y-4 rounded p-6"
      >
        <h1 className="text-xl font-bold text-center">로그인</h1>

        <div className="flex flex-col gap-md dark:text-black">
          <input
            type="email"
            name="email"
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
          >
            로그인
          </button>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;
