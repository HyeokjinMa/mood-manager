// ======================================================
// File: src/app/(auth)/register/components/PasswordSection.tsx
// ======================================================

import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordSectionProps {
  password: string;
  passwordStrength: "weak" | "medium" | "strong" | "";
  passwordsMatch: boolean | null;
  showPassword: boolean;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onErrorClear: () => void;
  onEnterKey: () => void;
  calculatePasswordStrength: (password: string) => "weak" | "medium" | "strong" | "";
  confirmPassword: string;
}

export default function PasswordSection({
  password,
  passwordStrength,
  passwordsMatch,
  showPassword,
  onPasswordChange,
  onShowPasswordToggle,
  onErrorClear,
  onEnterKey,
  calculatePasswordStrength: _calculatePasswordStrength, // eslint-disable-line @typescript-eslint/no-unused-vars
  confirmPassword: _confirmPassword, // eslint-disable-line @typescript-eslint/no-unused-vars
}: PasswordSectionProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-gray-600">Password</label>
      <div
        className={`flex items-center px-3 py-2 border rounded-md relative transition-all ${
          passwordsMatch === true ? "border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.1)]" : ""
        }`}
      >
        <Lock
          size={18}
          className={`mr-2 ${
            passwordsMatch === true ? "text-green-500" : "text-gray-400"
          }`}
        />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="password"
          className="w-full outline-none"
          value={password}
          onChange={(e) => {
            const newPassword = e.target.value;
            onPasswordChange(newPassword);
            onErrorClear();
            // calculatePasswordStrength와 setPasswordsMatch는 부모에서 처리
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnterKey();
          }}
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
      {password && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  passwordStrength === "weak"
                    ? "bg-red-500 w-1/3"
                    : passwordStrength === "medium"
                    ? "bg-yellow-500 w-2/3"
                    : passwordStrength === "strong"
                    ? "bg-green-500 w-full"
                    : ""
                }`}
              />
            </div>
            <span className="text-xs text-gray-500">
              {passwordStrength === "weak"
                ? "Weak"
                : passwordStrength === "medium"
                ? "Medium"
                : passwordStrength === "strong"
                ? "Strong"
                : ""}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li className={password.length >= 6 ? "text-green-600" : ""}>
                At least 6 characters
              </li>
              <li className={password.length >= 8 ? "text-green-600" : ""}>
                At least 8 characters (recommended)
              </li>
              <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                Include uppercase letter
              </li>
              <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                Include number
              </li>
              <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600" : ""}>
                Include special character
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

