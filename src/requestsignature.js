import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer, toast } from "react-toastify";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const FIELD_TYPES = {
  SIGNATURE: "signature",
  INITIALS: "initials",
  NAME: "name",
  JOB_TITLE: "jobTitle",
  COMPANY: "company",
  DATE: "date",
  TEXT: "text",
  CHECKBOX: "checkbox",
  IMAGE: "image",
  EMAIL: "email",
  PHONE: "phone",
};

/* ---------- Default + minimum sizes per field (px) ---------- */
const DIMENSIONS = {
  [FIELD_TYPES.SIGNATURE]: { width: 160, height: 60, minW: 80, minH: 30 },
  [FIELD_TYPES.INITIALS]:  { width: 140, height: 48, minW: 80, minH: 32 },
  [FIELD_TYPES.NAME]:      { width: 200, height: 40, minW: 120, minH: 36 },
  [FIELD_TYPES.EMAIL]:     { width: 220, height: 40, minW: 140, minH: 36 },
  [FIELD_TYPES.PHONE]:     { width: 180, height: 40, minW: 120, minH: 36 },
  [FIELD_TYPES.JOB_TITLE]: { width: 200, height: 40, minW: 120, minH: 36 },
  [FIELD_TYPES.COMPANY]:   { width: 200, height: 40, minW: 120, minH: 36 },
  [FIELD_TYPES.TEXT]:      { width: 200, height: 40, minW: 120, minH: 36 },
  [FIELD_TYPES.DATE]:      { width: 120, height: 45, minW: 90,  minH: 32 },
  [FIELD_TYPES.IMAGE]:     { width: 220, height: 80, minW: 120, minH: 60 },
  [FIELD_TYPES.CHECKBOX]:  { width: 24,  height: 24, minW: 18,  minH: 18 },
};

const getDims = (type) => DIMENSIONS[type] || DIMENSIONS[FIELD_TYPES.TEXT];
const isResizable = (type) => type !== FIELD_TYPES.CHECKBOX; // everything except checkbox

