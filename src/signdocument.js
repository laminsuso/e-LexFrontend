import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import DatePicker from "react-datepicker";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { toast, ToastContainer } from "react-toastify";

/** PDF worker with fallbacks */
const PDF_WORKER_URLS = [
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
];
const setPDFWorker = () => {
  let workerIndex = 0;
  const tryWorker = () => {
    if (workerIndex < PDF_WORKER_URLS.length) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URLS[workerIndex];
      workerIndex++;
    }
  };
  tryWorker();
  return tryWorker;
};
const tryNextWorker = setPDFWorker();

/** Clean labels used in the signer UI (we never show legacy “For: …”) */
const CONTACT_LABEL = { name: "Name", email: "Email", phone: "Phone" };

/** Default sizes (keep boxes small first) */
const SIG_W = 160;
const SIG_H = 60;
const SIG_W_MAX = 320;
const SIG_H_MAX = 120;

const TXT_W = 200;
const TXT_H = 40;
const TXT_W_MAX = 320;

const DATE_W = 120;
const DATE_H = 45;

/** Signature drawing config */
const SIGNATURE_BLUE = "#1a73e8";
const MIN_WIDTH = 0.8;
const MAX_WIDTH = 2.6;
const SMOOTHING = 0.85;
const VELOCITY_FILTER = 0.7;

/* ---------- Helpers to pick the right recipient and pre-fill fields ---------- */
function resolveCurrentRecipient(signingData = {}) {
  const inviteEmail =
    (signingData.queryEmail ||
      signingData.recipientEmail ||
      signingData.signerEmail ||
      signingData.email ||
      (signingData.user && signingData.user.email) ||
      "") + "";

  if (Array.isArray(signingData.recipients) && inviteEmail) {
    const match = signingData.recipients.find(
      (r) => (r.email || "").toLowerCase() === inviteEmail.toLowerCase()
    );
    if (match) return match;
  }
  if (Array.isArray(signingData.recipients) && signingData.recipients.length === 1) {
    return signingData.recipients[0];
  }
  return {
    email: inviteEmail || undefined,
    name:
      (signingData.user && signingData.user.name) ||
      (signingData.profile && signingData.profile.name) ||
      undefined,
    phone:
      (signingData.user &&
        (signingData.user.phone || signingData.user.mobile || signingData.user.phoneNumber)) ||
      (signingData.profile && (signingData.profile.phone || signingData.profile.mobile)) ||
      undefined,
  };
}

/** Remove legacy labels/For: UI and normalize for display */
function sanitizeIncomingElements(elements = []) {
  return elements.map((el) => {
    const type = el.type;
    const cleanLabel = type === "signature" ? "Sign" : CONTACT_LABEL[type] || el.type;
    return {
      ...el,
      id: el._id || Math.random().toString(36).substr(2, 9),
      label: cleanLabel,
      value: el.value ?? null,
    };
  });
}

/* --------------------- Canvas helpers (auto-size + trim) -------------------- */

const offscreenCanvas = document.createElement("canvas");
const offCtx = offscreenCanvas.getContext("2d");

/** Measure text width to grow text boxes only if needed */
function measureTextPx(text, font = "14px system-ui, -apple-system, Segoe UI, Roboto") {
  offCtx.font = font;
  const metrics = offCtx.measureText(text || "");
  return Math.ceil(metrics.width);
}
function autosizeTextBoxWidth(current, text) {
  const paddingX = 16; // matches .p-2
  const needed = measureTextPx(text) + paddingX * 2;
  return Math.max(Math.min(Math.max(current, TXT_W), TXT_W_MAX), Math.min(needed, TXT_W_MAX));
}

