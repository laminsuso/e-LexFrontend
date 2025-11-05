/* ===========================================================================
   Guided navigation (DocuSign-style) — container-relative & scroll-aware
   ==========================================================================*/
const isProbablyCompleteDefault = (f) => {
  if (f?.completed === true) return true;
  const v = f?.value;
  if (f?.type === "checkbox") return !!v;
  if (["signature", "initials", "image", "stamp"].includes(f?.type)) {
    return typeof v === "string" && v.length > 0; // usually a data URL
  }
  return v != null && String(v).trim() !== "";
};

function getPageEl(container, pageNumber) {
  const selector = `.react-pdf__Page[data-page-number="${pageNumber}"]`;
  return (container && container.querySelector(selector)) ||
         document.querySelector(selector) ||
         null;
}

function getPageInfo(container, pageNumber) {
  const pageEl = getPageEl(container, pageNumber);
  if (!pageEl) return { pageEl: null, pageWidth: 800, offsetX: 0, offsetY: 0, scale: 1 };

  const canvas = pageEl.querySelector("canvas");
  const pageWidth = (canvas && canvas.clientWidth) || pageEl.clientWidth || 800;
  const scale = pageWidth / VIRTUAL_WIDTH;

  // container-relative offsets
  const contRect = container?.getBoundingClientRect?.() || { left: 0, top: 0 };
  const pageRect = pageEl.getBoundingClientRect();
  const offsetX = pageRect.left - contRect.left + (container?.scrollLeft || 0);
  const offsetY = pageRect.top  - contRect.top  + (container?.scrollTop  || 0);

  return { pageEl, pageWidth, offsetX, offsetY, scale };
}

function toContainerCoords(field, container) {
  const { offsetX, offsetY, scale } = getPageInfo(container, field.pageNumber);
  const left = offsetX + (field.x || 0) * scale;
  const top  = offsetY + (field.y || 0) * scale;
  const width  = (field.width  || 160) * scale;
  const height = (field.height || 40)  * scale;
  return { left, top, width, height, scale };
}

function sortFields(fields) {
  return [...fields].sort((a, b) => {
    if ((a.pageNumber || 1) !== (b.pageNumber || 1)) return (a.pageNumber || 1) - (b.pageNumber || 1);
    if ((a.y || 0) !== (b.y || 0)) return (a.y || 0) - (b.y || 0);
    return (a.x || 0) - (b.x || 0);
  });
}

function GuidedSignNav({
  fields = [],
  containerRef,
  pageNumber,
  setPageNumber,
  onBeginField,
  isFieldComplete = isProbablyCompleteDefault,
}) {
  const container = containerRef?.current || null;

  const required = fields.filter((f) => f.required !== false);
  const ordered = sortFields(required);
  const firstIncompleteIndex = ordered.findIndex((f) => !isFieldComplete(f));
  const active = firstIncompleteIndex >= 0 ? ordered[firstIncompleteIndex] : null;

  // re-render on container scroll and window resize (to keep arrow glued)
  const [, force] = React.useState(0);
  useEffect(() => {
    if (!container) return;
    const onScroll = () => force((n) => n + 1);
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [container]);

  const jumpToField = (f, { smooth = true } = {}) => {
    if (!f || !container) return;
    // Change page first (if needed), then scroll inside the container.
    if (typeof setPageNumber === "function" && typeof pageNumber === "number" && pageNumber !== f.pageNumber) {
      setPageNumber(f.pageNumber);
      // allow React-PDF to paint the new page, then scroll
      setTimeout(() => {
        const p = toContainerCoords(f, container);
        container.scrollTo({ top: Math.max(0, p.top - 120), left: 0, behavior: smooth ? "smooth" : "auto" });
      }, 60);
    } else {
      const p = toContainerCoords(f, container);
      container.scrollTo({ top: Math.max(0, p.top - 120), left: 0, behavior: smooth ? "smooth" : "auto" });
    }
    onBeginField?.(f);
  };

  // Auto-focus first incomplete when available
  useEffect(() => {
    if (active && container) jumpToField(active, { smooth: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.pageNumber, container]);

  // Keyboard: Enter/Tab => next, Shift+Tab => prev
  useEffect(() => {
    const handler = (e) => {
      if (!ordered.length) return;
      if (e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        const idx = ordered.findIndex((f) => f.id === active?.id);
        const next = ordered.slice(Math.max(idx + 1, 0)).find((f) => !isFieldComplete(f));
        if (next) jumpToField(next);
      } else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const idx = ordered.findIndex((f) => f.id === active?.id);
        const prev = [...ordered.slice(0, Math.max(idx, 0))].reverse().find((f) => !isFieldComplete(f));
        if (prev) jumpToField(prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered.map((f) => f.id).join("|"), active?.id, pageNumber]);

  const handleNextClick = () => {
    if (!ordered.length) return;
    const idx = ordered.findIndex((f) => f.id === active?.id);
    const next = ordered.slice(Math.max(idx + 1, 0)).find((f) => !isFieldComplete(f)) ||
                 ordered.find((f) => !isFieldComplete(f));
    if (next) jumpToField(next);
  };

  const Beacon = ({ field }) => {
    if (!field || !container) return null;
    const p = toContainerCoords(field, container);
    const size = Math.max(28, Math.min(44, Math.round((p.width + p.height) / 12)));
    const left = Math.max(8, p.left - (size + 8));
    const top  = Math.max(8, p.top + p.height / 2 - size / 2);

    return (
      <div className="pointer-events-none absolute z-[70]" style={{ left, top, width: size, height: size }}>
        <div
          className="w-full h-full rounded-full relative"
          style={{
            background: "rgba(79,70,229,0.95)",
            boxShadow: "0 10px 15px rgba(0,0,0,0.15)",
            animation: "guidedPulse 1.6s ease-in-out infinite",
          }}
          title="Next required field"
        >
          <div className="absolute inset-0 flex items-center justify-center text-white" style={{ fontSize: Math.round(size * 0.55), lineHeight: 1 }}>
            ➜
          </div>
        </div>
        <style>{`
          @keyframes guidedPulse {
            0% { transform: scale(1); opacity: 1 }
            70% { transform: scale(1.08); opacity: .95 }
            100% { transform: scale(1); opacity: 1 }
          }
        `}</style>
      </div>
    );
  };

  const ActiveOutline = ({ field }) => {
    if (!field || !container) return null;
    const p = toContainerCoords(field, container);
    return (
      <div
        className="pointer-events-none absolute z-[60] rounded-md ring-4 ring-indigo-300/70"
        style={{ left: p.left - 2, top: p.top - 2, width: p.width + 4, height: p.height + 4 }}
      />
    );
  };

  const allDone = ordered.length > 0 && ordered.every(isFieldComplete);
  if (!ordered.length || allDone) return null;

  return (
    <>
      <Beacon field={active} />
      <ActiveOutline field={active} />
      {/* Keep the CTA button fixed to the viewport (not container) */}
      <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2">
        <button
          type="button"
          onClick={handleNextClick}
          className="shadow-lg rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 font-semibold"
        >
          Next required
        </button>
      </div>
    </>
  );
}
