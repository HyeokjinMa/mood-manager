// ======================================================
// File: src/app/(auth)/register/components/RegisterForm.tsx
// ======================================================

/*
  [RegisterForm 역할]
  
  - 회원가입 폼 UI 컴포넌트
  - 모든 입력 필드와 검증 UI 포함
*/

"use client";

import Link from "next/link";
import type { useRegisterForm } from "../hooks/useRegisterForm";
import PersonalInfoSection from "./PersonalInfoSection";
import BirthDateGenderSection from "./BirthDateGenderSection";
import EmailSection from "./EmailSection";
import PasswordSection from "./PasswordSection";
import ConfirmPasswordSection from "./ConfirmPasswordSection";

interface RegisterFormProps {
  form: ReturnType<typeof useRegisterForm>;
}

export default function RegisterForm({ form }: RegisterFormProps) {
  const {
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
    isEmailDisabled,
    isNameDisabled,
    isFamilyNameDisabled,
    isBirthDateDisabled,
    isGenderDisabled,
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
    validateEmail,
    calculatePasswordStrength,
    formatBirthDate,
    validateBirthDate,
    isFormValid,
    handleRegister,
  } = form;

  // calculatePasswordStrength를 래핑하여 null을 ""로 변환
  const wrappedCalculatePasswordStrength = (password: string): "" | "weak" | "medium" | "strong" => {
    return calculatePasswordStrength(password) ?? "";
  };

  return (
    <div className="w-full max-w-sm space-y-5">
      <PersonalInfoSection
        familyName={familyName}
        name={name}
        familyNameDisabled={isFamilyNameDisabled}
        nameDisabled={isNameDisabled}
        onFamilyNameChange={(value) => {
          setFamilyName(value);
          setErrorMsg("");
        }}
        onNameChange={(value) => {
          setName(value);
          setErrorMsg("");
        }}
        onErrorClear={() => setErrorMsg("")}
        onEnterKey={handleRegister}
      />

      <BirthDateGenderSection
        birthDate={birthDate}
        birthDateError={birthDateError}
        gender={gender}
        birthDateDisabled={isBirthDateDisabled}
        genderDisabled={isGenderDisabled}
        onBirthDateChange={(value) => {
          const formatted = formatBirthDate(value);
          setBirthDate(formatted);
          setErrorMsg("");
          setBirthDateError("");
          if (formatted) {
            const error = validateBirthDate(formatted);
            setBirthDateError(error);
          }
        }}
        onGenderChange={(value) => {
          setGender(value);
          setErrorMsg("");
        }}
        onErrorClear={() => setErrorMsg("")}
        onEnterKey={handleRegister}
        formatBirthDate={formatBirthDate}
        validateBirthDate={validateBirthDate}
      />

      <EmailSection
        email={email}
        emailError={emailError}
        emailDisabled={isEmailDisabled}
        isCheckingEmail={isCheckingEmail}
        emailAvailable={emailAvailable}
        onEmailChange={(value) => {
          setEmail(value);
          setErrorMsg("");
          setEmailError("");
          if (value && !validateEmail(value)) {
            setEmailError("Please enter a valid email address.");
          }
        }}
        onErrorClear={() => setErrorMsg("")}
        onEnterKey={handleRegister}
        validateEmail={validateEmail}
      />

      {/* 소셜 가입이 아닐 때만 비밀번호 입력 */}
      {!isSocialSignup && (
        <>
          <PasswordSection
            password={password}
            passwordStrength={passwordStrength ?? ""}
            passwordsMatch={passwordsMatch}
            showPassword={showPassword}
            onPasswordChange={(value) => {
              setPassword(value);
              setErrorMsg("");
              setPasswordStrength(calculatePasswordStrength(value));
              if (confirmPassword) {
                setPasswordsMatch(value === confirmPassword);
              }
            }}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onErrorClear={() => setErrorMsg("")}
            onEnterKey={() => {
              if (isFormValid()) handleRegister();
            }}
            calculatePasswordStrength={wrappedCalculatePasswordStrength}
            confirmPassword={confirmPassword}
          />

          <ConfirmPasswordSection
            confirmPassword={confirmPassword}
            password={password}
            passwordsMatch={passwordsMatch}
            showConfirmPassword={showConfirmPassword}
            onConfirmPasswordChange={(value) => {
              setConfirmPassword(value);
              setErrorMsg("");
              if (value) {
                setPasswordsMatch(password === value);
              } else {
                setPasswordsMatch(null);
              }
            }}
            onShowConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            onErrorClear={() => setErrorMsg("")}
            onEnterKey={() => {
              if (isFormValid()) handleRegister();
            }}
          />
        </>
      )}

      {/* Error Message */}
      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

      {/* Sign Up */}
      <button
        onClick={handleRegister}
        disabled={!isFormValid()}
        className={`w-full py-2 rounded-lg font-medium transition ${
          isFormValid()
            ? "bg-black text-white active:bg-gray-700 cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Sign Up
      </button>

      {/* Sign In Link */}
      <div className="text-center">
        <span className="text-sm text-gray-600">Already have an account? </span>
        <Link
          href="/login"
          className="text-sm text-black underline hover:text-gray-700 transition"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

