// ======================================================
// File: src/app/(main)/mypage/components/DeleteAccountModal.tsx
// ======================================================

/*
  [DeleteAccountModal 역할]
  
  - 회원탈퇴 확인 모달
  - 확인 텍스트 입력 필요
*/

"use client";

interface DeleteAccountModalProps {
  show: boolean;
  confirmText: string;
  isDeleting: boolean;
  onConfirmTextChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteAccountModal({
  show,
  confirmText,
  isDeleting,
  onConfirmTextChange,
  onConfirm,
  onCancel,
}: DeleteAccountModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone. All your data will be permanently deleted. If you understand
          and want to proceed, please type <strong>&quot;I understand&quot;</strong> below.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => onConfirmTextChange(e.target.value)}
          placeholder="I understand"
          className="w-full px-3 py-2 border rounded-md mb-4"
        />
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== "I understand" || isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

