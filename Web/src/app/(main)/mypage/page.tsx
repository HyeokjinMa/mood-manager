// ======================================================
// File: src/app/(main)/mypage/page.tsx
// ======================================================

/*
  [MyPage 역할]
  
  - 페이지 레이아웃과 상태 관리만 담당
  - 모든 UI와 비즈니스 로직은 컴포넌트와 훅으로 분리
*/

"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import ProfileSection from "./components/ProfileSection";
import MenuSection from "./components/MenuSection";
import DeleteAccountModal from "./components/DeleteAccountModal";
import { useProfile } from "./hooks/useProfile";

export default function MyPage() {
  const { status } = useSession();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    profile,
    isEditingProfile,
    editedName,
    editedFamilyName,
    editedBirthDate,
    editedGender,
    editedPhone,
    profileImage,
    isUpdating,
    setIsEditingProfile,
    setEditedName,
    setEditedFamilyName,
    setEditedBirthDate,
    setEditedGender,
    setEditedPhone,
    handleImageChange,
    handleProfileUpdate,
    handleProfileCancel,
  } = useProfile();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "I understand") {
      return;
    }

    setIsDeleting(true);

    try {
      // API 호출: 회원탈퇴
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          confirmText: deleteConfirmText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      // 회원탈퇴 성공 시
      toast.success("Account deleted successfully");

      // 세션 종료 및 캐시 클리어
      await signOut({ redirect: false });
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // 로그인 페이지로 리다이렉트
      router.push("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account. Please try again."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
    }
  };

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-white">
      <TopNav />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[375px] mx-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <h1 className="text-xl font-semibold">My Page</h1>
          </div>

          {/* Profile Section */}
          <ProfileSection
            profile={profile}
            isEditingProfile={isEditingProfile}
            editedName={editedName}
            editedFamilyName={editedFamilyName}
            editedBirthDate={editedBirthDate}
            editedGender={editedGender}
            editedPhone={editedPhone}
            profileImage={profileImage}
            isUpdating={isUpdating}
            onEditClick={() => setIsEditingProfile(true)}
            onSave={handleProfileUpdate}
            onCancel={handleProfileCancel}
            onImageChange={handleImageChange}
            onNameChange={setEditedName}
            onFamilyNameChange={setEditedFamilyName}
            onBirthDateChange={setEditedBirthDate}
            onGenderChange={setEditedGender}
            onPhoneChange={setEditedPhone}
          />

          {/* Menu Section */}
          <MenuSection
            onLogout={handleLogout}
            onDeleteAccount={() => setShowDeleteConfirm(true)}
          />
        </div>
      </div>

      <BottomNav />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        show={showDeleteConfirm}
        confirmText={deleteConfirmText}
        isDeleting={isDeleting}
        onConfirmTextChange={setDeleteConfirmText}
        onConfirm={handleDeleteAccount}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirmText("");
        }}
      />
    </div>
  );
}
