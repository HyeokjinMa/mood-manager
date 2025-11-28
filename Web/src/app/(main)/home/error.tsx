"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // 에러 로그 기록
    console.error("Home page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">오류가 발생했습니다</h2>
        <p className="text-gray-600 mb-6">
          페이지를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            로그인 페이지로 이동
          </button>
        </div>
        {error.message && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">에러 상세 정보</summary>
            <pre className="mt-2 text-xs text-gray-400 bg-gray-100 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

