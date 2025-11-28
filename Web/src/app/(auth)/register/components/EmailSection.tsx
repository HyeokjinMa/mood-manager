// ======================================================
// File: src/app/(auth)/register/components/EmailSection.tsx
// ======================================================

import { Mail } from "lucide-react";

interface EmailSectionProps {
  email: string;
  emailError: string;
  emailDisabled?: boolean;
  onEmailChange: (value: string) => void;
  onErrorClear: () => void;
  onEnterKey: () => void;
  validateEmail: (email: string) => boolean;
}

export default function EmailSection({
  email,
  emailError,
  emailDisabled = false,
  onEmailChange,
  onErrorClear,
  onEnterKey,
  validateEmail: _validateEmail, // eslint-disable-line @typescript-eslint/no-unused-vars
}: EmailSectionProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-gray-600">Email</label>
      <div className={`flex items-center px-3 py-2 border rounded-md ${
        emailError ? "border-red-500" : ""
      } ${emailDisabled ? "bg-gray-100" : ""}`}>
        <Mail size={18} className="text-gray-400 mr-2" />
        <input
          type="email"
          placeholder="name@example.com"
          className={`w-full outline-none ${emailDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
          value={email}
          disabled={emailDisabled}
          onChange={(e) => {
            onEmailChange(e.target.value);
            onErrorClear();
          }}
          onBlur={() => {
            // 에러는 부모 컴포넌트에서 처리됨 (onEmailChange 내부에서)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnterKey();
          }}
        />
      </div>
      {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
    </div>
  );
}

