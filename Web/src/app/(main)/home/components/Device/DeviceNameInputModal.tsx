// ======================================================
// File: src/app/(main)/home/components/Device/DeviceNameInputModal.tsx
// ======================================================

/*
  [DeviceNameInputModal 역할]

  - 타입 선택 후 이름 지정
  - 입력 완료 시 onSubmit(name)
*/

"use client";

import { useState } from "react";

export default function DeviceNameInputModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[300px] rounded-xl p-5 shadow-lg">
        <div className="text-lg font-semibold mb-4 text-center">
          디바이스 이름 지정
        </div>

        <input
          type="text"
          className="w-full p-2 border rounded-lg"
          placeholder="Smart Light 2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={() => {
            if (name.trim() !== "") onSubmit(name);
          }}
          className="w-full mt-4 py-2 rounded-lg bg-black text-white"
        >
          확인
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 rounded-lg bg-gray-200"
        >
          취소
        </button>
      </div>
    </div>
  );
}
