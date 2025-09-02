import React from "react";

interface TopbarProps {
  role: string;
  onChangeRole: (role: string) => void;
  envBanner?: React.ReactNode;
}

export default function Topbar({ role, onChangeRole, envBanner }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 border">Vectorius Prototype</span>
          {envBanner}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm opacity-70">Impersonate role:</label>
          <select
            value={role}
            onChange={(e) => onChangeRole(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option>Student</option>
            <option>Parent</option>
            <option>Mentor</option>
          </select>
        </div>
      </div>
    </header>
  );
}
