// E-Lex/e-LexFrontend/src/signdocument.js
import React, { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import DatePicker from "react-datepicker";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { toast, ToastContainer } from "react-toastify";

/* =========================
   Constants & helpers
   ========================= */

// Multiple CDN fallbacks for PDF.js worker
const PDF_WORKER_URLS = [
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
];
const setPDFWorker = () => {
  let i = 0;
  const tryWorker = () => {
    if (i < PDF_WORKER_URLS.length) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URLS[i++];
    }
  };
  tryWorker();
  return tryWorker;
};
const tryNextWorker = setPDFWorker();

// UI sizes
const FRONTEND_SIGNATURE_WIDTH = 200;
const FRONTEND_SIGNATURE_HEIGHT = 80;
const FRONTEND_TEXT_WIDTH = 200;
const FRONTEND_TEXT_HEIGHT = 40;
const FRONTEND_DATE_WIDTH = 120;
const FRONTEND_DATE_HEIGHT = 45;

// Blue ink for draw + typed signatures
const SIGNATURE_BLUE = "rgb(37, 99, 235)";
const ensureBluePen = (ctx) => {
  if (!ctx) return;
  ctx.strokeStyle = SIGNATURE_BLUE;
  ctx.fillStyle = SIGNATURE_BLUE;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
};

// number helper
const toNumber = (v, def = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// normalize elements coming from server (make page/pageNumber consistently numeric or null)
const normalizeServerElements = (arr) =>
  (arr || []).map((el) => {
    const page = toNumber(el.page ?? el.pageNumber, null);
    return {
      ...el,
      id: el._id || el.id || Math.random().toString(36).slice(2),
      page,
      pageNumber: page,
      label: el.label || el.type,
      value: el.value ?? null,
    };
  });

// fix relative or protocol-less URLs
const validateAndFixPDFUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) return `https://${url}`;
  return url;
};

/* =========================
   Component
   ========================= */
