"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
      refetchInterval={0} // 자동 리프레시 비활성화 (시크릿 모드 대응)
      refetchOnWindowFocus={false} // 윈도우 포커스 시 리프레시 비활성화
    >
      {children}
    </SessionProvider>
  );
}
