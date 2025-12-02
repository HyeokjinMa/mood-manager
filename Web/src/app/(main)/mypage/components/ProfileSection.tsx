// ======================================================
// File: src/app/(main)/mypage/components/ProfileSection.tsx
// ======================================================

/*
  [ProfileSection 역할]
  
  - 프로필 정보 표시 및 편집 UI
  - 프로필 이미지 업로드
  - 이름 편집 기능
*/

"use client";

import { useState, useEffect } from "react";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { Mail, Calendar, User, UserCircle, Edit2, Camera } from "lucide-react";

interface UserProfile {
  email: string;
  name: string;
  familyName: string;
  birthDate: string | null;
  gender: string | null;
  phone: string | null;
  createdAt: string;
  profileImageUrl?: string | null;
}

interface ProfileSectionProps {
  profile: UserProfile | null;
  isAdminMode?: boolean;
  isEditingProfile: boolean;
  editedName: string;
  editedFamilyName: string;
  editedBirthDate: string;
  editedGender: "male" | "female" | "";
  editedPhone: string;
  profileImage: string | null;
  isUpdating: boolean;
  nameError?: string;
  familyNameError?: string;
  birthDateError?: string;
  onEditClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (value: string) => void;
  onFamilyNameChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onGenderChange: (value: "male" | "female") => void;
  onPhoneChange: (value: string) => void;
}

export default function ProfileSection({
  profile,
  isAdminMode = false,
  isEditingProfile,
  editedName,
  editedFamilyName,
  editedBirthDate,
  editedGender,
  editedPhone,
  profileImage,
  isUpdating,
  nameError,
  familyNameError,
  birthDateError,
  onEditClick,
  onSave,
  onCancel,
  onImageChange,
  onNameChange,
  onFamilyNameChange,
  onBirthDateChange,
  onGenderChange,
  onPhoneChange,
}: ProfileSectionProps) {
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로딩 시뮬레이션 (실제로는 API 호출 시 사용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 로딩 중 스켈레톤 표시
  if (isLoading && !profile) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Profile</h2>
          {isAdminMode && (
            <span className="inline-flex items-center rounded-full border border-yellow-500 bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
              Admin Mode
            </span>
          )}
        </div>
        {!isEditingProfile ? (
          <button
            onClick={onEditClick}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition"
          >
            <Edit2 size={16} />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onCancel}
              disabled={isUpdating}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          {isEditingProfile ? (
            <label className="cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative group">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle size={32} className="text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle size={32} className="text-gray-400" />
              )}
            </div>
          )}
        </div>
        <div className="flex-1">
          {isEditingProfile ? (
            <div className="space-y-2">
              <div>
                <input
                  type="text"
                  value={editedFamilyName}
                  onChange={(e) => onFamilyNameChange(e.target.value)}
                  placeholder="Family Name"
                  className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                    familyNameError ? "border-red-500 focus:ring-red-500" : "focus:ring-black"
                  }`}
                />
                {familyNameError && (
                  <p className="text-red-500 text-xs mt-1">{familyNameError}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Name"
                  className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                    nameError ? "border-red-500 focus:ring-red-500" : "focus:ring-black"
                  }`}
                />
                {nameError && (
                  <p className="text-red-500 text-xs mt-1">{nameError}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">
                {profile?.familyName} {profile?.name}
              </h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="space-y-3">
        {/* Email (읽기 전용) */}
        <div className="flex items-center text-sm">
          <Mail size={16} className="text-gray-400 mr-3" />
          <span className="text-gray-600">{profile?.email}</span>
        </div>

        {/* Birth Date */}
        <div className="flex items-center text-sm">
          <Calendar size={16} className="text-gray-400 mr-3 flex-shrink-0" />
          {isEditingProfile ? (
            <div className="flex-1">
              <input
                type="date"
                value={editedBirthDate}
                onChange={(e) => onBirthDateChange(e.target.value)}
                className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                  birthDateError ? "border-red-500 focus:ring-red-500" : "focus:ring-black"
                }`}
              />
              {birthDateError && (
                <p className="text-red-500 text-xs mt-1">{birthDateError}</p>
              )}
            </div>
          ) : (
            <span className="text-gray-600">
              {profile?.birthDate
                ? new Date(profile.birthDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </span>
          )}
        </div>

        {/* Gender */}
        <div className="flex items-center text-sm">
          <User size={16} className="text-gray-400 mr-3 flex-shrink-0" />
          {isEditingProfile ? (
            <div className="flex gap-2 flex-1">
              <button
                type="button"
                onClick={() => onGenderChange("male")}
                className={`flex-1 px-3 py-1 text-sm border rounded-md transition ${
                  editedGender === "male"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => onGenderChange("female")}
                className={`flex-1 px-3 py-1 text-sm border rounded-md transition ${
                  editedGender === "female"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Female
              </button>
            </div>
          ) : (
            <span className="text-gray-600">{profile?.gender || "-"}</span>
          )}
        </div>

        {/* Phone 필드는 서비스 정책상 수집하지 않으므로 UI에서 숨김 (API 구조는 유지) */}
      </div>
    </div>
  );
}

