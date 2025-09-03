// @ts-nocheck
"use client";
import React from "react";

export default function Dropdown({ label, value, onChange, options, getKey, getLabel, className }) {
  return (
    <div className={className || "mb-3"}>
      {label && <label className="block text-sm text-gray-600 mb-1">{label}</label>}
      <select
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value || null)}
        className="w-full text-sm border rounded px-2 py-1.5"
      >
        {(options || []).map((opt) => (
          <option
            key={(getKey ? getKey(opt) : opt?.id) || ""}
            value={(getKey ? getKey(opt) : opt?.id) || ""}
          >
            {(getLabel ? getLabel(opt) : `${opt?.first_name ?? ""} ${opt?.last_name ?? ""}`) || ""}
          </option>
        ))}
      </select>
    </div>
  );
}
