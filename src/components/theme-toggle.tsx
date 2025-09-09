"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-bgSecondary dark:hover:bg-bgSecondary/60"
      aria-label="Toggle theme"
    >
      <span className="text-primary">{dark ? "🌙" : "☀️"}</span>
      <span className="text-fontSecondary">{dark ? "다크" : "라이트"}</span>
    </button>
  );
}

