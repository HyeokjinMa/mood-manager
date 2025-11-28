// ======================================================
// File: src/app/(auth)/forgot-password/page.tsx
// ======================================================

/*
  [Forgot Password Page 역할]
  
  - 페이지 레이아웃만 담당
  - 모든 로직과 UI는 컴포넌트와 훅으로 분리
*/

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordSteps from "./components/ForgotPasswordSteps";
import { useForgotPassword } from "./hooks/useForgotPassword";

export default function ForgotPasswordPage() {
  const {
    step,
    email,
    verificationCode,
    newPassword,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    isLoading,
    errorMsg,
    setEmail,
    setVerificationCode,
    setNewPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    handleSendCode,
    handleVerifyCode,
    handleResetPassword,
    handleBackToEmail,
  } = useForgotPassword();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Back Button */}
        <Link
          href="/login"
          className="flex items-center text-gray-600 mb-6 hover:text-gray-800 transition"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Login
        </Link>

        <h1 className="text-2xl font-semibold mb-2">Forgot Password</h1>

        <ForgotPasswordSteps
          step={step}
          email={email}
          verificationCode={verificationCode}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          isLoading={isLoading}
          errorMsg={errorMsg}
          onEmailChange={setEmail}
          onVerificationCodeChange={setVerificationCode}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onShowPasswordToggle={() => setShowPassword(!showPassword)}
          onShowConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          onSendCode={handleSendCode}
          onVerifyCode={handleVerifyCode}
          onResetPassword={handleResetPassword}
          onBackToEmail={handleBackToEmail}
        />
      </div>
    </div>
  );
}
