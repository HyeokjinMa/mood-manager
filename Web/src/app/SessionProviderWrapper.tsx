"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 갱신 (시크릿 모드에서도 세션 유지)
      refetchOnWindowFocus={true} // 윈도우 포커스 시 세션 재확인 (보안 강화)
      basePath={process.env.NEXT_PUBLIC_BASE_PATH || "/api/auth"} // 명시적 basePath 설정
    >
      {children}
    </SessionProvider>
  );
}
