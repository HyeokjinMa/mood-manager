// ======================================================
// File: src/app/(auth)/forgot-password/components/ForgotPasswordSteps.tsx
// ======================================================

/*
  [ForgotPasswordSteps 역할]
  
  - 비밀번호 찾기 단계별 UI 컴포넌트
  - Step 1: 이메일 입력
  - Step 2: 인증코드 입력
  - Step 3: 새 비밀번호 설정 (모달)
*/

"use client";

import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Step = "email" | "verify" | "reset";

interface ForgotPasswordStepsProps {
  step: Step;
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  errorMsg: string;
  onEmailChange: (email: string) => void;
  onVerificationCodeChange: (code: string) => void;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  onSendCode: (e: React.FormEvent) => void;
  onVerifyCode: (e: React.FormEvent) => void;
  onResetPassword: (e: React.FormEvent) => void;
  onBackToEmail: () => void;
}

export default function ForgotPasswordSteps({
  step,
  email,
  verificationCode,
  newPassword,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  isLoading,
  errorMsg,
  onEmailChange,
  onVerificationCodeChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  onSendCode,
  onVerifyCode,
  onResetPassword,
  onBackToEmail,
}: ForgotPasswordStepsProps) {
  const router = useRouter();

  return (
    <>
      {/* Step 1: Email Input */}
      {step === "email" && (
        <>
          <p className="text-sm text-gray-600 mb-8">
            Enter your email address and we&apos;ll send you a verification code.
          </p>
          <form onSubmit={onSendCode} className="space-y-5">
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">Email</label>
              <div className="flex items-center px-3 py-2 border rounded-md">
                <Mail size={18} className="text-gray-400 mr-2" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full outline-none"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white h-12 rounded-lg font-medium active:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        </>
      )}

      {/* Step 2: Verification Code */}
      {step === "verify" && (
        <>
          <p className="text-sm text-gray-600 mb-8">
            We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below.
          </p>
          <form onSubmit={onVerifyCode} className="space-y-5">
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">Verification Code</label>
              <input
                type="text"
                placeholder="000000"
                className="w-full px-3 py-2 border rounded-md outline-none text-center text-2xl tracking-widest"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  onVerificationCodeChange(value);
                }}
                disabled={isLoading}
              />
            </div>

            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white h-12 rounded-lg font-medium active:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={onBackToEmail}
              className="w-full bg-white text-black h-12 rounded-lg font-medium border active:bg-gray-200 transition"
            >
              Change Email
            </button>
          </form>
        </>
      )}

      {/* Step 3: Reset Password Popup */}
      {step === "reset" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm relative">
            <button
              onClick={() => router.push("/login")}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-2">Set New Password</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please enter your new password below.
            </p>

            <form onSubmit={onResetPassword} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-600">New Password</label>
                <div className="flex items-center px-3 py-2 border rounded-md relative">
                  <Lock size={18} className="text-gray-400 mr-2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="w-full outline-none"
                    value={newPassword}
                    onChange={(e) => onNewPasswordChange(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3"
                    onClick={onShowPasswordToggle}
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-gray-500" />
                    ) : (
                      <Eye size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-600">Confirm Password</label>
                <div className="flex items-center px-3 py-2 border rounded-md relative">
                  <Lock size={18} className="text-gray-400 mr-2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="w-full outline-none"
                    value={confirmPassword}
                    onChange={(e) => onConfirmPasswordChange(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3"
                    onClick={onShowConfirmPasswordToggle}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} className="text-gray-500" />
                    ) : (
                      <Eye size={18} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white h-12 rounded-lg font-medium active:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

