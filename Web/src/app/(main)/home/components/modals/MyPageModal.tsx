/**
 * MyPageModal
 * 
 * mypage 페이지를 모달로 전환한 컴포넌트
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProfileSection from "@/app/(main)/mypage/components/ProfileSection";
import MenuSection from "@/app/(main)/mypage/components/MenuSection";
import DeleteAccountModal from "@/app/(main)/mypage/components/DeleteAccountModal";
import ChangePasswordModal from "@/app/(main)/mypage/components/ChangePasswordModal";
import { useProfile } from "@/app/(main)/mypage/hooks/useProfile";
// 관리자 모드 확인은 사용자 ID 기반으로만 수행
import { FaTimes } from "react-icons/fa";

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQnaClick?: () => void;
  onInquiryClick?: () => void;
  onPrivacyClick?: () => void;
}

export default function MyPageModal({ 
  isOpen, 
  onClose,
  onQnaClick,
  onInquiryClick,
  onPrivacyClick,
}: MyPageModalProps) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  // 관리자 모드 확인 (사용자 ID 기반으로만 확인, 이메일만으로는 판단하지 않음)
  const isAdminMode = (session?.user as { id?: string })?.id === "admin-mock-user-id";

  const handleLogout = async () => {
    await signOut({ redirect: false });
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push("/login");
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "I understand") {
      return;
    }

    setIsDeleting(true);

    try {
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

      toast.success("Account deleted successfully");

      await signOut({ redirect: false });
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      router.push("/login");
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-[375px] max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <FaTimes className="text-gray-600" />
        </button>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex-shrink-0">
          <h1 className="text-xl font-semibold">My Page</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Profile Section */}
          <ProfileSection
            profile={profile}
            isAdminMode={isAdminMode}
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
            onChangePassword={() => setShowChangePassword(true)}
            onQnaClick={onQnaClick}
            onInquiryClick={onInquiryClick}
            onPrivacyClick={onPrivacyClick}
          />
        </div>

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

        {/* Change Password Modal */}
        <ChangePasswordModal
          show={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      </div>
    </div>
  );
}

