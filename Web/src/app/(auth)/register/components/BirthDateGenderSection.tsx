// ======================================================
// File: src/app/(auth)/register/components/BirthDateGenderSection.tsx
// ======================================================

interface BirthDateGenderSectionProps {
  birthDate: string;
  birthDateError: string;
  gender: "male" | "female" | "";
  birthDateDisabled?: boolean;
  genderDisabled?: boolean;
  onBirthDateChange: (value: string) => void;
  onGenderChange: (value: "male" | "female") => void;
  onErrorClear: () => void;
  onEnterKey: () => void;
  formatBirthDate: (value: string) => string;
  validateBirthDate: (value: string) => string;
}

export default function BirthDateGenderSection({
  birthDate,
  birthDateError,
  gender,
  birthDateDisabled = false,
  genderDisabled = false,
  onBirthDateChange,
  onGenderChange,
  onErrorClear,
  onEnterKey,
  formatBirthDate,
  validateBirthDate,
}: BirthDateGenderSectionProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex flex-col flex-1 space-y-2">
          <label className="text-sm text-gray-600">Date of Birth</label>
          <div className={`flex items-center px-3 py-2 border rounded-md ${
            birthDateError ? "border-red-500" : ""
          } ${birthDateDisabled ? "bg-gray-100" : ""}`}>
            <input
              type="text"
              placeholder="yyyy.mm.dd"
              className={`w-full outline-none ${birthDateDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              value={birthDate}
              disabled={birthDateDisabled}
              onChange={(e) => {
                const formatted = formatBirthDate(e.target.value);
                onBirthDateChange(formatted);
                onErrorClear();
              }}
              onBlur={() => {
                if (birthDate) {
                  validateBirthDate(birthDate);
                  // 에러는 부모 컴포넌트에서 처리됨 (onBirthDateChange 내부에서)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEnterKey();
              }}
              maxLength={10}
            />
          </div>
          {birthDateError && (
            <p className="text-red-500 text-xs">{birthDateError}</p>
          )}
        </div>

        <div className="flex flex-col flex-1 space-y-2">
          <label className="text-sm text-gray-600">Gender</label>
          <div className="flex border rounded-md overflow-hidden">
            <button
              type="button"
              disabled={genderDisabled}
              onClick={() => {
                onGenderChange("male");
                onErrorClear();
              }}
              className={`flex-1 px-4 py-2 text-sm border-r border-gray-300 transition ${
                gender === "male"
                  ? "bg-black text-white"
                  : genderDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Male
            </button>
            <button
              type="button"
              disabled={genderDisabled}
              onClick={() => {
                onGenderChange("female");
                onErrorClear();
              }}
              className={`flex-1 px-4 py-2 text-sm transition ${
                gender === "female"
                  ? "bg-black text-white"
                  : genderDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Female
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

