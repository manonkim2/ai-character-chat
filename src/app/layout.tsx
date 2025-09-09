import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";
import type { Metadata } from "next";

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
      <body>
        <div className="container mx-auto p-lg">{children}</div>
        <ThemeToggle />
      </body>
    </html>
  );
}
