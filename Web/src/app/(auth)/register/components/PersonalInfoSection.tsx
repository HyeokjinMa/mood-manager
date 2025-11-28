// ======================================================
// File: src/app/(auth)/register/components/PersonalInfoSection.tsx
// ======================================================

import { User } from "lucide-react";

interface PersonalInfoSectionProps {
  familyName: string;
  name: string;
  familyNameDisabled?: boolean;
  nameDisabled?: boolean;
  onFamilyNameChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onErrorClear: () => void;
  onEnterKey: () => void;
}

export default function PersonalInfoSection({
  familyName,
  name,
  familyNameDisabled = false,
  nameDisabled = false,
  onFamilyNameChange,
  onNameChange,
  onErrorClear,
  onEnterKey,
}: PersonalInfoSectionProps) {
  return (
    <>
      {/* Family Name */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-gray-600">Family Name</label>
        <div className={`flex items-center px-3 py-2 border rounded-md ${familyNameDisabled ? "bg-gray-100" : ""}`}>
          <User size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Family name"
            className={`w-full outline-none ${familyNameDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
            value={familyName}
            disabled={familyNameDisabled}
            onChange={(e) => {
              onFamilyNameChange(e.target.value);
              onErrorClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEnterKey();
            }}
          />
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-gray-600">Name</label>
        <div className={`flex items-center px-3 py-2 border rounded-md ${nameDisabled ? "bg-gray-100" : ""}`}>
          <User size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Name"
            className={`w-full outline-none ${nameDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
            value={name}
            disabled={nameDisabled}
            onChange={(e) => {
              onNameChange(e.target.value);
              onErrorClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEnterKey();
            }}
          />
        </div>
      </div>
    </>
  );
}