const RequestSignaturesPage = () => {
  // Step + file + PDF
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);

  // Recipients + elements
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    folder: "default",
    recipients: [],
  });
  const [selectedEmail, setSelectedEmail] = useState("");
  const [contactBook, setContactBook] = useState([]);
  const [signatureElements, setSignatureElements] = useState([]);

  // Drag & resize
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null); // { id, type, startX, startY, startW, startH }

  // Toolbox touch drag
  const [touchDraggedElement, setTouchDraggedElement] = useState(null);

  // Send flow
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSocial, setIsSocial] = useState(false);
  const [shareId, setShareId] = useState("");

  // Refs
  const containerRef = useRef(null); // important: same relative container for Page + overlays
  const fileInputRef = useRef(null);

  /* ---------------------------------------------------------------------- */
  /*                                Helpers                                 */
  /* ---------------------------------------------------------------------- */

  // Normalize element coordinates to backend's 800px canvas.
  // Uses PDF canvas width + container scroll offsets (prevents right-column shift).
  const normalizeForPdf = (elements) => {
    const container = containerRef.current;
    if (!container || !elements?.length) return elements || [];

    return elements.map((el) => {
      const selector = `.react-pdf__Page[data-page-number="${el.pageNumber}"]`;
      const pageEl =
        container.querySelector(selector) ||
        document.querySelector(selector) ||
        container.querySelector(".react-pdf__Page") ||
        document.querySelector(".react-pdf__Page");

      let pageWidth = 800;
      let offsetX = 0;
      let offsetY = 0;

      if (pageEl) {
        const canvas = pageEl.querySelector("canvas");
        pageWidth =
          (canvas && canvas.clientWidth) || pageEl.clientWidth || pageWidth;

        const pageRect = pageEl.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        offsetX = pageRect.left - contRect.left + container.scrollLeft;
        offsetY = pageRect.top - contRect.top + container.scrollTop;
      } else if (typeof window !== "undefined") {
        pageWidth = Math.min(window.innerWidth - 32, 800);
      }

      const localX = (Number(el.x) || 0) - offsetX;
      const localY = (Number(el.y) || 0) - offsetY;
      const s = 800 / (pageWidth || 800);

      return {
        ...el,
        x: Math.round(localX * s),
        y: Math.round(localY * s),
        ...(el.width  != null ? { width:  Math.round(Number(el.width)  * s) } : {}),
        ...(el.height != null ? { height: Math.round(Number(el.height) * s) } : {}),
      };
    });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && /\.pdf$/i.test(selected.name)) {
      setFile(selected);
      setPageNumber(1);
    } else {
      toast.error("Please select a PDF file.", { containerId: "requestSignature" });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("Please enter document title", { containerId: "requestSignature" });
      return;
    }
    if (!file) {
      toast.error("Please select a document", { containerId: "requestSignature" });
      return;
    }
    if (!formData.recipients?.length) {
      toast.error("Please select recipients", { containerId: "requestSignature" });
      return;
    }
    if (formData.recipients.filter((u) => u.willSign === true).length === 0) {
      toast.error("Please select at least one signer", { containerId: "requestSignature" });
      return;
    }
    setStep(2);
  };

  const fetchContactBooks = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { headers: { authorization: `Bearer ${token}` } };
      const res = await axios.get(`${BASE_URL}/fetchContactBooks`, headers);
      setContactBook(res.data?.contactBooks || []);
    } catch {
      toast.error("Something went wrong, please try again", { containerId: "requestSignature" });
    }
  };
  useEffect(() => {
    fetchContactBooks();
  }, []);

  /* ----------------------------- Toolbox (touch) ----------------------------- */
  const handleToolTouchStart = (type, email, options = {}) => (e) => {
    e.preventDefault();
    setTouchDraggedElement({ type, email, options });
  };
  const handleToolTouchMove = (e) => {
    if (!touchDraggedElement) return;
    e.preventDefault();
  };
  const handleToolTouchEnd = (e) => {
    if (!touchDraggedElement) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const { type, email, options } = touchDraggedElement;
      createPlaceholder(type, email, x, y, options);
    }
    setTouchDraggedElement(null);
  };

  /* ----------------------- Placed elements: drag & resize -------------------- */

  // === Dragging (body) ===
  const handleElementTouchStart = (e, id) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const el = signatureElements.find((s) => s.id === id);
    if (!el) return;
    setPositionOffset({ x: x - el.x, y: y - el.y });
    setDraggedElement(id);
  };

  const doResize = (clientX, clientY) => {
    if (!resizing) return;
    const { id, type, startX, startY, startW, startH } = resizing;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const { minW, minH } = getDims(type);

    setSignatureElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        let newW = Math.max((startW || getDims(type).width) + dx, minW);
        let newH = Math.max((startH || getDims(type).height) + dy, minH);
        return { ...el, width: newW, height: newH };
      })
    );
  };

  const handleElementTouchMove = (e) => {
    if (resizing) {
      const t = e.touches[0];
      doResize(t.clientX, t.clientY);
      return;
    }
    if (!draggedElement) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left - positionOffset.x;
    const y = touch.clientY - rect.top - positionOffset.y;
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el))
    );
  };

  const handleElementTouchEnd = () => {
    setDraggedElement(null);
    setResizing(null);
  };

  const handleMouseDown = (e, id) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const el = signatureElements.find((s) => s.id === id);
    if (!el) return;
    setPositionOffset({ x: x - el.x, y: y - el.y });
    setDraggedElement(id);
  };

  const handleMouseMove = (e) => {
    // Resize takes precedence if active
    if (resizing) {
      doResize(e.clientX, e.clientY);
      return;
    }
    if (!draggedElement) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - positionOffset.x;
    const y = e.clientY - rect.top - positionOffset.y;
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el))
    );
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizing(null);
  };

  // === Resizing (handle) ===
  const handleResizeMouseDown = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const el = signatureElements.find((s) => s.id === id);
    if (!el) return;
    setResizing({
      id,
      type: el.type,
      startX: e.clientX,
      startY: e.clientY,
      startW: el.width || getDims(el.type).width,
      startH: el.height || getDims(el.type).height,
    });
  };

  const handleResizeTouchStart = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const el = signatureElements.find((s) => s.id === id);
    if (!el) return;
    const t = e.touches[0];
    setResizing({
      id,
      type: el.type,
      startX: t.clientX,
      startY: t.clientY,
      startW: el.width || getDims(el.type).width,
      startH: el.height || getDims(el.type).height,
    });
  };

  /* -------------------------------- Recipients ------------------------------- */
  const handleChangeSign = (recipient, value) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) =>
        r.email === recipient.email ? { ...r, willSign: value } : r
      ),
    }));
  };

  // Add from contact book (carry name/phone if known)
  // const addRecipient = () => {
  //   if (!selectedEmail) return;
  //   const exists = formData.recipients.some((r) => r.email === selectedEmail);
  //   if (exists) {
  //     toast.error("This email has already been added to recipients.", {
  //       containerId: "requestSignature",
  //     });
  //     return;
  //   }

  //   const contact =
  //     contactBook.find((c) => (c?.email || "").toLowerCase() === selectedEmail.toLowerCase()) ||
  //     {};

  //   setFormData((prev) => ({
  //     ...prev,
  //     recipients: [
  //       ...prev.recipients,
  //       {
  //         email: selectedEmail,
  //         name: contact.name || "",
  //         phone: contact.phone || "",
  //         address: contact.address || "",
  //         willSign: true,
  //       },
  //     ],
  //   }));
  //   setSelectedEmail("");
  // };

  const addRecipient = () => {
  if (!selectedEmail) return;

  const exists = formData.recipients.some((r) => r.email === selectedEmail);
  if (exists) {
    toast.error("This email has already been added to recipients.", {
      containerId: "requestSignature",
    });
    return;
  }

  const contact = contactBook.find((c) => c?.email === selectedEmail) || {};
  const resolvedName =
    (contact.name && String(contact.name).trim()) ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() ||
    contact.fullName ||
    contact.displayName ||
    "";

  const resolvedPhone = contact.phone || contact.phoneNumber || contact.mobile || "";

  setFormData((prev) => ({
    ...prev,
    recipients: [
      ...prev.recipients,
      { email: selectedEmail, name: resolvedName, phone: resolvedPhone, willSign: true },
    ],
  }));
  setSelectedEmail("");
};


  const addManualRecipient = () => {
    const {
      newRecipientEmail,
      newRecipientName,
      newRecipientPhone,
      newRecipientAddress,
    } = formData;

    if (!newRecipientName) {
      toast.error("Please enter signer name", { containerId: "requestSignature" });
      return;
    }
    if (!newRecipientEmail) {
      toast.error("Please enter signer email", { containerId: "requestSignature" });
      return;
    }
    if (!newRecipientPhone) {
      toast.error("Please enter signer phone number", { containerId: "requestSignature" });
      return;
    }

    const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
    if (!phoneRegex.test(newRecipientPhone)) {
      toast.error("Please enter a valid phone number", { containerId: "requestSignature" });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        {
          email: newRecipientEmail,
          name: newRecipientName,
          phone: newRecipientPhone || "",
          address: newRecipientAddress || "",
          willSign: true,
        },
      ],
      newRecipientEmail: "",
      newRecipientName: "",
      newRecipientPhone: "",
      newRecipientAddress: "",
    }));
  };

  const removeRecipient = (index) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  /* -------------------------------- Elements -------------------------------- */

  // NOTE: We do NOT prefill values in the builder (prevents duplicates when signing).
  const createPlaceholder = (type, email, x = 50, y = 50, options = {}) => {
    const d = getDims(type);
    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      width: d.width,
      height: d.height,
      pageNumber, // current page number
      recipientEmail: email,
      placeholderText: getPlaceholderText(type),
      isPlaceholder: true,
      ...options,
      value: "",
    };
    setSignatureElements((prev) => [...prev, newElement]);
  };

  const getPlaceholderText = (type) => {
    const texts = {
      [FIELD_TYPES.SIGNATURE]: "Sign",
      [FIELD_TYPES.INITIALS]: "Initials",
      [FIELD_TYPES.NAME]: "Name",
      [FIELD_TYPES.JOB_TITLE]: "Job Title",
      [FIELD_TYPES.COMPANY]: "Company",
      [FIELD_TYPES.DATE]: "Date",
      [FIELD_TYPES.TEXT]: "Text Field",
      [FIELD_TYPES.CHECKBOX]: "Checkbox",
      [FIELD_TYPES.IMAGE]: "Image",
      [FIELD_TYPES.EMAIL]: "Email",
      [FIELD_TYPES.PHONE]: "Phone",
    };
    return texts[type];
  };

  const deleteElement = (id) => {
    setSignatureElements((prev) => prev.filter((el) => el.id !== id));
  };

  /* ---------------------------- Toolbox drag/drop ---------------------------- */
  const handleToolDragStart =
    (type, email, options = {}) =>
    (e) => {
      e.dataTransfer.setData("type", type);
      e.dataTransfer.setData("email", email);
      e.dataTransfer.setData("options", JSON.stringify(options));
    };

  const handleDocumentDrop = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const type = e.dataTransfer.getData("type");
    const email = e.dataTransfer.getData("email");
    const options = JSON.parse(e.dataTransfer.getData("options") || "{}");

    if (type && email) {
      createPlaceholder(type, email, x, y, options);
    }
  };

  /* --------------------------------- Send ---------------------------------- */
  const handleSendRequest = () => {
    const required = formData.recipients.filter((u) => u.willSign === true);
    const ok = required.every((r) =>
      signatureElements.some((el) => el.recipientEmail === r.email)
    );
    if (!ok) {
      toast.error("At least one element should be created for each signer", {
        containerId: "requestSignature",
      });
      return;
    }
    setShowSendPopup(true);
  };

  const sendThroughEmail = async () => {
    try {
      setLoading(true);
      setIsSocial(false);

      const token = localStorage.getItem("token");
      const headers = { headers: { authorization: `Bearer ${token}` } };

      const form = new FormData();
      form.append("document", file);
      form.append("title", formData.title);

      const elementsToSave = normalizeForPdf(signatureElements);
      form.append("elements", JSON.stringify(elementsToSave));

      if (!shareId) {
        const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
        await axios.post(
          `${BASE_URL}/sendSignRequest`,
          { ...formData, documentId: saveResponse.data.doc._id, elements: elementsToSave },
          headers
        );
      } else {
        await axios.post(
          `${BASE_URL}/sendSignRequest`,
          { ...formData, documentId: shareId, elements: elementsToSave },
          headers
        );
      }

      toast.success("Signature request sent", { containerId: "requestSignature" });
      setFile(null);
      setFormData({ title: "", note: "", folder: "default", recipients: [] });
      setSignatureElements([]);
      setLoading(false);
      window.location.reload(true);
    } catch (e) {
      const msg = e?.response?.data?.error || "Something went wrong please try again";
      toast.error(msg, { containerId: "requestSignature" });
      setLoading(false);
      setIsSocial(false);
    }
  };

  const sendThroughShare = async (email) => {
    try {
      setLoading(true);
      setIsSocial(true);

      let documentId = shareId;

      if (!shareId) {
        const token = localStorage.getItem("token");
        const headers = { headers: { authorization: `Bearer ${token}` } };

        const form = new FormData();
        form.append("document", file);
        form.append("title", formData.title);

        const elementsToSave = normalizeForPdf(signatureElements);
        form.append("elements", JSON.stringify(elementsToSave));

        let signers = signatureElements
          .map((val) => ({ email: val.recipientEmail }))
          .filter((v, i, self) => i === self.findIndex((t) => t.email === v.email));
        form.append("signers", JSON.stringify(signers));

        const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
        documentId = saveResponse.data.doc._id;
        setShareId(documentId);
      }

      const link = `${window.location.origin}/admin/request-signatures/sign-document/${documentId}?email=${email}`;

      if (navigator.share) {
        await navigator.share({ title: "Sign Document", text: "Please sign the document", url: link });
        toast.success("Signature request sent", { containerId: "requestSignature" });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard", { containerId: "requestSignature" });
      }
    } catch (error) {
      const msg =
        error?.name === "AbortError"
          ? null
          : error?.response?.data?.error || "Something went wrong, please try again";
      if (msg) toast.error(msg, { containerId: "requestSignature" });
    } finally {
      setLoading(false);
      setIsSocial(false);
    }
  };

  const sendThroughWPShare = async (email, val) => {
    try {
      setLoading(true);
      setIsSocial(true);

      let documentId = shareId;

      if (!shareId) {
        const token = localStorage.getItem("token");
        const headers = { headers: { authorization: `Bearer ${token}` } };

        const form = new FormData();
        form.append("document", file);
        form.append("title", formData.title);

        const elementsToSave = normalizeForPdf(signatureElements);
        form.append("elements", JSON.stringify(elementsToSave));

        let signers = signatureElements
          .map((v) => ({ email: v.recipientEmail }))
          .filter((v, i, self) => i === self.findIndex((t) => t.email === v.email));
        form.append("signers", JSON.stringify(signers));

        const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
        documentId = saveResponse.data.doc._id;
        setShareId(documentId);
      }

      const link = `${window.location.origin}/admin/request-signatures/sign-document/${documentId}?email=${email}`;
      await axios.post(`${BASE_URL}/sendSignatureLinkToWhatsApp`, { phone: val.phone, link });

      toast.success("Signature request sent", { containerId: "requestSignature" });
    } catch (error) {
      toast.error(error?.response?.data?.error || "Something went wrong, please try again", {
        containerId: "requestSignature",
      });
    } finally {
      setLoading(false);
      setIsSocial(false);
    }
  };

  /* ---------------------------- Render helpers ----------------------------- */
  const renderFieldPreview = (element) => {
    const baseClasses = "border-2 border-dashed p-2 cursor-move";
    const typeClasses = {
      [FIELD_TYPES.SIGNATURE]: "border-blue-500 bg-blue-50",
      [FIELD_TYPES.INITIALS]: "border-green-500 bg-green-50",
      [FIELD_TYPES.DATE]: "border-purple-500 bg-purple-50",
      [FIELD_TYPES.IMAGE]: "border-indigo-500 bg-indigo-50",
      [FIELD_TYPES.CHECKBOX]: "border-orange-500 bg-orange-50",
    };

    const { width: defW, height: defH } = getDims(element.type);
    const width = element.width ?? defW;
    const height = element.height ?? defH;

    const content = () => {
      if (element.value) {
        if (element.type === FIELD_TYPES.IMAGE) {
          return (
            <img
              src={element.value}
              alt="Uploaded"
              className="w-full h-full object-contain"
            />
          );
        }
        return <div className="text-sm mt-1">{element.value}</div>;
      }

      if (element.type === FIELD_TYPES.CHECKBOX) {
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" disabled className="w-4 h-4" />
            <span className="text-xs text-gray-500">{element.placeholderText}</span>
          </div>
        );
      }

      if (element.type === FIELD_TYPES.INITIALS) {
        return (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl font-bold text-gray-500">✍️</span>
            <div className="text-xs text-gray-500 ml-2">{element.placeholderText}</div>
          </div>
        );
      }

      if (element.type === FIELD_TYPES.SIGNATURE) {
        return (
          <div className="text-center leading-tight">
            <div className="font-semibold">Sign</div>
            <div aria-hidden="true">🖊️</div>
          </div>
        );
      }

      return <div className="text-xs text-gray-500">{element.placeholderText}</div>;
    };

    return (
      <div
        className={`${baseClasses} ${typeClasses[element.type] || "border-gray-500 bg-gray-50"}`}
        style={{ width, minHeight: height, height }}
      >
        {content()}

        {/* Resize handle */}
        {isResizable(element.type) && (
          <div
            className="absolute right-0 bottom-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-se-resize"
            style={{ transform: "translate(50%, 50%)" }}
            onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
            onTouchStart={(e) => handleResizeTouchStart(e, element.id)}
          />
        )}
      </div>
    );
  };

  const renderToolItem = (type, email) => {
    const labels = {
      [FIELD_TYPES.SIGNATURE]: "Signature",
      [FIELD_TYPES.INITIALS]: "Initials",
      [FIELD_TYPES.NAME]: "Name",
      [FIELD_TYPES.JOB_TITLE]: "Job Title",
      [FIELD_TYPES.COMPANY]: "Company",
      [FIELD_TYPES.DATE]: "Date",
      [FIELD_TYPES.TEXT]: "Text",
      [FIELD_TYPES.CHECKBOX]: "Checkbox",
      [FIELD_TYPES.IMAGE]: "Image",
      [FIELD_TYPES.EMAIL]: "Email",
      [FIELD_TYPES.PHONE]: "Phone",
    };

    return (
      <div
        key={`${type}-${email}`}
        className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move"
        draggable
        onDragStart={handleToolDragStart(type, email)}
        onTouchStart={handleToolTouchStart(type, email)}
        onTouchMove={handleToolTouchMove}
        onTouchEnd={handleToolTouchEnd}
      >
        {labels[type]}
      </div>
    );
  };

  /* --------------------------------- Render -------------------------------- */
  return (
    <>
      <ToastContainer containerId={"requestSignature"} />

      <div className="admin-content">
        {step === 1 ? (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Request Signatures</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Document Title*</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Upload Document*</label>
                <div
                  className="border-2 border-dashed p-8 text-center cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  {file ? file.name : "Click to choose file or drag and drop"}
                  <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf" />
                </div>
                <p className="text-sm text-gray-500 mt-1">PDF only</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Note</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Note for recipients"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Folder</label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.folder}
                  onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                >
                  <option value="default">Default</option>
                  <option value="contracts">Contracts</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Add Recipients</h3>

                <div className="flex gap-2 mb-2">
                  <select
                    className="flex-1 p-2 border rounded"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                  >
                    <option value="">Select recipient email</option>
                    {contactBook?.map((c) => (
                      <option key={c?.email} value={c?.email}>
                        {c?.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="bg-[#29354a] text-white px-4 py-2 rounded"
                    disabled={!selectedEmail}
                  >
                    Add
                  </button>
                </div>

                <div className="border p-4 rounded-md bg-gray-50">
                  <h4 className="text-sm font-medium mb-2">Or Enter Manually</h4>
                  <input
                    type="text"
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Full Name"
                    value={formData.newRecipientName || ""}
                    onChange={(e) => setFormData({ ...formData, newRecipientName: e.target.value })}
                  />
                  <input
                    type="email"
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Email Address"
                    value={formData.newRecipientEmail || ""}
                    onChange={(e) => setFormData({ ...formData, newRecipientEmail: e.target.value })}
                  />
                  <input
                    type="tel"
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Phone Number"
                    value={formData.newRecipientPhone || ""}
                    onChange={(e) => setFormData({ ...formData, newRecipientPhone: e.target.value })}
                  />
                  <input
                    type="text"
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Address"
                    value={formData.newRecipientAddress || ""}
                    onChange={(e) => setFormData({ ...formData, newRecipientAddress: e.target.value })}
                  />

                  <button
                    type="button"
                    onClick={addManualRecipient}
                    className="w-fit mx-auto bg-[#29354a] text-white px-4 py-2 rounded-[20px] flex"
                    disabled={!formData.newRecipientEmail || !formData.newRecipientName}
                  >
                    Add Recipient
                  </button>
                </div>

                {formData.recipients.length > 0 && (
                  <div className="border rounded p-2 mt-4">
                    {formData.recipients.map((recipient, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 last:mb-0 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words">
                            {recipient.name} ({recipient.email})
                          </p>
                          {recipient.phone && (
                            <p className="text-xs text-gray-500 break-words">📞 {recipient.phone}</p>
                          )}
                          {recipient.address && (
                            <p className="text-xs text-gray-500 break-words">📍 {recipient.address}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                          <select
                            onChange={(e) =>
                              handleChangeSign(recipient, e.target.value === "true")
                            }
                            value={recipient.willSign ? true : false}
                            id="documentAction"
                            name="documentAction"
                            className="border rounded p-1 w-full sm:w-auto"
                          >
                            <option value="true">Needs to Sign</option>
                            <option value="false">Will Receive a Copy</option>
                          </select>

                          <button onClick={() => removeRecipient(index)} className="text-red-500 text-lg">
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="mx-auto flex bg-[#002864] text-white py-2 px-4 rounded-[20px] w-fit"
                disabled={formData.recipients.length === 0}
              >
                Prepare Document
              </button>
            </form>
          </div>
        ) : (
          // Step 2: place + resize + send
          <div className="flex min-h-screen lg:flex-row flex-col bg-gray-100">
            <div
              className="flex-1 p-2 lg:p-4 overflow-auto relative w-full"
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDrop={handleDocumentDrop}
              onDragOver={(e) => e.preventDefault()}
              onTouchMove={handleElementTouchMove}
              onTouchEnd={handleElementTouchEnd}
              style={{ touchAction: "none" }}
            >
              <button
                onClick={handleSendRequest}
                className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg"
                disabled={signatureElements.length === 0}
              >
                Send Request
              </button>

              {file?.type === "application/pdf" ? (
                <div className="w-full">
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

                  <Document
                    file={file}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    onLoadError={() =>
                      toast.error("Failed to load PDF", { containerId: "requestSignature" })
                    }
                    loading="Loading PDF..."
                    className="w-full"
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={
                        typeof window !== "undefined"
                          ? Math.min(window.innerWidth - 32, 800)
                          : 800
                      }
                      className="w-full h-auto"
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                  </Document>
                </div>
              ) : (
                ""
              )}

              {signatureElements
                .filter((el) => el.pageNumber === pageNumber)
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      zIndex:
                        draggedElement === element.id || resizing?.id === element.id
                          ? 1000
                          : 1,
                    }}
                  >
                    <div
                      className="relative"
                      onMouseDown={(e) => handleMouseDown(e, element.id)}
                      onTouchStart={(e) => handleElementTouchStart(e, element.id)}
                      onTouchMove={handleElementTouchMove}
                      onTouchEnd={handleElementTouchEnd}
                    >
                      {renderFieldPreview(element)}
                      <button
                        onClick={() => deleteElement(element.id)}
                        className="absolute -right-3 -top-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* <div className="lg:w-[320px] w-full bg-white p-4 shadow-lg overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Field Types</h3>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Recipients</h4>
                {formData.recipients
                  .filter((u) => u.willSign === true)
                  .map((recipient) => (
                    <div key={recipient.email} className="mb-4 border-b pb-4 last:border-b-0">
                      <div className="font-medium mb-2">{recipient.email}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(FIELD_TYPES).map((type) =>
                          renderToolItem(type, recipient.email)
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div> */}

            <aside
              className="
                lg:w-[340px] w-full flex-shrink-0 bg-white p-4 shadow-lg border-l
                lg:sticky lg:top-0 lg:h-screen              /* desktop: pinned + full height */
                h-[55vh]                                     /* mobile/tablet: shorter but scrollable */
                overflow-y-auto
              "
              >
              {/* Optional pinned header inside the sidebar */}
              <div className="sticky top-0 bg-white pb-3 z-10">
                <h3 className="text-xl font-bold">Field Types</h3>
              </div>

              {/* Scrollable content */}
              <div className="pt-2">
                <h4 className="font-medium mb-2">Recipients</h4>

                {formData.recipients
                  .filter((u) => u.willSign === true)
                  .map((recipient) => (
                    <div key={recipient.email} className="mb-4 border-b pb-4 last:border-b-0">
                      <div className="font-medium mb-2 break-all">{recipient.email}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(FIELD_TYPES).map((type) =>
                          renderToolItem(type, recipient.email)
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </aside>

          </div>
        )}
      </div>

      {/* Send popup */}
      {showSendPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 text-left">
            <div className="flex justify-between">
              <h3 className="text-xl font-bold mb-4">Send Mail</h3>
              <div className="text-[18px] cursor-pointer" onClick={() => setShowSendPopup(false)}>
                X
              </div>
            </div>
            <p className="mb-6">Are you sure you want to send out this document for signatures?</p>

            <div className="flex items-center mb-6">
              <button className="bg-[#002864] text-white px-4 w-full py-2 rounded" onClick={sendThroughEmail}>
                Send
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>

            {formData.recipients
              .filter((u) => u.willSign === true)
              .map((val, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div><p className="text-gray-600">{val.email}</p></div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => sendThroughShare(val.email)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Share"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => sendThroughWPShare(val.email, val)}
                      className="text-green-600 hover:text-green-800"
                      title="Share via WhatsApp"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Loading overlays */}
      {loading && !isSocial ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Sending Document Invitations
                <span className="block text-sm font-normal text-gray-500 mt-1">
                  Server is sending signing invitations to recipients – please wait
                </span>
              </h3>
            </div>
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
              <h4 className="font-medium text-blue-800 mb-3">Invitation Process Status</h4>
              <div className="text-blue-700 space-y-2">
                <p>• Secure invitation links being generated</p>
                <p>• Email notifications queued for delivery</p>
                <p>• Document access permissions being configured</p>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-sm text-center">
                Note: Invitations contain secure links. Recipients will receive emails with signing instructions.
              </p>
            </div>
          </div>
        </div>
      ) : loading && isSocial ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="flex flex-col items-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-2xl font-semibold text-gray-900 text-center">
                Generating Recipient Invitations
                <span className="block text-sm font-normal text-gray-500 mt-2">
                  Please wait while we generate your recipient invitation links
                </span>
              </h3>
            </div>
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
              <div className="text-blue-700 space-y-2">
                <p>• Securely generating unique signing links for each recipient</p>
                <p>• Preparing invitation emails with document access</p>
                <p>• Encrypting sensitive document information</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm text-center">
                This process typically takes 10–15 seconds. Please do not close this window.
              </p>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default RequestSignaturesPage;
