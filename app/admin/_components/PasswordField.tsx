"use client";

import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";

/** Generates a readable random password (no look-alike characters). */
function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function PasswordField({
  name,
  id,
  label,
  generate = false,
  autoComplete = "new-password",
}: {
  name: string;
  id: string;
  label: string;
  generate?: boolean;
  autoComplete?: string;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            name={name}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            minLength={8}
            required
            autoComplete={autoComplete}
            className="input pr-10"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {generate && (
          <button
            type="button"
            onClick={() => {
              setValue(generatePassword());
              setVisible(true);
            }}
            className="btn-secondary !px-3 !py-2"
            title="Generate a password"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Generate</span>
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
    </div>
  );
}
