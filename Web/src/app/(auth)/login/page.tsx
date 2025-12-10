"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiKakao, SiNaver } from "react-icons/si";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const redirectingRef = useRef(false); // 리다이렉트 중복 방지
  const lastStatusRef = useRef<string | null>(null); // 이전 상태 추적

  // 로그인된 상태에서는 login 페이지 접근 금지 → 즉시 home으로 이동
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
      
      // 5초 후에도 loading이면 세션 재확인
      const timeout = setTimeout(() => {
        console.log("[LoginPage] 세션 로딩 타임아웃, 세션 재확인");
        // useSession이 자동으로 재확인하므로 추가 작업 불필요
      }, 5000);
      
      return () => {
        clearTimeout(timeout);
      };
    }

    if (status === "authenticated" && !redirectingRef.current) {
      redirectingRef.current = true;
      console.log("[LoginPage] 이미 인증됨, 홈으로 이동");
      // 약간의 딜레이를 추가하여 세션 상태가 안정화될 시간을 줌
      const timer = setTimeout(() => {
        router.replace("/home"); // 뒤로가기 방지
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    // unauthenticated 상태로 돌아오면 플래그 리셋
    if (status === "unauthenticated") {
      redirectingRef.current = false;
      console.log("[LoginPage] 인증되지 않음, 로그인 페이지 유지");
    }
  }, [status, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);

  // Rate limiting 체크
  useEffect(() => {
    if (lockUntil) {
      const now = new Date();
      if (now >= lockUntil) {
        setIsLocked(false);
        setLockUntil(null);
        setLoginAttempts(0);
      } else {
        setIsLocked(true);
      }
    }
  }, [lockUntil]);

  const handleLogin = async () => {
    setErrorMsg("");

    // Rate limiting 체크
    if (isLocked && lockUntil) {
      const minutesLeft = Math.ceil((lockUntil.getTime() - new Date().getTime()) / 60000);
      const message = `Too many login attempts. Please try again in ${minutesLeft} minute(s).`;
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (!email || !password) {
      const message = "Please enter your email and password.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);

    try {
      // NextAuth Credentials Provider를 통한 실제 인증
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Rate limiting: 실패 시 시도 횟수 증가
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        // 5회 실패 시 15분 잠금
        if (newAttempts >= 5) {
          const lockTime = new Date();
          lockTime.setMinutes(lockTime.getMinutes() + 15);
          setLockUntil(lockTime);
          setIsLocked(true);
          const message = "Too many failed login attempts. Your account is locked for 15 minutes.";
          setErrorMsg(message);
          toast.error(message);
          setIsLoading(false);
          return;
        }

        const message = `Invalid email or password. (${newAttempts}/5 attempts)`;
        setErrorMsg(message);
        toast.error("Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // 로그인 성공
      setLoginAttempts(0); // 성공 시 시도 횟수 리셋
      setIsLoading(false);
      toast.success("Login successful!");

      // 설문조사는 홈 화면의 SurveyOverlay로 처리되므로
      // 로그인 후 바로 홈으로 이동
      router.push("/home");
    } catch (err) {
      console.error(err);
      const message = "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리 함수
  const handleSocialLogin = async (provider: "google" | "kakao" | "naver") => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await signIn(provider, {
        redirect: false,
      });

      if (result?.error) {
        // 로그인 실패 - 신규 사용자일 가능성
        console.log(`[Social Login] ${provider} login failed, redirecting to register`);
        toast.error("Please sign up first.");
        router.push(`/register?provider=${provider}`);
        return;
      }

      if (result?.ok) {
        // 로그인 성공 - 프로필 완성 여부 체크
        try {
          const profileResponse = await fetch("/api/auth/profile", {
            method: "GET",
            credentials: "include",
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();

            // 필수 정보 (givenName, familyName, birthDate, gender) 중 하나라도 없으면 프로필 완성 필요
            const isProfileIncomplete =
              !profileData.givenName ||
              !profileData.familyName ||
              !profileData.birthDate ||
              !profileData.gender;

            if (isProfileIncomplete) {
              console.log(`[Social Login] Profile incomplete, redirecting to register`);
              console.log(`[Social Login] Missing fields:`, {
                givenName: !profileData.givenName,
                familyName: !profileData.familyName,
                birthDate: !profileData.birthDate,
                gender: !profileData.gender,
              });
              toast("Please complete your profile.");

              // 회원가입 완성 페이지로 리다이렉트 (쿼리 파라미터로 정보 전달)
              const params = new URLSearchParams({
                provider: provider,
                email: profileData.email || "",
              });

              // 이미 있는 정보도 쿼리 파라미터로 전달 (자동 입력용)
              if (profileData.givenName) {
                params.append("name", profileData.givenName);
              }
              if (profileData.familyName) {
                params.append("familyName", profileData.familyName);
              }
              if (profileData.birthDate) {
                params.append("birthDate", profileData.birthDate);
              }
              if (profileData.gender) {
                params.append("gender", profileData.gender);
              }
              if (profileData.profileImageUrl) {
                params.append("image", profileData.profileImageUrl);
              }

              router.push(`/register?${params.toString()}`);
              return;
            }
          }
        } catch (err) {
          console.error("[Social Login] Profile check error:", err);
          // 프로필 조회 실패해도 홈으로 이동 (설문 팝업에서 처리)
        }

        // 프로필 완성됨 - 홈으로 이동
        toast.success("Login successful!");
        router.push("/home");
      }
    } catch (err) {
      console.error(`[Social Login] ${provider} error:`, err);
      toast.error("An error occurred during social login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-semibold mb-8">Mood Manager</h1>

      <div className="w-full max-w-sm space-y-3">

        {/* Email */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Email</label>
          <div className="flex items-center px-3 py-2 border rounded-md">
            <Mail size={18} className="text-gray-400 mr-2" />
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full outline-none"
              autoComplete="email"
              onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg("");
              }}
              onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading && !isLocked) handleLogin();
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Password</label>
          <div className="flex items-center px-3 py-2 border rounded-md relative">
            <Lock size={18} className="text-gray-400 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="password"
              className="w-full outline-none"
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
              onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading && !isLocked) handleLogin();
              }}
            />
            
            {/* 비밀번호 보기 토글 */}
            <button
              type="button"
              className="absolute right-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-gray-500" />
              ) : (
                <Eye size={18} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-red-500 text-sm">{errorMsg}</p>
        )}

        {/* Sign In */}
        <button
          onClick={handleLogin}
          disabled={isLoading || isLocked}
          className="w-full bg-black text-white h-12 rounded-lg font-medium active:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? "Signing in..." : isLocked ? "Account Locked" : "Sign In"}
        </button>

        {/* Sign Up */}
        <button
          onClick={() => router.push("/register")}
          className="w-full bg-white text-black h-12 rounded-lg font-medium border active:bg-gray-200 transition"
        >
          Sign Up
        </button>

        {/* Forgot Password */}
        <Link href="/forgot-password" className="text-sm text-gray-500 text-center block mt-1 hover:text-gray-700 transition underline">
          Forgot password?
        </Link>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="px-3 text-sm text-gray-500">Social Sign In</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center space-x-6 mt-4">

          {/* Google */}
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
            className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle size={24} />
          </button>

          {/* Kakao */}
          <button
            onClick={() => handleSocialLogin("kakao")}
            disabled={isLoading}
            className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SiKakao size={22} color="#FEE500" />
          </button>

          {/* Naver */}
          <button
            onClick={() => handleSocialLogin("naver")}
            disabled={isLoading}
            className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SiNaver size={22} color="#03C75A" />
          </button>

        </div>
      </div>
    </div>
  );
}
