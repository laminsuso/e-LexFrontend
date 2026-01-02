import React, { useEffect, useRef, useState } from "react";

export default function ActionsDropdown({
  onSign,
  onDelegate,
  disableSign = false,
  disableDelegate = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-[#29354a] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2"
      >
        Actions
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            disabled={disableSign}
            onClick={() => {
              setOpen(false);
              onSign?.();
            }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
              disableSign ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            ✍️ Sign
          </button>

          <button
            type="button"
            disabled={disableDelegate}
            onClick={() => {
              setOpen(false);
              onDelegate?.();
            }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
              disableDelegate ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            👤 Delegate
          </button>
        </div>
      )}
    </div>
  );
}
