import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

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

/**
 * 프로필 관리 커스텀 훅
 *
 * [API 연동 완료] GET /api/auth/profile 호출
 */
export function useProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedFamilyName, setEditedFamilyName] = useState("");
  const [editedBirthDate, setEditedBirthDate] = useState("");
  const [editedGender, setEditedGender] = useState<"male" | "female" | "">("");
  const [editedPhone, setEditedPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 프로필 정보 조회 함수
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data.profile);
      setProfileImage(data.profile.profileImageUrl || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data.");
    }
  }, []);

  // 프로필 정보 조회 (실제 API 호출)
  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  // 프로필 정보가 변경되면 편집 필드도 업데이트
  useEffect(() => {
    if (profile) {
      setEditedName(profile.name);
      setEditedFamilyName(profile.familyName);
      setEditedBirthDate(profile.birthDate || "");
      setEditedGender(
        profile.gender === "Male"
          ? "male"
          : profile.gender === "Female"
            ? "female"
            : ""
      );
      setEditedPhone(profile.phone || "");
    }
  }, [profile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setProfileImageFile(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!editedName.trim() || !editedFamilyName.trim()) {
      toast.error("Name and Family Name are required.");
      return;
    }

    setIsUpdating(true);

    try {
      // FormData 구성
      const formData = new FormData();
      formData.append("name", editedName.trim());
      formData.append("familyName", editedFamilyName.trim());

      // 생년월일 (선택)
      if (editedBirthDate) {
        formData.append("birthDate", editedBirthDate);
      }

      // 성별 (선택)
      if (editedGender) {
        formData.append("gender", editedGender);
      }

      // 전화번호 (선택)
      if (editedPhone !== undefined) {
        formData.append("phone", editedPhone.trim());
      }

      // 프로필 이미지 (선택)
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      // API 호출
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.profile);
      setProfileImage(data.profile.profileImageUrl || null);
      setProfileImageFile(null);

      toast.success("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfileCancel = () => {
    if (profile) {
      setEditedName(profile.name);
      setEditedFamilyName(profile.familyName);
      setEditedBirthDate(profile.birthDate || "");
      setEditedGender(
        profile.gender === "Male"
          ? "male"
          : profile.gender === "Female"
            ? "female"
            : ""
      );
      setEditedPhone(profile.phone || "");
      setProfileImage(profile.profileImageUrl || null);
    }
    setProfileImageFile(null);
    setIsEditingProfile(false);
  };

  return {
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
  };
}

