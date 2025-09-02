import React from "react";

interface SidebarProps {
  role: string;
  current: string;
  onNav: (key: string) => void;
}

const nav = [
  { key: "home", label: "Home" },
  { key: "assignments", label: "Assignments" },
  { key: "settings", label: "Settings" },
];

export default function Sidebar({ role, current, onNav }: SidebarProps) {
  return (
    <aside className="hidden md:block w-64 border-r border-gray-200 bg-white">
      <nav className="p-4 space-y-1">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{role} dashboard</div>
        {nav.map((item) => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm ${
              current === item.key ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