/** Trim PNG/JPG margins (transparent or near-white) so the ink aligns perfectly */
async function trimImageDataURL(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      offscreenCanvas.width = w;
      offscreenCanvas.height = h;
      offCtx.clearRect(0, 0, w, h);
      offCtx.drawImage(img, 0, 0);

      const { data } = offCtx.getImageData(0, 0, w, h);

      let minX = w,
        minY = h,
        maxX = 0,
        maxY = 0;
      let found = false;

      // Treat alpha>10 OR non-white (RGB < 248) as ink
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i],
            g = data[i + 1],
            b = data[i + 2],
            a = data[i + 3];
          const nonTransparent = a > 10;
          const notWhite = r < 248 || g < 248 || b < 248;
          if (nonTransparent && notWhite) {
            found = true;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!found) return resolve(dataUrl); // nothing to trim

      const trimW = Math.max(1, maxX - minX + 1);
      const trimH = Math.max(1, maxY - minY + 1);
      const out = document.createElement("canvas");
      const octx = out.getContext("2d");
      out.width = trimW;
      out.height = trimH;
      octx.drawImage(offscreenCanvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
      resolve(out.toDataURL("image/png"));
    };
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
  });
}

/* ================================= Component ================================ */

const SignDocumentPage = () => {
  const { documentId } = useParams();
  const location = useLocation();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState("");
  const [file, setFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [signatureElements, setSignatureElements] = useState([]);
  const [activeElement, setActiveElement] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasContext, setCanvasContext] = useState(null);
  const [signatureType, setSignatureType] = useState();
  const [preference, setPreference] = useState({
    user: "",
    allowed_signature_types: "",
    notify_on_signatures: false,
    timezone: "",
    date_format: "",
    send_in_order: "",
  });
  const [numPages, setNumPages] = useState(1);

  const [currentUser, setCurrentUser] = useState("");
  const [loadingError, setLoadingError] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  /* ---------------------------- Load document ---------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const queryEmail = (params.get("email") || "").trim();

        // Session for the link owner
        let token = localStorage.getItem("token");
        let me = null;

        if (token) {
          const res = await axios.get(`${BASE_URL}/getUser`, {
            headers: { authorization: `Bearer ${token}` },
          });
          me = res.data;
          if (
            queryEmail &&
            (res.data?.user?.email || "").toLowerCase() !== queryEmail.toLowerCase()
          ) {
            const auth = await axios.post(`${BASE_URL}/registerAndLogin`, { email: queryEmail });
            localStorage.setItem("token", auth.data.token);
            token = auth.data.token;
            me = auth.data;
          }
        } else {
          const auth = await axios.post(`${BASE_URL}/registerAndLogin`, { email: queryEmail });
          localStorage.setItem("token", auth.data.token);
          token = auth.data.token;
          me = auth.data;
        }

        setCurrentUser(me.user);
        setPreference(me.preference);
        setCurrentProfile(me.profile);

        const docRes = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`);
        const doc = docRes.data.doc || {};
        setDocumentData(doc);
        setFile(doc.file);

        const signingContext = {
          recipients: doc.recipients || [],
          queryEmail,
          user: me.user,
          profile: me.profile,
        };
        const recipient = resolveCurrentRecipient(signingContext);

        // sanitize + prefill (keep small; autosize only for present values)
        const sanitized = sanitizeIncomingElements(doc.elements || []);
        const prefilled = sanitized.map((el) => {
          const assignedEmail = (el.recipientEmail || "").toLowerCase();
          const rEmail = (recipient.email || "").toLowerCase();
          const sameRecipient = !assignedEmail || (rEmail && assignedEmail === rEmail);
          if (!sameRecipient) return el;

          if (!el.value || String(el.value).trim() === "") {
            if (el.type === "name" && recipient.name) {
              return { ...el, value: recipient.name, width: autosizeTextBoxWidth(el.width || TXT_W, recipient.name) };
            }
            if (el.type === "email" && recipient.email) {
              return { ...el, value: recipient.email, width: autosizeTextBoxWidth(el.width || TXT_W, recipient.email) };
            }
            if (el.type === "phone" && (recipient.phone || recipient.mobile || recipient.phoneNumber)) {
              const phone = recipient.phone || recipient.mobile || recipient.phoneNumber;
              return { ...el, value: phone, width: autosizeTextBoxWidth(el.width || TXT_W, phone) };
            }
          }
          // If already has a value, keep width but ensure it's not below default
          if (["name", "email", "phone", "text", "jobTitle", "company"].includes(el.type) && el.value) {
            const w = autosizeTextBoxWidth(el.width || TXT_W, el.value);
            return { ...el, width: w };
          }
          return el;
        });

        setSignatureElements(prefilled);
      } catch (err) {
        console.error("Load error:", err);
        setLoadingError("Failed to load document");
      }
    };

    load();
  }, [documentId, location.search]);

  /* ------------------------ Signature drawing setup ----------------------- */
  useEffect(() => {
    if (canvasRef.current && activeElement?.type === "signature" && signatureType === "draw") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineWidth = MAX_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = SIGNATURE_BLUE;
      setCanvasContext(ctx);
      if (currentProfile?.signature) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        img.src = currentProfile.signature;
      }
    }
  }, [activeElement, signatureType, currentProfile]);

  /* ----------------------------- PDF handlers ----------------------------- */
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfLoadError(null);
  };
  const onDocumentLoadError = (error) => {
    console.error("PDF loading error:", error);
    setPdfLoading(false);
    if (error.name === "MissingPDFException" || error.message?.includes("worker")) {
      tryNextWorker();
      setTimeout(() => setFile((prev) => prev), 100);
    } else {
      setPdfLoadError(`Failed to load PDF: ${error.message || "Unknown error"}`);
    }
  };
  const onDocumentLoadProgress = () => {};

  /* ------------------------------ Utilities ------------------------------- */
  const getEventCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const validateAndFixPDFUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:")) {
      return `https://${url}`;
    }
    return url;
  };

  // drawing state
  const lastPointRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lineWidthRef = useRef(MAX_WIDTH);

  const startDrawing = (e) => {
    if (!activeElement || !canvasRef.current || !canvasContext) return;
    e.preventDefault();
    const p = getEventCoordinates(e);
    lastPointRef.current = p;
    lastTimeRef.current = performance.now();
    lineWidthRef.current = MAX_WIDTH;
    canvasContext.beginPath();
    canvasContext.moveTo(p.x, p.y);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing || !canvasContext) return;
    e.preventDefault();
    const p = getEventCoordinates(e);
    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    const lp = lastPointRef.current;
    const dx = p.x - lp.x;
    const dy = p.y - lp.y;
    const dist = Math.hypot(dx, dy);
    const velocity = dist / dt;
    const targetWidth = Math.max(MAX_WIDTH / (velocity * VELOCITY_FILTER + 1), MIN_WIDTH);
    const newWidth = lineWidthRef.current * SMOOTHING + targetWidth * (1 - SMOOTHING);

    canvasContext.strokeStyle = SIGNATURE_BLUE;
    canvasContext.lineCap = "round";
    canvasContext.lineJoin = "round";
    canvasContext.lineWidth = newWidth;

    canvasContext.beginPath();
    canvasContext.moveTo(lp.x, lp.y);
    canvasContext.lineTo(p.x, p.y);
    canvasContext.stroke();

    lineWidthRef.current = newWidth;
    lastPointRef.current = p;
    lastTimeRef.current = now;
  };
  const stopDrawing = () => {
    if (!isDrawing) return;
    canvasContext?.closePath();
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  /* ------------------------------ UI actions ------------------------------ */
  const handleElementClick = (element) => {
    if ((element?.recipientEmail || "").toLowerCase() !== (currentUser?.email || "").toLowerCase()) {
      toast.error(
        `Your current email is ${currentUser?.email || "unknown"}; this field is for ${element.recipientEmail}`,
        { containerId: "signaturesign" }
      );
      return;
    }
    setActiveElement(element);
    setSignatureType(null);
    switch (element.type) {
      case "checkbox":
        setInputValue(!!element.value);
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

  const convertTextToSignature = (text) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 200;
    canvas.height = 80;
    ctx.font = "italic 42px 'Great Vibes', cursive";
    ctx.fillStyle = SIGNATURE_BLUE;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL();
  };

  // auto-size signature box AFTER we have trimmed the image
  const autosizeSignatureBox = (elementId, dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const iw = img.width;
      const ih = img.height;

      // Fit inside max WH, and ensure min WH
      const scale = Math.min(SIG_W_MAX / iw, SIG_H_MAX / ih, 1);
      let w = Math.round(Math.max(iw * scale, SIG_W));
      let h = Math.round(Math.max(ih * scale, SIG_H));

      setSignatureElements((prev) =>
        prev.map((el) =>
          el.id === elementId ? { ...el, value: dataUrl, width: w, height: h } : el
        )
      );
      setActiveElement(null);
      setInputValue("");
    };
    img.src = dataUrl;
  };

  const handleSave = () => {
    if (!activeElement) return;
    let value;
    switch (activeElement.type) {
      case "signature": {
        const dataUrl =
          signatureType === "draw"
            ? canvasRef.current?.toDataURL()
            : signatureType === "image"
            ? inputValue || currentProfile?.signature
            : inputValue
            ? convertTextToSignature(inputValue)
            : null;

        if (dataUrl) {
          // trim to remove margins so alignment is exact
          trimImageDataURL(dataUrl).then((trimmed) => autosizeSignatureBox(activeElement.id, trimmed));
          return; // autosize will finalize the save
        }
        break;
      }
      case "checkbox":
        value = !!inputValue;
        break;
      case "image":
        value = inputValue;
        break;
      case "initials":
        value = (inputValue || "").toUpperCase();
        break;
      case "radio":
        value = inputValue;
        break;
      case "date":
        value = selectedDate.toLocaleDateString();
        break;
      default:
        value = inputValue;
    }

    // For text-like fields, only grow width if content exceeds default
    if (
      ["name", "email", "phone", "text", "jobTitle", "company"].includes(activeElement.type) &&
      value
    ) {
      const newW = autosizeTextBoxWidth(activeElement.width || TXT_W, value);
      setSignatureElements((prev) =>
        prev.map((el) => (el.id === activeElement.id ? { ...el, value, width: newW, height: TXT_H } : el))
      );
    } else {
      setSignatureElements((prev) =>
        prev.map((el) => (el.id === activeElement.id ? { ...el, value } : el))
      );
    }

    setActiveElement(null);
    setInputValue("");
  };

  const handleImageUpload = (e) => {
    if (!activeElement || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      // Trim margins before sizing so placement stays true to what user sees
      trimImageDataURL(event.target.result).then((trimmed) =>
        autosizeSignatureBox(activeElement.id, trimmed)
      );
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleClearCanvas = () => {
    if (!canvasRef.current || !canvasContext) return;
    canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleSaveDocument = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      // Ensure current date is set for this signer if empty
      const today = new Date().toLocaleDateString();
      const ensured = signatureElements.map((el) => {
        if (
          el.type === "date" &&
          (el.recipientEmail || "").toLowerCase() === (currentUser.email || "").toLowerCase() &&
          (!el.value || String(el.value).trim() === "")
        ) {
          return { ...el, value: today, width: el.width || DATE_W, height: el.height || DATE_H };
        }
        // Make sure any box has at least its defaults (prevents jumpy sizes)
        if (el.type === "signature") {
          return { ...el, width: el.width || SIG_W, height: el.height || SIG_H };
        }
        if (el.type === "date") {
          return { ...el, width: el.width || DATE_W, height: el.height || DATE_H };
        }
        return { ...el, width: el.width || TXT_W, height: el.height || TXT_H };
      });

      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        { documentId, elements: ensured },
        { headers: { authorization: `Bearer ${token}` }, responseType: "blob" }
      );

      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const file = new File([blob], `signedDocument-${documentId}`, { type: "application/pdf" });

      const dataForm = new FormData();
      dataForm.append("document", file);
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
    } catch (error) {
      setLoading(false);
      toast.error(error?.response?.data?.error || "Something went wrong", {
        containerId: "signaturesign",
      });
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
    } catch (error) {
      toast.error(error?.response?.data?.error || "Something went wrong", {
        containerId: "signaturesign",
      });
    }
  };

  /* ----------------------------- Field preview ---------------------------- */
  const renderFieldPreview = (element) => {
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
      phone: "border-gray-500 bg-gray-50",
    };

    // dimensions (signature can be auto-sized if width/height set)
    const width =
      element.type === "signature"
        ? element.width || SIG_W
        : element.width || (element.type === "date" ? DATE_W : TXT_W);
    const height =
      element.type === "signature"
        ? element.height || SIG_H
        : element.height || (element.type === "date" ? DATE_H : TXT_H);

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
      >
        <div className="flex-1">
          {element.value ? (
            element.type === "signature" || element.type === "image" || element.type === "stamp" ? (
              <img
                src={element.value}
                alt={element.type}
                className="w-full h-full object-contain block"
                style={{ imageRendering: "auto" }}
              />
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
              {element.type === "signature" ? (
                <>
                  <span className="block text-center font-semibold">Sign</span>
                  <span className="block text-center" aria-hidden="true">
                    🖊️
                  </span>
                </>
              ) : (
                CONTACT_LABEL[element.type] || element.label || element.type
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  /* --------------------------- PDF rendering UI --------------------------- */
  const renderPDFDocument = () => {
    const validatedUrl = validateAndFixPDFUrl(file);

    if (pdfLoadError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-red-600 text-center p-4">
            <h3 className="font-semibold mb-2">PDF Loading Error</h3>
            <p className="text-sm mb-4">{pdfLoadError}</p>
            <button
              onClick={() => {
                setPdfLoadError(null);
                setPdfLoading(true);
                setFile((prev) => prev);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry Loading
            </button>
          </div>
        </div>
      );
    }

    if (pdfLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading PDF...</p>
          </div>
        </div>
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
        {numPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-4 bg-white p-2 rounded shadow sticky top-0 z-40">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-sm font-medium">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}

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

  /* --------------------------------- JSX --------------------------------- */
  return (
    <div>
      <ToastContainer containerId={"signaturesign"} />
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 p-4 overflow-auto relative" ref={containerRef}>
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
              (el) =>
                !el.value &&
                (el.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase()
            )}
          >
            Complete Signing
          </button>

          {loadingError ? (
            <div className="text-red-500 text-center mt-8">{loadingError}</div>
          ) : file ? (
            file.includes(".pdf") ? (
              <div className="relative">
                {renderPDFDocument()}
                {signatureElements
                  .filter((element) => element.pageNumber === pageNumber || !element.pageNumber)
                  .map(renderFieldPreview)}
              </div>
            ) : (
              <div className="relative">
                <img
                  src={file}
                  alt="Document"
                  className="max-w-full h-auto"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <div style={{ display: "none" }} className="text-red-500 text-center mt-8">
                  Failed to load document image
                </div>
                {signatureElements.map(renderFieldPreview)}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Loading document...</p>
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
                          width={SIG_W}
                          height={SIG_H}
                          className="border mb-2"
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
                              style={{ width: 200, height: 80 }}
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

                {["text", "name", "email", "jobTitle", "company", "phone"].includes(activeElement.type) && (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    placeholder={`Enter ${CONTACT_LABEL[activeElement.type] || activeElement.type}`}
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
};

export default SignDocumentPage;
