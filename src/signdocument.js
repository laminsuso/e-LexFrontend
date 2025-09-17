// E-Lex/e-LexFrontend/src/signdocument.js
import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import DatePicker from "react-datepicker";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { toast, ToastContainer } from "react-toastify";

/* =========================
   PDF.js worker fallbacks
   ========================= */
const PDF_WORKER_URLS = [
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
];
(function setPDFWorker() {
  let i = 0;
  const tryWorker = () => {
    if (i < PDF_WORKER_URLS.length) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URLS[i++];
    }
  };
  tryWorker();
})();

/* =========================
   Constants & helpers
   ========================= */
const PAGE_RENDER_WIDTH = 800;

const FRONTEND_SIGNATURE_WIDTH = 200;
const FRONTEND_SIGNATURE_HEIGHT = 80;
const FRONTEND_TEXT_WIDTH = 200;
const FRONTEND_TEXT_HEIGHT = 40;
const FRONTEND_DATE_WIDTH = 120;
const FRONTEND_DATE_HEIGHT = 30;

const SIGNATURE_BLUE = "rgb(37, 99, 235)";

const ensureBluePen = (ctx) => {
  if (!ctx) return;
  ctx.strokeStyle = SIGNATURE_BLUE;
  ctx.fillStyle = SIGNATURE_BLUE;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
};

const toNumber = (v, def = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

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

const validateAndFixPDFUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) return `https://${url}`;
  return url;
};

// BLUE typed signature → PNG data URL
const convertTextToSignature = (text) => {
  const W = FRONTEND_SIGNATURE_WIDTH;
  const H = FRONTEND_SIGNATURE_HEIGHT;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = SIGNATURE_BLUE;

  let size = 40;
  ctx.font = `italic ${size}px "Great Vibes", cursive`;
  const maxWidth = W - 10;
  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `italic ${size}px "Great Vibes", cursive`;
  }
  ctx.fillText(text, W / 2, H / 2);
  return canvas.toDataURL("image/png");
};

/* =========================
   Component
   ========================= */
