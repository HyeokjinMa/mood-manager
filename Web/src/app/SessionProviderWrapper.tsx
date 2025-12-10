"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchInterval={0} // 자동 리프레시 비활성화 (수동 체크만)
      refetchOnWindowFocus={false} // 윈도우 포커스 시 리프레시 비활성화
      basePath={process.env.NEXT_PUBLIC_BASE_PATH || "/api/auth"} // 명시적 basePath 설정
    >
      {children}
    </SessionProvider>
  );
}
