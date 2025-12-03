import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

/**
 * 회원가입 폼 관리 커스텀 훅
 *
 * - 일반 회원가입: 모든 정보 입력
 * - 소셜 가입: 이메일, 이름은 자동 입력, 추가 정보만 입력
 */
export function useRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리에서 소셜 로그인 정보 가져오기
  const provider = searchParams?.get("provider") || ""; // google, kakao, naver
  const socialEmail = searchParams?.get("email") || "";
  const socialName = searchParams?.get("name") || "";
  const socialFamilyName = searchParams?.get("familyName") || "";
  const socialBirthDate = searchParams?.get("birthDate") || "";
  const socialGender = searchParams?.get("gender") || "";
  const socialImage = searchParams?.get("image") || "";

  const isSocialSignup = !!provider;

  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // 소셜 가입이면 받아온 정보 자동 입력
  useEffect(() => {
    if (isSocialSignup) {
      setEmail(socialEmail);

      if (socialName) {
        setName(socialName);
      }
      if (socialFamilyName) {
        setFamilyName(socialFamilyName);
      }
      if (socialBirthDate) {
        // YYYY-MM-DD → YYYY.MM.DD 형식으로 변환
        const date = new Date(socialBirthDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        setBirthDate(`${year}.${month}.${day}`);
      }
      if (socialGender) {
        setGender(socialGender as "male" | "female");
      }
    }
  }, [isSocialSignup, socialEmail, socialName, socialFamilyName, socialBirthDate, socialGender]);

  // 이메일 형식 검증
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 중복 체크 (디바운스)
  useEffect(() => {
    if (!email || isSocialSignup) {
      setEmailAvailable(null);
      setEmailError("");
      return;
    }

    if (!validateEmail(email)) {
      setEmailAvailable(null);
      setEmailError("");
      return;
    }

    const checkEmailTimeout = setTimeout(async () => {
      setIsCheckingEmail(true);
      setEmailError("");

      try {
        const response = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          setEmailAvailable(null);
          setEmailError(data.error);
        } else if (data.available) {
          setEmailAvailable(true);
          setEmailError("");
        } else {
          setEmailAvailable(false);
          setEmailError(data.message || "This email is already registered");
        }
      } catch (err) {
        console.error("[Email Check] Error:", err);
        // 네트워크/서버 에러 시에는 이메일 입력 UX를 방해하지 않기 위해
        // 화면에는 에러를 표시하지 않고, 중복 여부만 알 수 없는 상태로 둔다.
        setEmailAvailable(null);
        // emailError 는 건드리지 않음 (입력 단계에서 빨간 줄이 계속 뜨는 것을 방지)
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(checkEmailTimeout);
  }, [email, isSocialSignup]);

  // 비밀번호 강도 계산
  const calculatePasswordStrength = (password: string): "weak" | "medium" | "strong" | null => {
    if (password.length === 0) return null;
    if (password.length < 6) return "weak";

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return "weak";
    if (strength <= 3) return "medium";
    return "strong";
  };

  // 생년월일 포맷팅 함수
  const formatBirthDate = (value: string): string => {
    const numbers = value.replace(/[^0-9]/g, "");
    const limited = numbers.slice(0, 8);

    if (limited.length <= 4) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 4)}.${limited.slice(4)}`;
    } else {
      return `${limited.slice(0, 4)}.${limited.slice(4, 6)}.${limited.slice(6)}`;
    }
  };

  // 생년월일 검증 함수
  const validateBirthDate = (dateStr: string): string => {
    if (!dateStr) return "";

    const parts = dateStr.split(".");
    if (parts.length !== 3) return "Please enter date in yyyy.mm.dd format";

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || year < 1913 || year > 2013) {
      return "Year must be between 1913 and 2013";
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return "Month must be between 1 and 12";
    }

    if (isNaN(day) || day < 1) {
      return "Day is invalid";
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      return `Day must be between 1 and ${daysInMonth} for this month`;
    }

    return "";
  };

  // 폼 유효성 검사
  const isFormValid = () => {
    if (isSocialSignup) {
      // 소셜 가입: 비밀번호 불필요
      return (
        familyName.trim() !== "" &&
        name.trim() !== "" &&
        birthDate.trim() !== "" &&
        validateBirthDate(birthDate) === "" &&
        gender !== "" &&
        email.trim() !== ""
      );
    }

    // 일반 가입: 모든 필드 필요
    return (
      familyName.trim() !== "" &&
      name.trim() !== "" &&
      birthDate.trim() !== "" &&
      validateBirthDate(birthDate) === "" &&
      gender !== "" &&
      email.trim() !== "" &&
      validateEmail(email) &&
      password.length >= 6 &&
      passwordStrength !== "weak" &&
      password === confirmPassword &&
      confirmPassword.length > 0
    );
  };

  // 생년월일 문자열로 변환 (API 전송용)
  const getBirthDateString = () => {
    if (!birthDate) return "";
    const parts = birthDate.split(".");
    if (parts.length !== 3) return "";
    const year = parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleRegister = async () => {
    setErrorMsg("");
    setEmailError("");

    if (!familyName || !name || !birthDate || !gender || !email) {
      const message = "Please fill in all required fields.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    // 일반 가입이면 비밀번호 필수
    if (!isSocialSignup && (!password || !confirmPassword)) {
      const message = "Please enter your password.";
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    const dateError = validateBirthDate(birthDate);
    if (dateError) {
      setBirthDateError(dateError);
      toast.error(dateError);
      return;
    }

    if (!validateEmail(email)) {
      const message = "Please enter a valid email address.";
      setEmailError(message);
      toast.error(message);
      return;
    }

    // 일반 가입 비밀번호 검증
    if (!isSocialSignup) {
      if (password !== confirmPassword) {
        const message = "Passwords do not match.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }

      if (password.length < 6) {
        const message = "Password must be at least 6 characters.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }

      if (passwordStrength === "weak") {
        const message = "Password is too weak. Please use a stronger password.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }
    }

    try {
      const requestBody: Record<string, unknown> = {
        familyName,
        name,
        birthDate: getBirthDateString(),
        gender,
        email,
      };

      // 소셜 가입이면 provider 정보 추가, 일반 가입이면 비밀번호 추가
      if (isSocialSignup) {
        requestBody.provider = provider;
        requestBody.profileImageUrl = socialImage || null;
      } else {
        requestBody.password = password;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        const message = error.message || "Registration failed.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        const message = data.message || "Registration failed.";
        setErrorMsg(message);
        toast.error(message);
        return;
      }

      // 로그인 처리
      const { signIn } = await import("next-auth/react");

      if (isSocialSignup) {
        // 소셜 가입 완료 후 소셜 로그인으로 세션 생성
        toast.success("Registration successful! Logging you in...");
        const result = await signIn(provider, {
          redirect: false,
        });

        if (result?.error) {
          toast.error("Registration successful, but login failed. Please try logging in.");
          router.push("/login");
          return;
        }
      } else {
        // 일반 가입 완료 후 credentials 로그인
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Registration successful, but login failed. Please try logging in.");
          router.push("/login");
          return;
        }
      }

      toast.success("Welcome to Mood Manager!");
      router.push("/home");
    } catch (err) {
      console.error(err);
      const message = "An unexpected error occurred. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    }
  };

  return {
    // State
    familyName,
    name,
    birthDate,
    birthDateError,
    gender,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    errorMsg,
    emailError,
    isCheckingEmail,
    emailAvailable,
    passwordStrength,
    passwordsMatch,
    isSocialSignup,
    provider,
    // Disabled flags (소셜에서 이미 받아온 정보는 비활성화)
    isEmailDisabled: isSocialSignup && !!socialEmail,
    isNameDisabled: isSocialSignup && !!socialName,
    isFamilyNameDisabled: isSocialSignup && !!socialFamilyName,
    isBirthDateDisabled: isSocialSignup && !!socialBirthDate,
    isGenderDisabled: isSocialSignup && !!socialGender,
    // Setters
    setFamilyName,
    setName,
    setBirthDate,
    setBirthDateError,
    setGender,
    setEmail,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    setErrorMsg,
    setEmailError,
    setPasswordStrength,
    setPasswordsMatch,
    // Helpers
    validateEmail,
    calculatePasswordStrength,
    formatBirthDate,
    validateBirthDate,
    isFormValid,
    handleRegister,
  };
}
