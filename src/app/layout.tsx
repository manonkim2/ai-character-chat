import "./globals.css";
import type { Metadata } from "next";
import ThemeToggle from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "LionRocket AI Chat",
  description: "FE 과제 - Next.js + Tailwind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              const stored = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = stored ? stored === 'dark' : prefersDark;
              if (isDark) document.documentElement.classList.add('dark');
            } catch {}
          `}}
        />
      </head>
      <body>
        <div className="container mx-auto p-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-fontPrimary">
              LionRocket AI Chat
            </h1>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
