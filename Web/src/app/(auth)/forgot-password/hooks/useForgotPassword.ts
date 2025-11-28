import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Step = "email" | "verify" | "reset";

/**
 * 비밀번호 찾기 커스텀 훅
 * 
 * [MOCK] 목업 모드로 동작
 * TODO: 백엔드 API로 교체 필요
 */
export function useForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: 이메일 입력 및 인증코드 전송
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email) {
      const message = "Please enter your email address.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const message = "Please enter a valid email address.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Verification code has been sent to your email.");
      setStep("verify");
    } catch (err) {
      console.error(err);
      const message = "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: 인증코드 확인
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!verificationCode) {
      const message = "Please enter the verification code.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (verificationCode.length !== 6) {
      const message = "Verification code must be 6 digits.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (verificationCode === "123456") {
        toast.success("Verification code confirmed.");
        setStep("reset");
      } else {
        const message = "Invalid verification code. Please try again.";
        setErrorMsg(message);
        toast.error(message);
      }
    } catch (err) {
      console.error(err);
      const message = "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: 새 비밀번호 설정
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPassword || !confirmPassword) {
      const message = "Please fill in all fields.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (newPassword.length < 6) {
      const message = "Password must be at least 6 characters.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (newPassword !== confirmPassword) {
      const message = "Passwords do not match.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Password has been reset successfully.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      const message = "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setVerificationCode("");
    setErrorMsg("");
  };

  return {
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
  };
}

