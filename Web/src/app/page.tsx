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
  const { status } = useSession(); 
  const redirectingRef = useRef(false); // 리다이렉트 중복 방지
  const lastStatusRef = useRef<string | null>(null); // 이전 상태 추적
  // status = "loading" | "authenticated" | "unauthenticated"

  useEffect(() => {
    // 상태가 변하지 않았으면 무시 (불필요한 리렌더링 방지)
    if (lastStatusRef.current === status) {
      return;
    }
    lastStatusRef.current = status;

    // loading 상태에서는 리다이렉트하지 않음 (시크릿 모드 세션 불안정 대응)
    // 단, 너무 오래 loading이면 타임아웃 처리
    if (status === "loading") {
      redirectingRef.current = false;
      
      // 5초 후에도 loading이면 unauthenticated로 간주
      const timeout = setTimeout(() => {
        console.log("[SplashPage] 세션 로딩 타임아웃, 로그인 페이지로 이동");
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.replace("/login");
        }
      }, 5000);
      
      return () => {
        clearTimeout(timeout);
      };
    }

    // 이미 리다이렉트 중이면 무시
    if (redirectingRef.current) return;

    redirectingRef.current = true;

    // 약간의 딜레이를 추가하여 세션 상태가 안정화될 시간을 줌
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        console.log("[SplashPage] 인증됨, 홈으로 이동");
        router.replace("/home"); // 로그인 되어있음 → 홈으로 이동
      } else {
        console.log("[SplashPage] 인증되지 않음, 로그인 페이지로 이동");
        router.replace("/login"); // 로그인 안됨 → 로그인 페이지로 이동
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* TODO: 로고 또는 간단한 스플래시 애니메이션 추가 */}
      <h1 className="text-2xl font-semibold">Mood Manager</h1>
    </div>
  );
}
