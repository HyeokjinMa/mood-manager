// ======================================================
// File: src/app/(main)/home/components/Device/DeviceDeleteModal.tsx
// ======================================================

/*
  [DeviceDeleteModal 역할]
  
  - 디바이스 삭제 확인 팝업
  - DeviceAddModal과 동일한 크기 (w-[330px])
  - 삭제 확인 및 취소 기능
*/

"use client";

import type { Device } from "@/types/device";
import { FaPalette, FaLightbulb, FaSprayCan, FaVolumeUp } from "react-icons/fa";

interface DeviceDeleteModalProps {
  device: Device;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeviceDeleteModal({
  device,
  onConfirm,
  onCancel,
}: DeviceDeleteModalProps) {
  const getIcon = () => {
    switch (device.type) {
      case "manager":
        return <FaPalette className="text-purple-500 text-3xl" />;
      case "light":
        return <FaLightbulb className="text-yellow-500 text-3xl" />;
      case "scent":
        return <FaSprayCan className="text-green-500 text-3xl" />;
      case "speaker":
        return <FaVolumeUp className="text-blue-500 text-3xl" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[330px] rounded-xl p-6 shadow-xl relative">
        <h2 className="text-center text-lg font-semibold mb-4">
          Delete Device
        </h2>

        {/* 디바이스 정보 */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-3xl">{getIcon()}</div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{device.name}</p>
            <p className="text-sm text-gray-500 capitalize">{device.type}</p>
          </div>
        </div>

        {/* 확인 메시지 */}
        <p className="text-center text-gray-600 mb-6 text-sm">
          Are you sure you want to delete this device? This action cannot be undone.
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
