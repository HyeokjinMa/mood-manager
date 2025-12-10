/*
src/app/page.tsx

1. 화면 로드 후 1.5-2초 후 /login 으로 이동
2. 화면에 앱 로고 표시
3. 로그인 상태를 체크하여 로그인이 되어있다면 /(main)/home 화면으로 이동해서 바로 원하는 화면이 뜨도록 설정
*/

"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const { status, data: session } = useSession(); 
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (redirectingRef.current) return;

    // authenticated 상태일 때 세션 데이터 확인
    if (status === "authenticated") {
      // 세션이 null이거나 사용자 정보가 없으면 로그인 페이지로
      if (!session || !session.user || !(session.user as { id?: string })?.id) {
        redirectingRef.current = true;
        router.replace("/login");
        return;
      }
      redirectingRef.current = true;
      router.replace("/home");
    } else if (status === "unauthenticated") {
      redirectingRef.current = true;
      router.replace("/login");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* TODO: 로고 또는 간단한 스플래시 애니메이션 추가 */}
      <h1 className="text-2xl font-semibold">Mood Manager</h1>
    </div>
  );
}