export default function SignDocumentPage() {
  const { documentId } = useParams();
  const location = useLocation();

  // user/profile/doc
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [signatureElements, setSignatureElements] = useState([]);

  // viewer state
  const [pdfData, setPdfData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const [forceImage, setForceImage] = useState(false);
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

  // element editor
  const [activeElement, setActiveElement] = useState(null);
  const [signatureType, setSignatureType] = useState(undefined); // draw | image | typed
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // drawing canvas
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const ratioRef = useRef(1);
  const [isDrawing, setIsDrawing] = useState(false);

  // saving overlay
  const [saving, setSaving] = useState(false);

  /* ---------- Load user + doc ---------- */
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(location.search);
        const email = params.get("email");
        let token = localStorage.getItem("token");

        if (!token) {
          const { data } = await axios.post(`${BASE_URL}/registerAndLogin`, { email });
          token = data.token;
          localStorage.setItem("token", token);
          setCurrentUser(data.user);
          setCurrentProfile(data.profile);
        } else {
          const me = await axios.get(`${BASE_URL}/getUser`, {
            headers: { authorization: `Bearer ${token}` },
          });
          setCurrentUser(me.data.user);
          setCurrentProfile(me.data.profile);
        }

        const resp = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`);
        const doc = resp.data.doc;
        setFile(doc.file);
        setSignatureElements(normalizeServerElements(doc.elements));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load document", { containerId: "signaturesign" });
      }
    })();
  }, [documentId, location.search]);

  /* ---------- Prefetch PDF bytes ---------- */
  useEffect(() => {
    if (!file) return;
    const url = validateAndFixPDFUrl(file);
    setPdfLoading(true);
    setPdfLoadError(null);
    setPdfData(null);

    axios
      .get(url, { responseType: "arraybuffer" })
      .then(({ data }) => {
        setPdfData(new Uint8Array(data));
        setPdfLoading(false);
        setForceImage(false);
      })
      .catch((err) => {
        console.error("PDF prefetch failed:", err);
        setPdfLoading(false);
        setPdfLoadError(err?.message || "Failed to load PDF");
        setForceImage(true);
      });
  }, [file]);

  /* ---------- Drawing setup (Hi-DPI) ---------- */
  useEffect(() => {
    if (!(canvasRef.current && activeElement?.type === "signature" && signatureType === "draw"))
      return;

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
    setPageNumber(1);
  };
  const onDocumentLoadError = (err) => {
    console.error("react-pdf error:", err);
    setPdfLoadError(err?.message || "Failed to load PDF");
    setForceImage(true);
  };

  /* ---------- Keyboard pager ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (numPages <= 1) return;
      if (e.key === "ArrowRight") setPageNumber((p) => Math.min(numPages, p + 1));
      if (e.key === "ArrowLeft") setPageNumber((p) => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  /* ---------- Draw handlers ---------- */
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

  /* ---------- Element click / edit ---------- */
  const handleElementClick = (element) => {
    if (element?.recipientEmail && element.recipientEmail !== currentUser?.email) {
      toast.error(
        `This field is for ${element.recipientEmail}. You are ${currentUser?.email}.`,
        { containerId: "signaturesign" }
      );
      return;
    }
    setActiveElement(element);
    setSignatureType(undefined);
    switch (element.type) {
      case "checkbox":
      case "radio":
      case "image":
        setInputValue(element.value || "");
        break;
      case "initials":
        setInputValue(element.value || currentProfile?.initials || "");
        break;
      case "date":
        setSelectedDate(new Date(element.value || Date.now()));
        break;
      default:
        setInputValue(element.value || "");
    }
  };

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

  const handleSave = () => {
    if (!activeElement) return;
    let value;

    switch (activeElement.type) {
      case "signature":
        if (signatureType === "draw") {
          value = canvasRef.current?.toDataURL("image/png") || null;        // draw → BLUE png
        } else if (signatureType === "image") {
          value = inputValue || currentProfile?.signature || null;          // uploaded image
        } else {
          value = inputValue ? convertTextToSignature(inputValue) : null;   // typed → BLUE png
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

  /* ---------- Persist signed PDF ---------- */
  const handleSaveDocument = async () => {
    try {
      const token = localStorage.getItem("token");
      setSaving(true);

      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        { documentId, elements: signatureElements },
        { headers: { authorization: `Bearer ${token}` }, responseType: "blob" }
      );

      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const f = new File([blob], `signedDocument-${documentId}.pdf`, { type: "application/pdf" });

      const form = new FormData();
      form.append("document", f);
      form.append("documentId", documentId);

      await axios.patch(`${BASE_URL}/editDocument/${documentId}`, form, {
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
      setSaving(false);
    }
  };

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

  /* ---------- Field preview ---------- */
  const renderFieldPreview = (element) => {
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
          position: "absolute",
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${width}px`,
          minHeight: `${height}px`,
        }}
      >
        <div className="flex-1">
          {element.value ? (
            ["signature", "image", "stamp"].includes(element.type) ? (
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
            <span className="text-gray-500 text-sm block break-words">{element.label || element.type}</span>
          )}
        </div>

        <div className="mt-1 text-xs text-gray-600 bg-gray-100 px-1 py-0.5 rounded truncate">
          <span className="font-medium">For:</span> {element.recipientEmail}
        </div>
      </div>
    );
  };

  /* ---------- PDF viewer ---------- */
  const renderPDF = () => {
    if (pdfLoadError) {
      return (
        <div className="flex items-center justify-center h-64 text-red-600">
          Failed to load document
        </div>
      );
    }
    if (pdfLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading PDF...</p>
        </div>
      );
    }
    if (forceImage) {
      return <img src={validateAndFixPDFUrl(file)} alt="Document" className="max-w-full h-auto" />;
    }
    if (!pdfData) return null;

    return (
      <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError}>
        <Page
          pageNumber={pageNumber}
          width={PAGE_RENDER_WIDTH}
          renderAnnotationLayer={false}
          renderTextLayer={false}
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
              {/* Pager always visible */}
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

              {/* PDF viewer + overlays */}
              <div className="relative inline-block">
                {renderPDF()}

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
                          style={{ touchAction: "none" }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                        <button onClick={handleClearCanvas} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">
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
                        <div className="text-center border p-2">
                          <img
                            src={convertTextToSignature(inputValue || " ")}
                            alt="Signature Preview"
                            width={FRONTEND_SIGNATURE_WIDTH}
                            height={FRONTEND_SIGNATURE_HEIGHT}
                            style={{ filter: "none", mixBlendMode: "normal" }}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {activeElement.type === "checkbox" && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!inputValue} onChange={(e) => setInputValue(e.target.checked)} className="w-5 h-5" />
                    <span className="text-sm">Checkbox</span>
                  </div>
                )}

                {activeElement.type === "image" && (
                  <div className="space-y-4">
                    <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
                      Click to upload image
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {inputValue && <img src={inputValue} alt="Preview" className="mx-auto max-h-32 object-contain" />}
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
      {saving && (
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