export default function SignDocumentPage() {
  const { documentId } = useParams();
  const location = useLocation();

  // Data state
  const [documentData, setDocumentData] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [preference, setPreference] = useState({
    user: "",
    allowed_signature_types: "",
    notify_on_signatures: false,
    timezone: "",
    date_format: "",
    send_in_order: "",
  });

  // PDF state
  const [file, setFile] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [forceImage, setForceImage] = useState(false); // fallback to image only if PDF truly fails

  // Elements state
  const [signatureElements, setSignatureElements] = useState([]);

  // Editor modal state
  const [activeElement, setActiveElement] = useState(null);
  const [signatureType, setSignatureType] = useState(undefined); // draw | image | typed
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Draw (native canvas)
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const ratioRef = useRef(1);
  const [isDrawing, setIsDrawing] = useState(false);

  // Saving overlay
  const [loading, setLoading] = useState(false);

  /* ---------- Load user & document ---------- */
  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(location.search);
        const email = params.get("email");
        let token = localStorage.getItem("token");

        if (!token) {
          const { data } = await axios.post(`${BASE_URL}/registerAndLogin`, { email });
          token = data.token;
          localStorage.setItem("token", token);
          setCurrentUser(data.user);
          setPreference(data.preference);
          setCurrentProfile(data.profile);
        } else {
          const me = await axios.get(`${BASE_URL}/getUser`, {
            headers: { authorization: `Bearer ${token}` },
          });
          setCurrentUser(me.data.user);
          setPreference(me.data.preference);
          setCurrentProfile(me.data.profile);
        }

        const resp = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`);
        const doc = resp.data.doc;
        setDocumentData(doc);
        setFile(doc.file);
        setSignatureElements(normalizeServerElements(doc.elements));
      } catch (error) {
        console.error("Document loading error:", error);
        toast.error("Failed to load document", { containerId: "signaturesign" });
      }
    }
    load();
  }, [documentId, location.search]);

  /* ---------- Draw tab setup (Hi-DPI) ---------- */
  useEffect(() => {
    if (!(canvasRef.current && activeElement?.type === "signature" && signatureType === "draw"))
      return;

    // Setup a crisp, scaled canvas
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    ratioRef.current = ratio;

    canvas.style.width = `${FRONTEND_SIGNATURE_WIDTH}px`;
    canvas.style.height = `${FRONTEND_SIGNATURE_HEIGHT}px`;
    canvas.width = Math.floor(FRONTEND_SIGNATURE_WIDTH * ratio);
    canvas.height = Math.floor(FRONTEND_SIGNATURE_HEIGHT * ratio);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ensureBluePen(ctx);
    ctxRef.current = ctx;

    // If user already has a saved signature image, preload it onto the canvas
    if (currentProfile?.signature) {
      const img = new Image();
      img.onload = () =>
        ctx.drawImage(img, 0, 0, FRONTEND_SIGNATURE_WIDTH, FRONTEND_SIGNATURE_HEIGHT);
      img.src = currentProfile.signature;
    }
  }, [activeElement, signatureType, currentProfile]);

  /* ---------- PDF events ---------- */
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages || 1);
    // Always reset to first page (also makes Prev/Next appear deterministically)
    setPageNumber(1);
    setPdfLoading(false);
    setPdfLoadError(null);
    setForceImage(false);
  };

  const onDocumentLoadError = (err) => {
    console.error("PDF loading error:", err);
    setPdfLoading(false);
    // Try another worker if the error looks worker-related
    if (err?.name === "MissingPDFException" || err?.message?.includes("worker")) {
      tryNextWorker();
      setTimeout(() => setFile((prev) => prev), 50);
    } else {
      // Last resort: allow image fallback
      setPdfLoadError(err?.message || "Failed to load PDF");
      setForceImage(true);
    }
  };

  const onDocumentLoadProgress = ({ loaded, total }) => {
    if (!total) return;
    const pct = Math.round((loaded / total) * 100);
    if (pct === 100) {
      // silent success
    }
  };

  /* ---------- Keyboard page navigation ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setPageNumber((p) => Math.min(numPages, p + 1));
      if (e.key === "ArrowLeft") setPageNumber((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  /* ---------- Drawing handlers ---------- */
  const getEventCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const startDrawing = (e) => {
    if (!activeElement || !ctxRef.current) return;
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);
    const ctx = ctxRef.current;
    ensureBluePen(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing || !ctxRef.current) return;
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);
    const ctx = ctxRef.current;
    ensureBluePen(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    ctxRef.current?.closePath();
    setIsDrawing(false);
  };

  /* ---------- Element click ---------- */
  const handleElementClick = (element) => {
    if (element?.recipientEmail !== currentUser?.email) {
      toast.error(
        `Your current email is ${currentUser?.email} it is for ${element?.recipientEmail}`,
        { containerId: "signaturesign" }
      );
      return;
    }
    setActiveElement(element);
    setSignatureType(undefined);

    switch (element.type) {
      case "checkbox":
        setInputValue(element.value || false);
        break;
      case "image":
        setInputValue(element.value || "");
        break;
      case "initials":
        setInputValue(element.value || currentProfile?.initials || "");
        break;
      case "radio":
        setInputValue(element.value || "");
        break;
      case "date":
        setSelectedDate(new Date(element.value || Date.now()));
        break;
      default:
        setInputValue(element.value || "");
    }
  };

  /* ---------- Typed signature renderer (blue cursive) ---------- */
  const convertTextToSignature = (text) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = FRONTEND_SIGNATURE_WIDTH;
    canvas.height = FRONTEND_SIGNATURE_HEIGHT;

    let size = 40; // start large, shrink if needed
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = SIGNATURE_BLUE;
    ctx.font = `italic ${size}px "Great Vibes", cursive`;

    const maxWidth = canvas.width - 10;
    while (ctx.measureText(text).width > maxWidth && size > 18) {
      size -= 2;
      ctx.font = `italic ${size}px "Great Vibes", cursive`;
    }
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL("image/png");
  };

  /* ---------- Save element value ---------- */
  const handleSave = () => {
    if (!activeElement) return;
    let value;
    switch (activeElement.type) {
      case "signature":
        if (signatureType === "draw") {
          value = canvasRef.current?.toDataURL("image/png") || null;
        } else if (signatureType === "image") {
          value = inputValue || currentProfile?.signature || null;
        } else {
          value = inputValue ? convertTextToSignature(inputValue) : null;
        }
        break;
      case "checkbox":
      case "radio":
      case "image":
        value = inputValue;
        break;
      case "initials":
        value = (inputValue || "").toUpperCase();
        break;
      case "date":
        value = selectedDate.toLocaleDateString();
        break;
      default:
        value = inputValue;
    }
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === activeElement.id ? { ...el, value } : el))
    );
    setActiveElement(null);
    setInputValue("");
  };

  /* ---------- Image upload ---------- */
  const handleImageUpload = (e) => {
    if (!activeElement || !e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignatureElements((prev) =>
        prev.map((el) => (el.id === activeElement.id ? { ...el, value: ev.target.result } : el))
      );
      setActiveElement(null);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  /* ---------- Clear signature canvas ---------- */
  const handleClearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, FRONTEND_SIGNATURE_WIDTH, FRONTEND_SIGNATURE_HEIGHT);
    ensureBluePen(ctx);
    if (currentProfile?.signature) {
      const img = new Image();
      img.onload = () =>
        ctx.drawImage(img, 0, 0, FRONTEND_SIGNATURE_WIDTH, FRONTEND_SIGNATURE_HEIGHT);
      img.src = currentProfile.signature;
    }
  };

  /* ---------- Persist signed document ---------- */
  const handleSaveDocument = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        { documentId, elements: signatureElements },
        { headers: { authorization: `Bearer ${token}` }, responseType: "blob" }
      );

      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const f = new File([blob], `signedDocument-${documentId}.pdf`, { type: "application/pdf" });

      const dataForm = new FormData();
      dataForm.append("document", f);
      dataForm.append("documentId", documentId);

      await axios.patch(`${BASE_URL}/editDocument/${documentId}`, dataForm, {
        headers: { authorization: `Bearer ${token}` },
      });

      await axios.patch(
        `${BASE_URL}/signDocument`,
        { documentId, email: currentUser.email },
        { headers: { authorization: `Bearer ${token}` } }
      );

      toast.success("Document signed", { containerId: "signaturesign" });
      window.location.href = "/admin";
    } catch (e) {
      toast.error(e?.response?.data?.error || "Something went wrong", {
        containerId: "signaturesign",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Decline signing ---------- */
  const declineSign = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${BASE_URL}/declineDocs`,
        { email: currentUser.email, docId: documentId },
        { headers: { authorization: `Bearer ${token}` } }
      );
      toast.success("Sign declined successfully", { containerId: "signaturesign" });
      setTimeout(() => window.close(), 500);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Something went wrong", {
        containerId: "signaturesign",
      });
    }
  };

  /* ---------- Field preview (render only on its page) ---------- */
  const renderFieldPreview = (element) => {
    // If backend missed page info, hide it (prevents "falling back" to page 1)
    const p = Number(element.page ?? element.pageNumber);
    if (!Number.isFinite(p) || p !== pageNumber) return null;

    const typeStyles = {
      signature: "border-blue-500 bg-blue-50",
      date: "border-purple-500 bg-purple-50",
      text: "border-gray-500 bg-gray-50",
      name: "border-green-500 bg-green-50",
      email: "border-yellow-500 bg-yellow-50",
      jobTitle: "border-pink-500 bg-pink-50",
      company: "border-indigo-500 bg-indigo-50",
      checkbox: "border-orange-500 bg-orange-50",
      radio: "border-teal-500 bg-teal-50",
      image: "border-indigo-500 bg-indigo-50",
      initials: "border-cyan-500 bg-cyan-50",
      stamp: "border-red-500 bg-red-50",
    };

    const dimensions = {
      signature: { width: FRONTEND_SIGNATURE_WIDTH, height: FRONTEND_SIGNATURE_HEIGHT },
      date: { width: FRONTEND_DATE_WIDTH, height: FRONTEND_DATE_HEIGHT },
      stamp: { width: FRONTEND_SIGNATURE_WIDTH, height: FRONTEND_SIGNATURE_HEIGHT },
      default: { width: FRONTEND_TEXT_WIDTH, height: FRONTEND_TEXT_HEIGHT },
    };
    const { width, height } = dimensions[element.type] || dimensions.default;

    return (
      <div
        key={element.id}
        className={`border-2 p-2 cursor-pointer overflow-hidden flex flex-col ${typeStyles[element.type]}`}
        onClick={() => handleElementClick(element)}
        style={{
          left: `${element.x}px`,
          top: `${element.y}px`,
          position: "absolute",
          width: `${width}px`,
          minHeight: `${height}px`,
        }}
        aria-label={`${element.type} field for ${element.recipientEmail || "recipient"}`}
      >
        <div className="flex-1">
          {element.value ? (
            element.type === "signature" || element.type === "image" || element.type === "stamp" ? (
              <img src={element.value} alt={element.type} className="w-full h-full object-contain" />
            ) : element.type === "checkbox" ? (
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={!!element.value} readOnly className="w-4 h-4" />
              </div>
            ) : element.type === "initials" ? (
              <div className="text-2xl font-bold text-center">{element.value}</div>
            ) : (
              <span className="text-sm block break-words">{element.value}</span>
            )
          ) : (
            <span className="text-gray-500 text-sm block break-words">
              {element.label || element.type}
            </span>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-600 bg-gray-100 px-1 py-0.5 rounded truncate">
          <span className="font-medium">For:</span> {element.recipientEmail}
        </div>
      </div>
    );
  };

  /* ---------- PDF viewer ---------- */
  const renderPDFDocument = () => {
    const validatedUrl = validateAndFixPDFUrl(file);

    if (forceImage) {
      // last-resort fallback—shows only first page if a multi-page PDF was mis-uploaded as image
      return (
        <img
          src={validatedUrl}
          alt="Document"
          className="max-w-full h-auto"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      );
    }

    return (
      <Document
        file={validatedUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onLoadProgress={onDocumentLoadProgress}
        loading={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading PDF...</p>
            </div>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="text-red-600 text-center p-4">
              <h3 className="font-semibold mb-2">PDF Loading Failed</h3>
              <p className="text-sm mb-4">Unable to load the PDF document</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={800}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          loading={
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96 bg-gray-100">
              <p className="text-gray-600">Failed to load page</p>
            </div>
          }
        />
      </Document>
    );
  };

  /* =========================
     Render
     ========================= */
  return (
    <div>
      <ToastContainer containerId="signaturesign" />

      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 p-4 overflow-auto relative">
          {/* Top actions */}
          <button
            onClick={declineSign}
            className="absolute top-4 right-[20%] z-50 bg-[#29354a] text-white px-6 py-2 rounded-[20px] shadow-l"
          >
            Decline
          </button>
          <button
            onClick={handleSaveDocument}
            className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-l"
            disabled={signatureElements.some(
              (el) => !el.value && el.recipientEmail === currentUser?.email
            )}
          >
            Complete Signing
          </button>

          {/* Body */}
          {!file ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading document...</p>
            </div>
          ) : (
            <div className="relative">
              {/* Always-visible page controls (disabled when not applicable) */}
              <div className="flex items-center gap-3 my-3">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                  className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-600">
                  Page {pageNumber} / {numPages}
                </span>
                <button
                  onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                  disabled={pageNumber >= numPages}
                  className="px-3 py-1 rounded bg-slate-200 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>

              {/* PDF viewer */}
              <div className="relative inline-block">
                {renderPDFDocument()}

                {/* Overlays for the current page only */}
                {signatureElements
                  .filter((el) => {
                    const p = Number(el.page ?? el.pageNumber);
                    return Number.isFinite(p) && p === pageNumber;
                  })
                  .map(renderFieldPreview)}
              </div>
            </div>
          )}

          {/* Modal for editing elements */}
          {activeElement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">{activeElement.label}</h3>

                {activeElement.type === "signature" && (
                  <>
                    <div className="flex border-b mb-4">
                      <button
                        className={`flex-1 py-2 ${signatureType === "draw" ? "border-b-2 border-blue-500" : ""}`}
                        onClick={() => setSignatureType("draw")}
                      >
                        Draw
                      </button>
                      <button
                        className={`flex-1 py-2 ${signatureType === "image" ? "border-b-2 border-blue-500" : ""}`}
                        onClick={() => setSignatureType("image")}
                      >
                        Upload
                      </button>
                      <button
                        className={`flex-1 py-2 ${signatureType === "typed" ? "border-b-2 border-blue-500" : ""}`}
                        onClick={() => setSignatureType("typed")}
                      >
                        Type
                      </button>
                    </div>

                    {signatureType === "draw" && (
                      <div className="mb-4">
                        <canvas
                          ref={canvasRef}
                          width={FRONTEND_SIGNATURE_WIDTH}
                          height={FRONTEND_SIGNATURE_HEIGHT}
                          className="border mb-2"
                          style={{ touchAction: "none", filter: "none" }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                        <button
                          onClick={handleClearCanvas}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {signatureType === "image" && (
                      <div className="space-y-4">
                        {currentProfile?.signature && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">Existing Signature:</p>
                            <img
                              src={currentProfile.signature}
                              alt="Existing Signature"
                              className="mx-auto w-40 h-20 object-contain border rounded"
                            />
                          </div>
                        )}
                        <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
                          {currentProfile?.signature ? "Click to upload new image" : "Click to upload signature image"}
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                    )}

                    {signatureType === "typed" && (
                      <>
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="w-full p-2 border rounded mb-4"
                          placeholder="Type your signature"
                        />
                        {inputValue && (
                          <div className="text-center border p-2">
                            <img
                              src={convertTextToSignature(inputValue)}
                              alt="Signature Preview"
                              className="mx-auto"
                              style={{ width: FRONTEND_SIGNATURE_WIDTH, height: FRONTEND_SIGNATURE_HEIGHT }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {activeElement.type === "checkbox" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!inputValue}
                      onChange={(e) => setInputValue(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">Checkbox</span>
                  </div>
                )}

                {activeElement.type === "image" && (
                  <div className="space-y-4">
                    <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
                      Click to upload image
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {inputValue && (
                      <img src={inputValue} alt="Preview" className="mx-auto max-h-32 object-contain" />
                    )}
                  </div>
                )}

                {activeElement.type === "initials" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                      className="w-full p-2 border rounded mb-4 text-center text-xl font-bold"
                      placeholder="Enter initials"
                      maxLength={3}
                    />
                    {inputValue && (
                      <div className="text-center border p-2">
                        <div className="text-2xl font-bold">{inputValue}</div>
                      </div>
                    )}
                  </div>
                )}

                {activeElement.type === "radio" && (
                  <div className="space-y-2">
                    {(activeElement.options?.split(",") || []).map((option, i) => (
                      <label key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={activeElement.id}
                          checked={inputValue === option.trim()}
                          onChange={() => setInputValue(option.trim())}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{option.trim()}</span>
                      </label>
                    ))}
                  </div>
                )}

                {activeElement.type === "date" && (
                  <DatePicker selected={selectedDate} onChange={setSelectedDate} inline className="w-full text-center" />
                )}

                {["text", "name", "email", "jobTitle", "company"].includes(activeElement.type) && (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    placeholder={`Enter ${activeElement.type}`}
                  />
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={() => setActiveElement(null)} className="bg-gray-200 px-4 py-2 rounded">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saving overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Updating Document</h3>
            <p className="text-gray-600">Please wait while the document is being updated</p>
          </div>
        </div>
      )}
    </div>
  );
}
