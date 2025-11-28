// ======================================================
// File: src/app/(auth)/register/components/ConfirmPasswordSection.tsx
// ======================================================

import { Lock, Eye, EyeOff } from "lucide-react";

interface ConfirmPasswordSectionProps {
  confirmPassword: string;
  password: string;
  passwordsMatch: boolean | null;
  showConfirmPassword: boolean;
  onConfirmPasswordChange: (value: string) => void;
  onShowConfirmPasswordToggle: () => void;
  onErrorClear: () => void;
  onEnterKey: () => void;
}

export default function ConfirmPasswordSection({
  confirmPassword,
  password: _password, // eslint-disable-line @typescript-eslint/no-unused-vars
  passwordsMatch,
  showConfirmPassword,
  onConfirmPasswordChange,
  onShowConfirmPasswordToggle,
  onErrorClear,
  onEnterKey,
}: ConfirmPasswordSectionProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-gray-600">Confirm Password</label>
      <div
        className={`flex items-center px-3 py-2 border rounded-md relative transition-all ${
          confirmPassword && passwordsMatch === false
            ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
            : passwordsMatch === true
            ? "border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
            : ""
        }`}
      >
        <Lock
          size={18}
          className={`mr-2 ${
            confirmPassword && passwordsMatch === false
              ? "text-red-500"
              : passwordsMatch === true
              ? "text-green-500"
              : "text-gray-400"
          }`}
        />
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="confirm password"
          className="w-full outline-none"
          value={confirmPassword}
          onChange={(e) => {
            const newConfirmPassword = e.target.value;
            onConfirmPasswordChange(newConfirmPassword);
            onErrorClear();
            // setPasswordsMatch는 부모에서 처리
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnterKey();
          }}
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
      {confirmPassword && passwordsMatch === false && (
        <p className="text-red-500 text-xs">Passwords do not match.</p>
      )}
    </div>
  );
}

