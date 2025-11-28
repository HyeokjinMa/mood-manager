// ======================================================
// File: src/app/(main)/home/components/Device/DeviceAddModal.tsx
// ======================================================

/*
  [DeviceAddModal 역할 정리]

  - 디바이스 타입 + 이름을 한번에 입력하는 팝업
  - 타입 버튼 4종 (Manager / Light / Speaker / Scent)
      → 선택된 타입은 굵은 border + glow 효과
  - 이름 미입력 시 자동으로 "Light 2" 등으로 생성
  - Connect 클릭 → 1.5초 로딩 스피너 → onConfirm(type, name)
  - 모달 백그라운드 클릭 불가 (UX 명확성)
*/

"use client";

import { useState } from "react";
import type { DeviceType } from "@/types/device";
import { FaPalette, FaLightbulb, FaVolumeUp, FaSprayCan } from "react-icons/fa";

const TYPES = [
  { id: "manager", label: "Manager", icon: <FaPalette className="text-purple-500 text-3xl" /> },
  { id: "light", label: "Light", icon: <FaLightbulb className="text-yellow-500 text-3xl" /> },
  { id: "speaker", label: "Speaker", icon: <FaVolumeUp className="text-blue-500 text-3xl" /> },
  { id: "scent", label: "Scent", icon: <FaSprayCan className="text-green-500 text-3xl" /> },
] as const;

export default function DeviceAddModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (type: DeviceType, name?: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<DeviceType>("light");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const connect = () => {
    setLoading(true);

    setTimeout(() => {
      onConfirm(selected, name);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[330px] rounded-xl p-6 shadow-xl relative">

        <h2 className="text-center text-lg font-semibold mb-4">
          Device Connection
        </h2>

        {/* 타입 선택 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id as DeviceType)}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 border transition
                ${
                  selected === t.id
                    ? "border-black shadow-[0_0_8px_rgba(0,0,0,0.25)]"
                    : "border-gray-300"
                }
            `}
            >
              <div className="text-3xl">{t.icon}</div>
              <div className="text-sm">{t.label}</div>
            </button>
          ))}
        </div>

        {/* 이름 입력 */}
        <input
          type="text"
          placeholder="Enter device name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded-lg mb-5"
        />

        {/* Connect 버튼 */}
        <button
          onClick={connect}
          className="w-full py-2 bg-black text-white rounded-lg flex justify-center items-center"
          disabled={loading}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Connect"
          )}
        </button>

        {/* Cancel */}
        <button
          className="w-full mt-3 py-2 bg-gray-200 rounded-lg"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
