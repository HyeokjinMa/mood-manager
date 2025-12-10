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
  const redirectingRef = useRef(false); // 리다이렉트 중복 방지
  const lastStatusRef = useRef<string | null>(null); // 이전 상태 추적
  const hasCheckedSessionRef = useRef(false); // 세션 체크 완료 여부
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
      hasCheckedSessionRef.current = false;
      
      // 3초 후에도 loading이면 unauthenticated로 간주하고 로그인 페이지로 이동
      const timeout = setTimeout(() => {
        console.log("[SplashPage] 세션 로딩 타임아웃, 로그인 페이지로 이동");
        if (!redirectingRef.current && !hasCheckedSessionRef.current) {
          redirectingRef.current = true;
          hasCheckedSessionRef.current = true;
          router.replace("/login");
        }
      }, 3000); // 5초에서 3초로 단축
      
      return () => {
        clearTimeout(timeout);
      };
    }

    // 이미 리다이렉트 중이면 무시
    if (redirectingRef.current || hasCheckedSessionRef.current) return;

    // authenticated 상태일 때 세션 데이터 확인
    if (status === "authenticated") {
      // 세션에 실제 사용자 정보가 있는지 확인
      if (!session?.user) {
        console.log("[SplashPage] 세션 데이터 없음, 로그인 페이지로 이동");
        redirectingRef.current = true;
        hasCheckedSessionRef.current = true;
        router.replace("/login");
        return;
      }
      
      // 관리자 모드가 자동으로 활성화되는 것을 방지하기 위해
      // 실제로 로그인한 사용자인지 확인 (세션에 id가 있어야 함)
      const userId = (session.user as { id?: string })?.id;
      if (!userId) {
        console.log("[SplashPage] 사용자 ID 없음, 로그인 페이지로 이동");
        redirectingRef.current = true;
        hasCheckedSessionRef.current = true;
        router.replace("/login");
        return;
      }
      
      console.log("[SplashPage] 인증됨, 홈으로 이동", { userId, email: session.user.email });
      redirectingRef.current = true;
      hasCheckedSessionRef.current = true;
      router.replace("/home");
      return;
    }

    // unauthenticated 상태
    if (status === "unauthenticated") {
      console.log("[SplashPage] 인증되지 않음, 로그인 페이지로 이동");
      redirectingRef.current = true;
      hasCheckedSessionRef.current = true;
      router.replace("/login");
      return;
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* TODO: 로고 또는 간단한 스플래시 애니메이션 추가 */}
      <h1 className="text-2xl font-semibold">Mood Manager</h1>
    </div>
  );
}
