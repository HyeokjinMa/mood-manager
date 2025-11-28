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
  isEditingProfile: boolean;
  editedName: string;
  editedFamilyName: string;
  editedBirthDate: string;
  editedGender: "male" | "female" | "";
  editedPhone: string;
  profileImage: string | null;
  isUpdating: boolean;
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
  isEditingProfile,
  editedName,
  editedFamilyName,
  editedBirthDate,
  editedGender,
  editedPhone,
  profileImage,
  isUpdating,
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
        <h2 className="text-lg font-semibold">Profile</h2>
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
              <input
                type="text"
                value={editedFamilyName}
                onChange={(e) => onFamilyNameChange(e.target.value)}
                placeholder="Family Name"
                className="w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                value={editedName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Name"
                className="w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
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
            <input
              type="date"
              value={editedBirthDate}
              onChange={(e) => onBirthDateChange(e.target.value)}
              className="flex-1 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
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

        {/* Phone */}
        <div className="flex items-center text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 mr-3 flex-shrink-0"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          {isEditingProfile ? (
            <input
              type="tel"
              value={editedPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder={profile?.phone ? "" : "Add phone number"}
              className="flex-1 px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          ) : (
            <span className="text-gray-600">{profile?.phone || "-"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

