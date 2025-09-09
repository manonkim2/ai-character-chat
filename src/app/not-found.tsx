import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-fontPrimary">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-2 text-sm text-fontSecondary">
          요청하신 주소가 변경되었거나 삭제되었을 수 있습니다.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary/80"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    </main>
  );
}
