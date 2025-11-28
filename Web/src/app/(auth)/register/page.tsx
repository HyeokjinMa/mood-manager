// ======================================================
// File: src/app/(auth)/register/page.tsx
// ======================================================

/*
  [Register Page 역할]
  
  - 회원가입 페이지 레이아웃만 담당
  - 모든 로직과 UI는 컴포넌트와 훅으로 분리
*/

"use client";

import { Suspense } from "react";
import RegisterForm from "./components/RegisterForm";
import { useRegisterForm } from "./hooks/useRegisterForm";

function RegisterFormWrapper() {
  const form = useRegisterForm();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-semibold mb-8">Mood Manager</h1>
      <RegisterForm form={form} />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-semibold mb-8">Mood Manager</h1>
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <RegisterFormWrapper />
    </Suspense>
  );
}
