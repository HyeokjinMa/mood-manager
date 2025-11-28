// ======================================================
// File: src/app/(main)/home/components/Device/DeviceTypeSelectModal.tsx
// ======================================================

/*
  [DeviceTypeSelectModal 역할]

  - 새 디바이스 추가 시 타입 선택
  - manager / light / scent / speaker
*/

"use client";

import { FaPalette, FaLightbulb, FaSprayCan, FaVolumeUp } from "react-icons/fa";

export default function DeviceTypeSelectModal({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  const types = [
    { id: "manager", label: "Manager", icon: <FaPalette className="text-purple-500 text-3xl" /> },
    { id: "light", label: "Smart Light", icon: <FaLightbulb className="text-yellow-500 text-3xl" /> },
    { id: "scent", label: "Scent Diffuser", icon: <FaSprayCan className="text-green-500 text-3xl" /> },
    { id: "speaker", label: "Speaker", icon: <FaVolumeUp className="text-blue-500 text-3xl" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[300px] rounded-xl p-5 shadow-lg">
        <div className="text-lg font-semibold mb-4 text-center">
          디바이스 종류 선택
        </div>

        <div className="grid grid-cols-2 gap-3">
          {types.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="p-3 border rounded-xl flex flex-col items-center cursor-pointer hover:bg-gray-50"
            >
              <div className="text-3xl">{t.icon}</div>
              <div className="mt-1 text-sm">{t.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2 rounded-lg bg-gray-200 text-center"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
