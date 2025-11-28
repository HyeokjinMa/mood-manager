/*
src/app/(auth)/layout.tsx

1. 로그인, 회원가입 화면의 공통 UI 구성 설정
2. TopNav, BottomNav 제외 구성
*/

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}