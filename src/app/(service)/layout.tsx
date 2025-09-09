import LogoutButton from "@/components/LogoutButton";

export default function ServiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto">
      <nav className="flex items-center justify-between h-[60px]">
        <h1 className="text-xl font-semibold text-fontPrimary py-sm">
          AI Chat
        </h1>
        <LogoutButton />
      </nav>
      {children}
    </div>
  );
}
