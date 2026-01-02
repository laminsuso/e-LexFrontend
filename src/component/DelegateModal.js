import React, { useState } from "react";

export default function DelegateModal({
  open,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl w-[520px] max-w-[95vw] p-6">
        <h3 className="text-xl font-bold mb-2">Delegate signing</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter the email of the person who will sign on your behalf.
        </p>

        <label className="text-sm font-semibold">Delegate email *</label>
        <input
          className="w-full border rounded-lg p-3 mt-1 mb-4"
          placeholder="assistant@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="text-sm font-semibold">Delegate name (optional)</label>
        <input
          className="w-full border rounded-lg p-3 mt-1 mb-6"
          placeholder="Assistant Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ toEmail: email.trim(), toName: name.trim() })}
            className={`px-4 py-2 rounded-lg text-white ${
              loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
            }`}
            disabled={loading || !email.trim()}
          >
            {loading ? "Delegating..." : "Delegate"}
          </button>
        </div>
      </div>
    </div>
  );
}
