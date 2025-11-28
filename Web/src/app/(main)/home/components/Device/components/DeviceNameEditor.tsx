// ======================================================
// File: src/app/(main)/home/components/Device/components/DeviceNameEditor.tsx
// ======================================================

import { useState } from "react";

interface DeviceNameEditorProps {
  name: string;
  onUpdate: (name: string) => void;
}

export default function DeviceNameEditor({ name, onUpdate }: DeviceNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const handleSubmit = () => {
    if (editedName.trim() !== "" && editedName !== name) {
      onUpdate(editedName.trim());
    } else {
      setEditedName(name);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSubmit();
          } else if (e.key === "Escape") {
            handleCancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="text-lg font-semibold bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-black"
        autoFocus
      />
    );
  }

  return (
    <div
      className="text-lg font-semibold cursor-text hover:underline"
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Click to edit name"
    >
      {name}
    </div>
  );
}

