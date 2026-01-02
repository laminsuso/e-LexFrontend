// // src/requestsignature.js
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { v4 as uuidv4 } from "uuid";
// import axios from "axios";
// import { BASE_URL } from "./baseUrl";
// import { ToastContainer, toast } from "react-toastify";

// /* -------------------- PDF worker -------------------- */
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// /* -------------------- Preview card (fixed height) -------------------- */
// const PdfPreviewCard = ({ file, onReplace, onRemove }) => {
//   const [numPages, setNumPages] = useState(null);

//   return (
//     <div className="w-[320px] bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
//       <div className="h-[260px] flex items-center justify-center bg-gray-50 overflow-hidden">
//         <Document
//           file={file}
//           onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//           onLoadError={() => {}}
//           loading={<div className="text-sm text-gray-500">Generating preview…</div>}
//         >
//           <Page
//             pageNumber={1}
//             height={240} // ✅ keeps page inside preview box
//             renderAnnotationLayer={false}
//             renderTextLayer={false}
//           />
//         </Document>
//       </div>

//       <div className="p-3">
//         <div className="font-semibold truncate">{file?.name || "Document.pdf"}</div>
//         <div className="text-sm text-gray-500">{numPages ? `${numPages} ${numPages > 1 ? "pages" : "page"}` : ""}</div>
//       </div>

//       <div className="px-3 pb-3 flex gap-2">
//         <button type="button" onClick={onReplace} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">
//           Replace
//         </button>
//         <button type="button" onClick={onRemove} className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm hover:bg-gray-300">
//           Remove
//         </button>
//       </div>
//     </div>
//   );
// };

// /* -------------------- Field types -------------------- */
// const FIELD_TYPES = {
//   SIGNATURE: "signature",
//   INITIALS: "initials",
//   NAME: "name",
//   JOB_TITLE: "jobTitle",
//   COMPANY: "company",
//   DATE: "date",
//   TEXT: "text",
//   CHECKBOX: "checkbox",
//   IMAGE: "image",
//   EMAIL: "email",
//   PHONE: "phone",
// };

// /* -------------------- Default/min sizes -------------------- */
// const TYPE_DEFAULTS = {
//   [FIELD_TYPES.SIGNATURE]: { w: 150, h: 50 },
//   [FIELD_TYPES.INITIALS]: { w: 160, h: 60 },
//   [FIELD_TYPES.IMAGE]: { w: 160, h: 60 },
//   [FIELD_TYPES.DATE]: { w: 120, h: 40 },
//   [FIELD_TYPES.TEXT]: { w: 220, h: 40 },
//   [FIELD_TYPES.NAME]: { w: 160, h: 40 },
//   [FIELD_TYPES.EMAIL]: { w: 220, h: 40 },
//   [FIELD_TYPES.COMPANY]: { w: 220, h: 40 },
//   [FIELD_TYPES.JOB_TITLE]: { w: 220, h: 40 },
//   [FIELD_TYPES.PHONE]: { w: 220, h: 40 },
//   [FIELD_TYPES.CHECKBOX]: { w: 20, h: 20 },
// };
// const TYPE_MIN = {
//   [FIELD_TYPES.SIGNATURE]: { w: 100, h: 40 },
//   [FIELD_TYPES.INITIALS]: { w: 100, h: 40 },
//   [FIELD_TYPES.IMAGE]: { w: 60, h: 40 },
//   [FIELD_TYPES.DATE]: { w: 90, h: 28 },
//   [FIELD_TYPES.TEXT]: { w: 120, h: 32 },
//   [FIELD_TYPES.NAME]: { w: 120, h: 32 },
//   [FIELD_TYPES.EMAIL]: { w: 160, h: 32 },
//   [FIELD_TYPES.COMPANY]: { w: 160, h: 32 },
//   [FIELD_TYPES.JOB_TITLE]: { w: 160, h: 32 },
//   [FIELD_TYPES.PHONE]: { w: 160, h: 32 },
//   [FIELD_TYPES.CHECKBOX]: { w: 16, h: 16 },
// };

// const defSize = (type) => TYPE_DEFAULTS[type] || { w: 200, h: 40 };
// const minSize = (type) => TYPE_MIN[type] || { w: 100, h: 32 };

// /* -------------------- DocuSign-style signer colors -------------------- */
// const SIGNER_COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ef4444", "#14b8a6", "#eab308"];
// const colorByIndex = (idx = 0) => SIGNER_COLORS[idx % SIGNER_COLORS.length];

// /* -------------------- Helpers -------------------- */
// const safeName = (r) => (r?.name || r?.fullName || r?.firstName || "").toString().trim();

// const recipientLabel = (recipients, email) => {
//   const r = (recipients || []).find((x) => (x.email || "").toLowerCase() === (email || "").toLowerCase());
//   if (!r) return email || "Unassigned";
//   const n = safeName(r);
//   return n ? `${n} (${r.email})` : r.email;
// };

// const toolLabel = (type) =>
//   ({
//     signature: "Signature",
//     initials: "Initials",
//     name: "Name",
//     jobTitle: "Job Title",
//     company: "Company",
//     date: "Date",
//     text: "Text",
//     checkbox: "Checkbox",
//     image: "Image",
//     email: "Email",
//     phone: "Phone",
//   }[type] || type);

// export default function RequestSignaturesPage() {
//   // Step + file + PDF
//   const [step, setStep] = useState(1);
//   const [file, setFile] = useState(null);
//   const [pageNumber, setPageNumber] = useState(1);
//   const [numPages, setNumPages] = useState(null);

//   // Recipients + elements
//   const [formData, setFormData] = useState({
//     title: "",
//     note: "",
//     folder: "default",
//     recipients: [],
//   });

//   const [useSigningOrder, setUseSigningOrder] = useState(false);
//   const [selectedEmail, setSelectedEmail] = useState("");
//   const [contactBook, setContactBook] = useState([]);
//   const [signatureElements, setSignatureElements] = useState([]);

//   // signer colors map { email: color }
//   const [recipientColors, setRecipientColors] = useState({});

//   // Draft autosave docId
//   const [draftDocId, setDraftDocId] = useState(null);

//   // Dragging
//   const [draggedElement, setDraggedElement] = useState(null);
//   const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });

//   // Resizing
//   const [resizingId, setResizingId] = useState(null);
//   const [resizeOrigin, setResizeOrigin] = useState({ startX: 0, startY: 0, startW: 0, startH: 0, type: FIELD_TYPES.TEXT });

//   // Touch drag
//   const [touchDraggedElement, setTouchDraggedElement] = useState(null);

//   // Send popup/loading
//   const [showSendPopup, setShowSendPopup] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Refs
//   const containerRef = useRef(null);
//   const fileInputRef = useRef(null);

//   /* -------------------- normalize element coords for backend -------------------- */
//   const normalizeForPdf = (elements) => {
//     const container = containerRef.current;
//     if (!container || !elements?.length) return elements || [];

//     return elements.map((el) => {
//       const selector = `.react-pdf__Page[data-page-number="${el.pageNumber}"]`;
//       const pageEl =
//         container.querySelector(selector) ||
//         document.querySelector(selector) ||
//         container.querySelector(".react-pdf__Page") ||
//         document.querySelector(".react-pdf__Page");

//       let pageWidth = 800;
//       let offsetX = 0;
//       let offsetY = 0;

//       if (pageEl) {
//         const canvas = pageEl.querySelector("canvas");
//         pageWidth = (canvas && canvas.clientWidth) || pageEl.clientWidth || pageWidth;
//         const pageRect = pageEl.getBoundingClientRect();
//         const contRect = container.getBoundingClientRect();
//         offsetX = pageRect.left - contRect.left + container.scrollLeft;
//         offsetY = pageRect.top - contRect.top + container.scrollTop;
//       } else if (typeof window !== "undefined") {
//         pageWidth = Math.min(window.innerWidth - 32, 800);
//       }

//       const localX = (Number(el.x) || 0) - offsetX;
//       const localY = (Number(el.y) || 0) - offsetY;
//       const s = 800 / (pageWidth || 800);

//       return {
//         ...el,
//         canvasWidth: pageWidth,
//         x: Math.round(localX * s),
//         y: Math.round(localY * s),
//         ...(el.width != null ? { width: Math.round(Number(el.width) * s) } : {}),
//         ...(el.height != null ? { height: Math.round(Number(el.height) * s) } : {}),
//       };
//     });
//   };

//   /* -------------------- colors for signers -------------------- */
//   const assignRecipientColors = (recipients) => {
//     const signers = (recipients || []).filter((r) => r.willSign === true);
//     const map = {};
//     signers.forEach((r, i) => {
//       map[r.email] = colorByIndex(i);
//     });
//     setRecipientColors(map);
//   };

//   /* -------------------- load contactbook -------------------- */
//   const fetchContactBooks = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const headers = { headers: { authorization: `Bearer ${token}` } };
//       const res = await axios.get(`${BASE_URL}/fetchContactBooks`, headers);
//       setContactBook(res.data?.contactBooks || []);
//     } catch {
//       toast.error("Something went wrong, please try again", { containerId: "requestSignature" });
//     }
//   };

//   useEffect(() => {
//     fetchContactBooks();
//   }, []);

//   /* -------------------- file upload -------------------- */
//   const handleFileChange = (e) => {
//     const selected = e.target.files?.[0];
//     if (selected && /\.pdf$/i.test(selected.name)) {
//       setFile(selected);
//       setPageNumber(1);
//     } else {
//       toast.error("Please select a PDF file.", { containerId: "requestSignature" });
//     }
//   };

//   /* -------------------- Recipients -------------------- */
//   const addRecipient = () => {
//     if (!selectedEmail) return;

//     const exists = formData.recipients.some((r) => r.email === selectedEmail);
//     if (exists) {
//       toast.error("This email has already been added.", { containerId: "requestSignature" });
//       return;
//     }

//     // If contactBook has a name, use it
//     const found = (contactBook || []).find((c) => (c.email || "").toLowerCase() === selectedEmail.toLowerCase());

//     setFormData((prev) => {
//       const nextOrder = useSigningOrder && prev.recipients.filter((r) => r.willSign).length + 1;
//       const next = [
//         ...prev.recipients,
//         {
//           email: selectedEmail,
//           name: found?.name || "",
//           phone: found?.phoneNumber || found?.phone || found?.mobile || "",
//           willSign: true,
//           ...(useSigningOrder ? { order: nextOrder } : {}),
//         },
//       ];
//       return { ...prev, recipients: next };
//     });

//     setSelectedEmail("");
//   };

//   const addManualRecipient = () => {
//     const { newRecipientEmail, newRecipientName, newRecipientPhone, newRecipientAddress } = formData;

//     if (!newRecipientName) return toast.error("Please enter signer name", { containerId: "requestSignature" });
//     if (!newRecipientEmail) return toast.error("Please enter signer email", { containerId: "requestSignature" });
//     if (!newRecipientPhone) return toast.error("Please enter signer phone number", { containerId: "requestSignature" });

//     const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
//     if (!phoneRegex.test(newRecipientPhone)) {
//       toast.error("Please enter a valid phone number", { containerId: "requestSignature" });
//       return;
//     }

//     setFormData((prev) => {
//       const nextOrder = useSigningOrder && prev.recipients.filter((r) => r.willSign).length + 1;
//       const next = [
//         ...prev.recipients,
//         {
//           email: newRecipientEmail,
//           name: newRecipientName,
//           phone: newRecipientPhone || "",
//           address: newRecipientAddress || "",
//           willSign: true,
//           ...(useSigningOrder ? { order: nextOrder } : {}),
//         },
//       ];
//       return {
//         ...prev,
//         recipients: next,
//         newRecipientEmail: "",
//         newRecipientName: "",
//         newRecipientPhone: "",
//         newRecipientAddress: "",
//       };
//     });
//   };

//   const removeRecipient = (index) => {
//     setFormData((prev) => {
//       const arr = prev.recipients.filter((_, i) => i !== index);
//       const resequenced = useSigningOrder ? arr.map((r, i) => (r.willSign ? { ...r, order: i + 1 } : r)) : arr;
//       return { ...prev, recipients: resequenced };
//     });
//   };

//   const handleChangeSign = (recipient, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       recipients: prev.recipients.map((r) => (r.email === recipient.email ? { ...r, willSign: value } : r)),
//     }));
//   };

//   const moveRecipient = (index, delta) => {
//     setFormData((prev) => {
//       const arr = [...prev.recipients];
//       const to = index + delta;
//       if (to < 0 || to >= arr.length) return prev;
//       [arr[index], arr[to]] = [arr[to], arr[index]];
//       const recomputed = arr.map((r, i) => (r.willSign ? { ...r, order: i + 1 } : r));
//       return { ...prev, recipients: recomputed };
//     });
//   };

//   /* -------------------- Create placeholders -------------------- */
//   const createPlaceholder = (type, email, x = 50, y = 50, options = {}) => {
//     const rec = (formData.recipients || []).find((r) => r.email === email) || {};
//     const d = defSize(type);

//     let prefill = "";
//     if (type === FIELD_TYPES.NAME && rec.name) prefill = rec.name;
//     if (type === FIELD_TYPES.EMAIL && email) prefill = email;
//     if (type === FIELD_TYPES.PHONE && rec.phone) prefill = rec.phone;

//     const color = recipientColors[email] || "#64748b";
//     const label = recipientLabel(formData.recipients, email);

//     const newElement = {
//       id: uuidv4(),
//       type,
//       x,
//       y,
//       width: d.w,
//       height: d.h,
//       pageNumber,
//       recipientEmail: email,
//       signerColor: color,
//       signerLabel: label,
//       placeholderText: toolLabel(type),
//       isPlaceholder: true,
//       ...options,
//       value: prefill,
//     };

//     setSignatureElements((prev) => [...prev, newElement]);
//   };

//   const deleteElement = (id) => {
//     setSignatureElements((prev) => prev.filter((el) => el.id !== id));
//   };

//   /* -------------------- Toolbox drag/drop -------------------- */
//   const handleToolDragStart = (type, email, options = {}) => (e) => {
//     e.dataTransfer.setData("type", type);
//     e.dataTransfer.setData("email", email);
//     e.dataTransfer.setData("options", JSON.stringify(options));
//   };

//   const handleDocumentDrop = (e) => {
//     e.preventDefault();
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const type = e.dataTransfer.getData("type");
//     const email = e.dataTransfer.getData("email");
//     const options = JSON.parse(e.dataTransfer.getData("options") || "{}");
//     if (type && email) createPlaceholder(type, email, x, y, options);
//   };

//   /* -------------------- Touch toolbox drag -------------------- */
//   const handleToolTouchStart = (type, email, options = {}) => (e) => {
//     e.preventDefault();
//     setTouchDraggedElement({ type, email, options });
//   };
//   const handleToolTouchMove = (e) => {
//     if (!touchDraggedElement) return;
//     e.preventDefault();
//   };
//   const handleToolTouchEnd = (e) => {
//     if (!touchDraggedElement) return;
//     e.preventDefault();
//     const touch = e.changedTouches[0];
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = touch.clientX - rect.left;
//     const y = touch.clientY - rect.top;
//     if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
//       const { type, email, options } = touchDraggedElement;
//       createPlaceholder(type, email, x, y, options);
//     }
//     setTouchDraggedElement(null);
//   };

//   /* -------------------- Drag element + resize -------------------- */
//   const handleMouseDown = (e, id) => {
//     if (e.target?.dataset?.resizer === "true") return;
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     const el = signatureElements.find((s) => s.id === id);
//     if (!el) return;
//     setPositionOffset({ x: x - el.x, y: y - el.y });
//     setDraggedElement(id);
//   };

//   const handleMouseMove = (e) => {
//     if (resizingId && resizeOrigin) {
//       const rect = containerRef.current.getBoundingClientRect();
//       const curX = e.clientX - rect.left;
//       const curY = e.clientY - rect.top;
//       const dx = curX - resizeOrigin.startX;
//       const dy = curY - resizeOrigin.startY;
//       const mins = minSize(resizeOrigin.type);

//       setSignatureElements((prev) =>
//         prev.map((el) =>
//           el.id === resizingId
//             ? {
//                 ...el,
//                 width: Math.max(mins.w, Math.round(resizeOrigin.startW + dx)),
//                 height: Math.max(mins.h, Math.round(resizeOrigin.startH + dy)),
//               }
//             : el
//         )
//       );
//       return;
//     }

//     if (!draggedElement) return;
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left - positionOffset.x;
//     const y = e.clientY - rect.top - positionOffset.y;
//     setSignatureElements((prev) => prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el)));
//   };

//   const handleMouseUp = () => {
//     setDraggedElement(null);
//     setResizingId(null);
//   };

//   const startResizeMouse = (e, id, type) => {
//     e.stopPropagation();
//     e.preventDefault();
//     const rect = containerRef.current.getBoundingClientRect();
//     const el = signatureElements.find((s) => s.id === id);
//     if (!el) return;
//     setResizingId(id);
//     setResizeOrigin({
//       startX: e.clientX - rect.left,
//       startY: e.clientY - rect.top,
//       startW: el.width || defSize(type).w,
//       startH: el.height || defSize(type).h,
//       type,
//     });
//   };

//   const startResizeTouch = (e, id, type) => {
//     e.stopPropagation();
//     const touch = e.touches[0];
//     const rect = containerRef.current.getBoundingClientRect();
//     const el = signatureElements.find((s) => s.id === id);
//     if (!el) return;
//     setResizingId(id);
//     setResizeOrigin({
//       startX: touch.clientX - rect.left,
//       startY: touch.clientY - rect.top,
//       startW: el.width || defSize(type).w,
//       startH: el.height || defSize(type).h,
//       type,
//     });
//   };

//   const handleElementTouchStart = (e, id) => {
//     if (e.target?.dataset?.resizer === "true") return;
//     e.preventDefault();
//     const touch = e.touches[0];
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = touch.clientX - rect.left;
//     const y = touch.clientY - rect.top;
//     const el = signatureElements.find((s) => s.id === id);
//     if (!el) return;
//     setPositionOffset({ x: x - el.x, y: y - el.y });
//     setDraggedElement(id);
//   };

//   const handleElementTouchMove = (e) => {
//     if (resizingId && resizeOrigin) {
//       e.preventDefault();
//       const touch = e.touches[0];
//       const rect = containerRef.current.getBoundingClientRect();
//       const curX = touch.clientX - rect.left;
//       const curY = touch.clientY - rect.top;
//       const dx = curX - resizeOrigin.startX;
//       const dy = curY - resizeOrigin.startY;
//       const mins = minSize(resizeOrigin.type);

//       setSignatureElements((prev) =>
//         prev.map((el) =>
//           el.id === resizingId
//             ? {
//                 ...el,
//                 width: Math.max(mins.w, Math.round(resizeOrigin.startW + dx)),
//                 height: Math.max(mins.h, Math.round(resizeOrigin.startH + dy)),
//               }
//             : el
//         )
//       );
//       return;
//     }

//     if (!draggedElement) return;
//     e.preventDefault();
//     const touch = e.touches[0];
//     const rect = containerRef.current.getBoundingClientRect();
//     const x = touch.clientX - rect.left - positionOffset.x;
//     const y = touch.clientY - rect.top - positionOffset.y;
//     setSignatureElements((prev) => prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el)));
//   };

//   const handleElementTouchEnd = () => {
//     setDraggedElement(null);
//     setResizingId(null);
//   };

//   /* -------------------- STEP 1 submit -> create draft + go Step 2 -------------------- */
//   const handleFormSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.title?.trim()) return toast.error("Please enter document title", { containerId: "requestSignature" });
//     if (!file) return toast.error("Please select a document", { containerId: "requestSignature" });
//     if (!formData.recipients?.length) return toast.error("Please select recipients", { containerId: "requestSignature" });
//     if (formData.recipients.filter((u) => u.willSign === true).length === 0) {
//       return toast.error("Please select at least one signer", { containerId: "requestSignature" });
//     }

//     // compute order if enabled
//     let recipients = formData.recipients;
//     if (useSigningOrder) {
//       recipients = recipients.map((r, i) => (r.willSign ? { ...r, order: r.order ?? i + 1 } : r));
//       setFormData((prev) => ({ ...prev, recipients }));
//     }

//     // signer colors
//     assignRecipientColors(recipients);

//     // ✅ auto-create draft so user doesn't lose progress
//     try {
//       const token = localStorage.getItem("token");
//       const headers = { headers: { authorization: `Bearer ${token}` } };

//       const fd = new FormData();
//       fd.append("document", file);
//       fd.append("title", formData.title);
//       fd.append("note", formData.note || "");
//       fd.append("folder", formData.folder || "default");
//       fd.append("recipients", JSON.stringify(recipients));
//       fd.append("elements", JSON.stringify([])); // start empty

//       const resp = await axios.post(`${BASE_URL}/createDraft`, fd, headers);
//       const createdId = resp?.data?.doc?._id || resp?.data?.document?._id;
//       if (createdId) {
//         setDraftDocId(createdId);
//         localStorage.setItem("active_draft_docId", createdId);
//       }
//     } catch (err) {
//       console.warn("Auto draft save failed:", err?.message);
//     }

//     setStep(2);
//   };

//   /* -------------------- Draft autosave debounce (Step 2) -------------------- */
//   useEffect(() => {
//     if (step !== 2) return;
//     if (!draftDocId) return;

//     const token = localStorage.getItem("token");
//     if (!token) return;

//     const t = setTimeout(async () => {
//       try {
//         const headers = { headers: { authorization: `Bearer ${token}` } };
//         const elementsToSave = normalizeForPdf(signatureElements);

//         await axios.patch(
//           `${BASE_URL}/editDocument/${draftDocId}`,
//           {
//             title: formData.title,
//             note: formData.note || "",
//             folder: formData.folder || "default",
//             recipients: formData.recipients,
//             elements: elementsToSave,
//             draft: true,
//           },
//           headers
//         );
//       } catch (e) {
//         console.warn("Draft autosave failed:", e?.message);
//       }
//     }, 800);

//     return () => clearTimeout(t);
//   }, [signatureElements, formData, draftDocId, step]);

//   /* -------------------- Send flow -------------------- */
//   const handleSendRequest = () => {
//     const required = formData.recipients.filter((u) => u.willSign === true);
//     const ok = required.every((r) => signatureElements.some((el) => el.recipientEmail === r.email));
//     if (!ok) {
//       toast.error("At least one element should be created for each signer", { containerId: "requestSignature" });
//       return;
//     }
//     if (useSigningOrder) {
//       const missingOrder = required.some((r) => !Number.isInteger(r.order));
//       if (missingOrder) {
//         toast.error("Please set an order for each signer", { containerId: "requestSignature" });
//         return;
//       }
//     }
//     setShowSendPopup(true);
//   };

//   const sendThroughEmail = async () => {
//     try {
//       setLoading(true);

//       const token = localStorage.getItem("token");
//       const headers = { headers: { authorization: `Bearer ${token}` } };

//       const elementsToSave = normalizeForPdf(signatureElements);

//       // Save as a final document (or reuse draftDocId if you want — leaving your current behavior)
//       const form = new FormData();
//       form.append("document", file);
//       form.append("title", formData.title);
//       form.append("elements", JSON.stringify(elementsToSave));

//       const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
//       const documentId = saveResponse.data?.doc?._id;

//       const recipients = formData.recipients.map((r, idx) => ({
//         ...r,
//         ...(useSigningOrder && r.willSign ? { order: r.order ?? idx + 1 } : {}),
//       }));

//       await axios.post(
//         `${BASE_URL}/sendSignRequest`,
//         { ...formData, documentId, elements: elementsToSave, sendInOrder: useSigningOrder, recipients },
//         headers
//       );

//       toast.success("Signature request sent", { containerId: "requestSignature" });

//       // clear active draft pointer
//       localStorage.removeItem("active_draft_docId");

//       setFile(null);
//       setFormData({ title: "", note: "", folder: "default", recipients: [] });
//       setSignatureElements([]);
//       setDraftDocId(null);
//       setLoading(false);
//       window.location.reload();
//     } catch (e) {
//       setLoading(false);
//       const msg = e?.response?.data?.error || "Something went wrong please try again";
//       toast.error(msg, { containerId: "requestSignature" });
//     }
//   };

//   /* -------------------- Field preview (tooltip + signer color bar) -------------------- */
//   const renderFieldPreview = (element) => {
//     const w = Math.max(minSize(element.type).w, Math.round(element.width || defSize(element.type).w));
//     const h = Math.max(minSize(element.type).h, Math.round(element.height || defSize(element.type).h));

//     const signerColor = element.signerColor || recipientColors[element.recipientEmail] || "#64748b";
//     const signerText = element.signerLabel || recipientLabel(formData.recipients, element.recipientEmail);

//     const baseBox = "border-2 border-dashed cursor-move rounded-sm select-none overflow-hidden relative";
//     const typeClasses = {
//       [FIELD_TYPES.SIGNATURE]: "border-blue-500 bg-blue-50",
//       [FIELD_TYPES.INITIALS]: "border-green-500 bg-green-50",
//       [FIELD_TYPES.DATE]: "border-purple-500 bg-purple-50",
//       [FIELD_TYPES.IMAGE]: "border-indigo-500 bg-indigo-50",
//       [FIELD_TYPES.CHECKBOX]: "border-orange-500 bg-orange-50",
//     };

//     const content = () => {
//       if (element.type === FIELD_TYPES.CHECKBOX) {
//         return (
//           <div className="flex items-center gap-2 p-2">
//             <input type="checkbox" disabled className="w-4 h-4" />
//             <span className="text-xs text-gray-500">{element.placeholderText}</span>
//           </div>
//         );
//       }
//       if (element.value) {
//         if (element.type === FIELD_TYPES.IMAGE) return <img src={element.value} alt="" className="w-full h-full object-contain" />;
//         return <div className="text-sm p-2 break-words">{element.value}</div>;
//       }
//       if (element.type === FIELD_TYPES.SIGNATURE) {
//         return (
//           <div className="w-full h-full flex flex-col items-center justify-center leading-tight">
//             <div className="font-semibold">Sign</div>
//             <div aria-hidden="true">🖊️</div>
//           </div>
//         );
//       }
//       return <div className="text-xs text-gray-500 p-2">{element.placeholderText}</div>;
//     };

//     return (
//       <div
//         className={`${baseBox} ${typeClasses[element.type] || "border-gray-500 bg-gray-50"}`}
//         title={`${toolLabel(element.type)} for ${signerText}`} // ✅ tooltip
//         style={{
//           width: w,
//           height: h,
//           borderLeft: `6px solid ${signerColor}`, // ✅ signer color bar
//         }}
//       >
//         {/* Tiny label chip (optional but helps) */}
//         <div
//           className="absolute left-2 top-2 text-[10px] px-2 py-0.5 rounded-full bg-white/90 border"
//           style={{ borderColor: signerColor, color: "#0f172a" }}
//         >
//           {safeName((formData.recipients || []).find(r => r.email === element.recipientEmail)) || element.recipientEmail}
//         </div>

//         {content()}

//         {/* Resize handle */}
//         <div
//           data-resizer="true"
//           onMouseDown={(e) => startResizeMouse(e, element.id, element.type)}
//           onTouchStart={(e) => startResizeTouch(e, element.id, element.type)}
//           className="absolute"
//           style={{
//             right: -6,
//             bottom: -6,
//             width: 12,
//             height: 12,
//             background: "#3b82f6",
//             border: "2px solid white",
//             borderRadius: 2,
//             boxShadow: "0 0 0 1px rgba(0,0,0,0.03)",
//             cursor: "se-resize",
//           }}
//           title="Drag to resize"
//         />
//       </div>
//     );
//   };

//   return (
//     <>
//       <ToastContainer containerId={"requestSignature"} />

//       <div className="admin-content">
//         {step === 1 ? (
//           <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
//             <h2 className="text-2xl font-bold mb-6">Request Signatures</h2>

//             <form onSubmit={handleFormSubmit}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-2">Document Title*</label>
//                 <input
//                   type="text"
//                   required
//                   className="w-full p-2 border rounded"
//                   value={formData.title}
//                   onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                 />
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-medium mb-2">Add documents</label>

//                 <div className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-4">
//                   {file ? (
//                     <PdfPreviewCard file={file} onReplace={() => fileInputRef.current?.click()} onRemove={() => setFile(null)} />
//                   ) : (
//                     <div className="w-[320px] h-[284px] rounded-xl border border-dashed bg-white flex items-center justify-center text-gray-400">
//                       No file selected
//                     </div>
//                   )}

//                   <div
//                     className="min-h-[284px] rounded-xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center text-center gap-3"
//                     onClick={() => fileInputRef.current?.click()}
//                     onDragOver={(e) => e.preventDefault()}
//                     onDrop={(e) => {
//                       e.preventDefault();
//                       const dropped = [...(e.dataTransfer?.files || [])].find((f) => /\.pdf$/i.test(f.name));
//                       if (dropped) handleFileChange({ target: { files: [dropped] } });
//                     }}
//                   >
//                     <div className="rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center">
//                       <span className="text-gray-600">↥</span>
//                     </div>
//                     <div className="text-gray-700">Drop your files here or</div>
//                     <button type="button" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
//                       Upload
//                     </button>
//                     <input ref={fileInputRef} type="file" hidden accept=".pdf" onChange={handleFileChange} />
//                   </div>
//                 </div>

//                 <p className="text-sm text-gray-500 mt-2">PDF only. We’ll show a preview of the first page.</p>
//               </div>

//               {/* Signing order toggle */}
//               <div className="mb-3 flex items-center gap-3">
//                 <label className="inline-flex items-center gap-2 cursor-pointer">
//                   <input
//                     type="checkbox"
//                     className="w-4 h-4"
//                     checked={useSigningOrder}
//                     onChange={(e) => {
//                       const checked = e.target.checked;
//                       setUseSigningOrder(checked);

//                       if (checked) {
//                         setFormData((prev) => ({
//                           ...prev,
//                           recipients: prev.recipients.map((r, i) => (r.willSign ? { ...r, order: r.order ?? i + 1 } : r)),
//                         }));
//                       } else {
//                         setFormData((prev) => ({
//                           ...prev,
//                           recipients: prev.recipients.map((r) => {
//                             const { order, ...rest } = r;
//                             return rest;
//                           }),
//                         }));
//                       }
//                     }}
//                   />
//                   <span className="text-sm font-medium">Set signing order</span>
//                 </label>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-medium mb-2">Note</label>
//                 <textarea
//                   className="w-full p-2 border rounded"
//                   value={formData.note}
//                   onChange={(e) => setFormData({ ...formData, note: e.target.value })}
//                   placeholder="Note for recipients"
//                 />
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-medium mb-2">Select Folder</label>
//                 <select className="w-full p-2 border rounded" value={formData.folder} onChange={(e) => setFormData({ ...formData, folder: e.target.value })}>
//                   <option value="default">Default</option>
//                   <option value="contracts">Contracts</option>
//                   <option value="personal">Personal</option>
//                 </select>
//               </div>

//               {/* Recipients */}
//               <div className="mb-6">
//                 <h3 className="font-medium mb-2">Add Recipients</h3>

//                 <div className="flex gap-2 mb-2">
//                   <select className="flex-1 p-2 border rounded" value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
//                     <option value="">Select recipient email</option>
//                     {contactBook?.map((c) => (
//                       <option key={c?.email} value={c?.email}>
//                         {c?.email}
//                       </option>
//                     ))}
//                   </select>
//                   <button type="button" onClick={addRecipient} className="bg-[#29354a] text-white px-4 py-2 rounded" disabled={!selectedEmail}>
//                     Add
//                   </button>
//                 </div>

//                 {/* Manual */}
//                 <div className="border p-4 rounded-md bg-gray-50">
//                   <h4 className="text-sm font-medium mb-2">Or Enter Manually</h4>
//                   <input
//                     type="text"
//                     className="w-full p-2 border rounded mb-2"
//                     placeholder="Full Name"
//                     value={formData.newRecipientName || ""}
//                     onChange={(e) => setFormData({ ...formData, newRecipientName: e.target.value })}
//                   />
//                   <input
//                     type="email"
//                     className="w-full p-2 border rounded mb-2"
//                     placeholder="Email Address"
//                     value={formData.newRecipientEmail || ""}
//                     onChange={(e) => setFormData({ ...formData, newRecipientEmail: e.target.value })}
//                   />
//                   <input
//                     type="tel"
//                     className="w-full p-2 border rounded mb-2"
//                     placeholder="Phone Number"
//                     value={formData.newRecipientPhone || ""}
//                     onChange={(e) => setFormData({ ...formData, newRecipientPhone: e.target.value })}
//                   />
//                   <input
//                     type="text"
//                     className="w-full p-2 border rounded mb-2"
//                     placeholder="Address"
//                     value={formData.newRecipientAddress || ""}
//                     onChange={(e) => setFormData({ ...formData, newRecipientAddress: e.target.value })}
//                   />

//                   <button
//                     type="button"
//                     onClick={addManualRecipient}
//                     className="w-fit mx-auto bg-[#29354a] text-white px-4 py-2 rounded-[20px] flex"
//                     disabled={!formData.newRecipientEmail || !formData.newRecipientName}
//                   >
//                     Add Recipient
//                   </button>
//                 </div>

//                 {/* List */}
//                 {formData.recipients.length > 0 && (
//                   <div className="border rounded p-2 mt-4">
//                     {formData.recipients.map((recipient, index) => (
//                       <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 last:mb-0 gap-2">
//                         <div className="flex-1 min-w-0">
//                           <p className="font-medium break-words">
//                             {safeName(recipient) ? `${safeName(recipient)} ` : ""}
//                             <span className="text-gray-600">({recipient.email})</span>
//                           </p>

//                           {useSigningOrder && recipient.willSign && (
//                             <p className="text-xs text-purple-700">Order: {recipient.order ?? index + 1}</p>
//                           )}
//                           {recipient.phone && <p className="text-xs text-gray-500 break-words">📞 {recipient.phone}</p>}
//                           {recipient.address && <p className="text-xs text-gray-500 break-words">📍 {recipient.address}</p>}
//                         </div>

//                         <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
//                           <select
//                             onChange={(e) => handleChangeSign(recipient, e.target.value === "true")}
//                             value={recipient.willSign ? true : false}
//                             className="border rounded p-1 w-full sm:w-auto"
//                           >
//                             <option value="true">Needs to Sign</option>
//                             <option value="false">Will Receive a Copy</option>
//                           </select>

//                           {useSigningOrder && recipient.willSign && (
//                             <div className="flex items-center gap-1">
//                               <button type="button" className="px-2 py-1 border rounded" onClick={() => moveRecipient(index, -1)} title="Move up">
//                                 ↑
//                               </button>
//                               <button type="button" className="px-2 py-1 border rounded" onClick={() => moveRecipient(index, +1)} title="Move down">
//                                 ↓
//                               </button>
//                             </div>
//                           )}

//                           <button onClick={() => removeRecipient(index)} className="text-red-500 text-lg">
//                             ×
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <button type="submit" className="mx-auto flex bg-[#002864] text-white py-2 px-4 rounded-[20px] w-fit" disabled={formData.recipients.length === 0}>
//                 Prepare Document
//               </button>
//             </form>
//           </div>
//         ) : (
//           <div className="flex min-h-screen lg:flex-row flex-col bg-gray-100">
//             {/* PDF + overlay */}
//             <div
//               className="flex-1 p-2 lg:p-4 overflow-auto relative w-full"
//               ref={containerRef}
//               onMouseMove={handleMouseMove}
//               onMouseUp={handleMouseUp}
//               onDrop={handleDocumentDrop}
//               onDragOver={(e) => e.preventDefault()}
//               onTouchMove={handleElementTouchMove}
//               onTouchEnd={handleElementTouchEnd}
//               style={{ touchAction: "none" }}
//             >
//               <button
//                 onClick={handleSendRequest}
//                 className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg"
//                 disabled={signatureElements.length === 0}
//               >
//                 Send Request
//               </button>

//               {file?.type === "application/pdf" ? (
//                 <div className="w-full">
//                   {numPages > 1 && (
//                     <div className="flex items-center justify-center gap-4 mb-4 bg-white p-2 rounded shadow sticky top-0 z-40">
//                       <button
//                         onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
//                         disabled={pageNumber <= 1}
//                         className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
//                       >
//                         Previous
//                       </button>
//                       <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
//                       <button
//                         onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
//                         disabled={pageNumber >= numPages}
//                         className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
//                       >
//                         Next
//                       </button>
//                     </div>
//                   )}

//                   <Document
//                     file={file}
//                     onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//                     onLoadError={() => toast.error("Failed to load PDF", { containerId: "requestSignature" })}
//                     loading="Loading PDF..."
//                     className="w-full"
//                   >
//                     <Page
//                       pageNumber={pageNumber}
//                       width={typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 800) : 800}
//                       className="w-full h-auto"
//                       renderAnnotationLayer={false}
//                       renderTextLayer={false}
//                     />
//                   </Document>
//                 </div>
//               ) : null}

//               {signatureElements
//                 .filter((el) => el.pageNumber === pageNumber)
//                 .map((element) => (
//                   <div
//                     key={element.id}
//                     className="absolute"
//                     style={{
//                       left: `${element.x}px`,
//                       top: `${element.y}px`,
//                       zIndex: draggedElement === element.id ? 1000 : 1,
//                     }}
//                   >
//                     <div className="relative" onMouseDown={(e) => handleMouseDown(e, element.id)} onTouchStart={(e) => handleElementTouchStart(e, element.id)} onTouchMove={handleElementTouchMove} onTouchEnd={handleElementTouchEnd}>
//                       {renderFieldPreview(element)}
//                       <button
//                         onClick={() => deleteElement(element.id)}
//                         className="absolute -right-3 -top-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
//                       >
//                         ×
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//             </div>

//             {/* Right pane */}
//             <div className="lg:w-[340px] w-full bg-white p-4 shadow-lg overflow-y-auto sticky top-0 max-h-[calc(100vh-16px)]">
//               <h3 className="text-xl font-bold mb-4">Field Types</h3>

//               <div className="mb-6">
//                 <h4 className="font-medium mb-2">Recipients</h4>

//                 {(formData.recipients || [])
//                   .filter((u) => u.willSign === true)
//                   .map((recipient, idx) => {
//                     const color = recipientColors[recipient.email] || colorByIndex(idx);
//                     const name = safeName(recipient);

//                     return (
//                       <div
//                         key={recipient.email}
//                         className="mb-4 border rounded-xl p-3 bg-white shadow-sm"
//                         style={{ borderLeft: `8px solid ${color}` }}
//                       >
//                         {/* ✅ NAME + EMAIL (this is the section you were looking for) */}
//                         <div className="flex items-start gap-2 mb-2">
//                           <span className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: color }} />
//                           <div className="min-w-0">
//                             <div className="font-semibold truncate">{name || "Unknown Name"}</div>
//                             <div className="text-xs text-gray-600 break-all">{recipient.email}</div>
//                           </div>
//                         </div>

//                         {useSigningOrder && <div className="text-xs text-purple-700 mb-2">Order: {recipient.order}</div>}

//                         <div className="grid grid-cols-2 gap-2">
//                           {Object.values(FIELD_TYPES).map((type) => (
//                             <div
//                               key={`${type}-${recipient.email}`}
//                               className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded"
//                               draggable
//                               onDragStart={handleToolDragStart(type, recipient.email)}
//                               onTouchStart={handleToolTouchStart(type, recipient.email)}
//                               onTouchMove={handleToolTouchMove}
//                               onTouchEnd={handleToolTouchEnd}
//                               title={`Add ${toolLabel(type)} for ${name || recipient.email}`}
//                             >
//                               {toolLabel(type)}
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     );
//                   })}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Send popup */}
//       {showSendPopup && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg w-96 text-left">
//             <div className="flex justify-between">
//               <h3 className="text-xl font-bold mb-4">Send Mail</h3>
//               <div className="text-[18px] cursor-pointer" onClick={() => setShowSendPopup(false)}>
//                 X
//               </div>
//             </div>

//             <p className="mb-6">{useSigningOrder ? "Invitations will be sent in the specified order." : "All signers will be invited immediately."}</p>

//             <div className="flex items-center mb-6">
//               <button className="bg-[#002864] text-white px-4 w-full py-2 rounded" onClick={sendThroughEmail}>
//                 Send
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Loading overlay */}
//       {loading ? (
//         <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
//           <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
//             <h3 className="text-2xl font-semibold text-gray-900">
//               Sending Document Invitations
//               <span className="block text-sm font-normal text-gray-500 mt-1">Server is sending signing invitations to recipients – please wait</span>
//             </h3>
//           </div>
//         </div>
//       ) : null}
//     </>
//   );
// }

// src/requestsignature.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer, toast } from "react-toastify";

/* ---------------- PDF worker ---------------- */
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/* ---------------- Draft localStorage key ---------------- */
const ACTIVE_DRAFT_KEY = "active_draft_docId";

/* ---------------- Field types ---------------- */
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

/* ---------------- Element sizing ---------------- */
const TYPE_DEFAULTS = {
  [FIELD_TYPES.SIGNATURE]: { w: 150, h: 50 },
  [FIELD_TYPES.INITIALS]: { w: 160, h: 60 },
  [FIELD_TYPES.IMAGE]: { w: 160, h: 60 },
  [FIELD_TYPES.DATE]: { w: 120, h: 40 },
  [FIELD_TYPES.TEXT]: { w: 140, h: 40 },
  [FIELD_TYPES.NAME]: { w: 160, h: 40 },
  [FIELD_TYPES.EMAIL]: { w: 220, h: 40 },
  [FIELD_TYPES.COMPANY]: { w: 220, h: 40 },
  [FIELD_TYPES.JOB_TITLE]: { w: 220, h: 40 },
  [FIELD_TYPES.PHONE]: { w: 220, h: 40 },
  [FIELD_TYPES.CHECKBOX]: { w: 20, h: 20 },
};
const TYPE_MIN = {
  [FIELD_TYPES.SIGNATURE]: { w: 100, h: 40 },
  [FIELD_TYPES.INITIALS]: { w: 100, h: 40 },
  [FIELD_TYPES.IMAGE]: { w: 60, h: 40 },
  [FIELD_TYPES.DATE]: { w: 90, h: 28 },
  [FIELD_TYPES.TEXT]: { w: 120, h: 32 },
  [FIELD_TYPES.NAME]: { w: 120, h: 32 },
  [FIELD_TYPES.EMAIL]: { w: 120, h: 32 },
  [FIELD_TYPES.COMPANY]: { w: 120, h: 32 },
  [FIELD_TYPES.JOB_TITLE]: { w: 120, h: 32 },
  [FIELD_TYPES.PHONE]: { w: 120, h: 32 },
  [FIELD_TYPES.CHECKBOX]: { w: 16, h: 16 },
};
const defSize = (type) => TYPE_DEFAULTS[type] || { w: 200, h: 40 };
const minSize = (type) => TYPE_MIN[type] || { w: 100, h: 32 };

/* ---------------- DocuSign-style signer colors ---------------- */
const SIGNER_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#ef4444", // red
  "#14b8a6", // teal
  "#eab308", // yellow
];
const getSignerColorByIndex = (idx = 0) => SIGNER_COLORS[idx % SIGNER_COLORS.length];

/* ---------------- Helpers: recipient label ---------------- */
const getRecipientLabel = (recipients, email) => {
  const r = (recipients || []).find(
    (x) => (x.email || "").toLowerCase() === (email || "").toLowerCase()
  );
  if (!r) return email || "Unassigned";
  const displayName =
    r.name ||
    r.fullName ||
    [r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
    "";
  return displayName ? `${displayName} (${r.email})` : r.email;
};

const getRecipientDisplayName = (r) => {
  const displayName =
    r.name ||
    r.fullName ||
    [r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
    "";
  return displayName || r.email;
};

/* ---------------- Preview card ---------------- */
const PdfPreviewCard = ({ file, onReplace, onRemove }) => {
  const [numPages, setNumPages] = useState(null);

  return (
    <div className="w-[320px] bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
      <div className="h-[260px] flex items-center justify-center bg-gray-50 overflow-hidden">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => {}}
          loading={<div className="text-sm text-gray-500">Generating preview…</div>}
        >
          <Page pageNumber={1} height={240} renderAnnotationLayer={false} renderTextLayer={false} />
        </Document>
      </div>

      <div className="p-3">
        <div className="font-semibold truncate">{file?.name || "Document.pdf"}</div>
        <div className="text-sm text-gray-500">
          {numPages ? `${numPages} ${numPages > 1 ? "pages" : "page"}` : ""}
        </div>
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button type="button" onClick={onReplace} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">
          Replace
        </button>
        <button type="button" onClick={onRemove} className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm hover:bg-gray-300">
          Remove
        </button>
      </div>
    </div>
  );
};

export default function RequestSignaturesPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    note: "",
    folder: "default",
    recipients: [],
  });

  const [useSigningOrder, setUseSigningOrder] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [contactBook, setContactBook] = useState([]);
  const [signatureElements, setSignatureElements] = useState([]);

  // signer color map
  const [recipientColors, setRecipientColors] = useState({});

  // drag
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });

  // resize
  const [resizingId, setResizingId] = useState(null);
  const [resizeOrigin, setResizeOrigin] = useState({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    type: FIELD_TYPES.TEXT,
  });

  // touch drag
  const [touchDraggedElement, setTouchDraggedElement] = useState(null);

  // send popup/loading
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // draft doc id
  const [draftDocId, setDraftDocId] = useState(null);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------------- normalize positions to 800 canvas ---------------- */
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
        pageWidth = (canvas && canvas.clientWidth) || pageEl.clientWidth || pageWidth;
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
        canvasWidth: pageWidth,
        x: Math.round(localX * s),
        y: Math.round(localY * s),
        ...(el.width != null ? { width: Math.round(Number(el.width) * s) } : {}),
        ...(el.height != null ? { height: Math.round(Number(el.height) * s) } : {}),
      };
    });
  };

  const assignRecipientColors = (recipients) => {
    const signers = (recipients || []).filter((r) => r.willSign === true);
    const map = {};
    signers.forEach((r, i) => (map[r.email] = getSignerColorByIndex(i)));
    setRecipientColors(map);
  };

  /* ---------------- Load contactbook ---------------- */
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

  /* ---------------- RESUME draft if exists ---------------- */
  useEffect(() => {
    const resume = async () => {
      const existingDraftId = localStorage.getItem(ACTIVE_DRAFT_KEY);
      if (!existingDraftId) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const resp = await axios.get(`${BASE_URL}/getSpecificDoc/${existingDraftId}`, {
          headers: { authorization: `Bearer ${token}` },
        });

        const doc = resp?.data?.doc;
        if (!doc || doc.draft !== true) {
          localStorage.removeItem(ACTIVE_DRAFT_KEY);
          return;
        }

        // restore state
        setDraftDocId(doc._id);
        setFormData((prev) => ({
          ...prev,
          title: doc.title || "",
          note: doc.note || "",
          folder: doc.folder || "default",
          recipients: (doc.recipients || []).length ? doc.recipients : (doc.signers || []).map(s => ({
            email: s.email,
            name: s.name,
            phone: s.phone || s.mobile || "",
            willSign: s.willSign !== false,
            order: s.order || 0,
          })),
        }));

        assignRecipientColors(doc.recipients || doc.signers || []);
        setSignatureElements(doc.elements || []);

        // restore file (cloud URL) – react-pdf accepts URL strings too
        setFile(doc.file || null);
        setStep(2);
      } catch (e) {
        console.warn("Draft resume failed:", e?.message);
      }
    };

    resume();
  }, []);

  /* ---------------- AUTOSAVE draft (debounced) ---------------- */
  useEffect(() => {
    if (!draftDocId) return;
    if (step !== 2) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const t = setTimeout(async () => {
      try {
        const elementsToSave = normalizeForPdf(signatureElements);

        await axios.patch(
          `${BASE_URL}/editDocument/${draftDocId}`,
          {
            title: formData.title,
            note: formData.note || "",
            folder: formData.folder || "default",
            recipients: formData.recipients,
            elements: elementsToSave,
            draft: true,
          },
          { headers: { authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.warn("Draft autosave failed:", e?.message);
      }
    }, 800);

    return () => clearTimeout(t);
  }, [draftDocId, step, signatureElements, formData]);

  /* ---------------- File upload ---------------- */
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && /\.pdf$/i.test(selected.name)) {
      setFile(selected);
      setPageNumber(1);
    } else {
      toast.error("Please select a PDF file.", { containerId: "requestSignature" });
    }
  };

  /* ---------------- Draft create after step 1 ---------------- */
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title?.trim()) return toast.error("Please enter document title", { containerId: "requestSignature" });
    if (!file) return toast.error("Please select a document", { containerId: "requestSignature" });
    if (!formData.recipients?.length) return toast.error("Please select recipients", { containerId: "requestSignature" });

    const signerCount = formData.recipients.filter((u) => u.willSign === true).length;
    if (signerCount === 0) return toast.error("Please select at least one signer", { containerId: "requestSignature" });

    // create draft so user doesn’t lose progress
    try {
      const token = localStorage.getItem("token");
      const headers = { headers: { authorization: `Bearer ${token}` } };

      const form = new FormData();
      form.append("document", file);
      form.append("title", formData.title);
      form.append("note", formData.note || "");
      form.append("folder", formData.folder || "default");
      form.append("recipients", JSON.stringify(formData.recipients));
      form.append("elements", JSON.stringify([]));

      const resp = await axios.post(`${BASE_URL}/createDraft`, form, headers);

      const createdId = resp?.data?.doc?._id;
      if (createdId) {
        setDraftDocId(createdId);
        localStorage.setItem(ACTIVE_DRAFT_KEY, createdId);
      }
    } catch (e2) {
      console.warn("Auto draft creation failed, continuing:", e2?.message);
    }

    assignRecipientColors(formData.recipients);
    setStep(2);
  };

  /* ---------------- Recipients ---------------- */
  const addRecipient = () => {
    if (!selectedEmail) return;

    const exists = formData.recipients.some((r) => r.email === selectedEmail);
    if (exists) {
      toast.error("This email has already been added to recipients.", { containerId: "requestSignature" });
      return;
    }

    const contact = contactBook.find((c) => c.email === selectedEmail);
    const nextOrder = useSigningOrder ? formData.recipients.filter((r) => r.willSign).length + 1 : 0;

    setFormData((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        {
          email: selectedEmail,
          name: contact?.name || "",
          phone: contact?.phone || contact?.mobile || "",
          willSign: true,
          ...(useSigningOrder ? { order: nextOrder } : {}),
        },
      ],
    }));

    setSelectedEmail("");
  };

  const addManualRecipient = () => {
    const { newRecipientEmail, newRecipientName, newRecipientPhone, newRecipientAddress } = formData;

    if (!newRecipientName) return toast.error("Please enter signer name", { containerId: "requestSignature" });
    if (!newRecipientEmail) return toast.error("Please enter signer email", { containerId: "requestSignature" });
    if (!newRecipientPhone) return toast.error("Please enter signer phone number", { containerId: "requestSignature" });

    const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
    if (!phoneRegex.test(newRecipientPhone)) {
      toast.error("Please enter a valid phone number", { containerId: "requestSignature" });
      return;
    }

    const nextOrder = useSigningOrder ? formData.recipients.filter((r) => r.willSign).length + 1 : 0;

    setFormData((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        {
          email: newRecipientEmail,
          name: newRecipientName,
          phone: newRecipientPhone,
          address: newRecipientAddress || "",
          willSign: true,
          ...(useSigningOrder ? { order: nextOrder } : {}),
        },
      ],
      newRecipientEmail: "",
      newRecipientName: "",
      newRecipientPhone: "",
      newRecipientAddress: "",
    }));
  };

  const handleChangeSign = (recipient, value) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) =>
        r.email === recipient.email ? { ...r, willSign: value } : r
      ),
    }));
  };

  const removeRecipient = (index) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const moveRecipient = (index, delta) => {
    setFormData((prev) => {
      const arr = [...prev.recipients];
      const to = index + delta;
      if (to < 0 || to >= arr.length) return prev;

      const tmp = arr[index];
      arr[index] = arr[to];
      arr[to] = tmp;

      const resequenced = arr.map((r, i) => (r.willSign ? { ...r, order: i + 1 } : r));
      return { ...prev, recipients: resequenced };
    });
  };

  /* ---------------- Elements: create/delete ---------------- */
  const createPlaceholder = (type, email, x = 50, y = 50, options = {}) => {
    const rec = (formData.recipients || []).find((r) => r.email === email) || {};
    let prefill = "";
    if (type === FIELD_TYPES.NAME && rec.name) prefill = rec.name;
    if (type === FIELD_TYPES.EMAIL && email) prefill = email;
    if (type === FIELD_TYPES.PHONE && rec.phone) prefill = rec.phone;

    const d = defSize(type);
    const label = getRecipientLabel(formData.recipients, email);
    const color = recipientColors[email] || "#64748b";

    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      width: d.w,
      height: d.h,
      pageNumber,
      recipientEmail: email,
      signerLabel: label,
      signerColor: color,
      placeholderText:
        type === FIELD_TYPES.SIGNATURE ? "Signature" :
        type === FIELD_TYPES.NAME ? "Name" :
        type === FIELD_TYPES.EMAIL ? "Email" :
        type === FIELD_TYPES.PHONE ? "Phone" :
        type === FIELD_TYPES.DATE ? "Date" :
        type === FIELD_TYPES.JOB_TITLE ? "Job Title" :
        type === FIELD_TYPES.COMPANY ? "Company" :
        type === FIELD_TYPES.CHECKBOX ? "Checkbox" :
        type === FIELD_TYPES.IMAGE ? "Image" : "Text",
      isPlaceholder: true,
      ...options,
      value: prefill,
    };

    setSignatureElements((prev) => [...prev, newElement]);
  };

  const deleteElement = (id) => setSignatureElements((prev) => prev.filter((el) => el.id !== id));

  /* ---------------- Drag/drop tools ---------------- */
  const handleToolDragStart = (type, email, options = {}) => (e) => {
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

    if (type && email) createPlaceholder(type, email, x, y, options);
  };

  /* ---------------- Touch toolbox ---------------- */
  const handleToolTouchStart = (type, email, options = {}) => (e) => {
    e.preventDefault();
    setTouchDraggedElement({ type, email, options });
  };
  const handleToolTouchMove = (e) => touchDraggedElement && e.preventDefault();
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

  /* ---------------- Dragging elements ---------------- */
  const handleMouseDown = (e, id) => {
    if (e.target?.dataset?.resizer === "true") return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const el = signatureElements.find((s) => s.id === id);
    if (!el) return;
    setPositionOffset({ x: x - el.x, y: y - el.y });
    setDraggedElement(id);
  };

  const handleMouseMove = (e) => {
    // resize first
    if (resizingId && resizeOrigin) {
      const rect = containerRef.current.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dx = curX - resizeOrigin.startX;
      const dy = curY - resizeOrigin.startY;
      const mins = minSize(resizeOrigin.type);

      setSignatureElements((prev) =>
        prev.map((el) =>
          el.id === resizingId
            ? {
                ...el,
                width: Math.max(mins.w, Math.round(resizeOrigin.startW + dx)),
                height: Math.max(mins.h, Math.round(resizeOrigin.startH + dy)),
              }
            : el
        )
      );
      return;
    }

    if (!draggedElement) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - positionOffset.x;
    const y = e.clientY - rect.top - positionOffset.y;

    setSignatureElements((prev) => prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el)));
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizingId(null);
  };

  const startResizeMouse = (e, id, type) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const el = signatureElements.find((s) => s.id === id);
    if (!el) return;

    setResizingId(id);
    setResizeOrigin({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startW: el.width || defSize(type).w,
      startH: el.height || defSize(type).h,
      type,
    });
  };

  /* ---------------- Send flow ---------------- */
  const handleSendRequest = () => {
    const required = formData.recipients.filter((u) => u.willSign === true);
    const ok = required.every((r) => signatureElements.some((el) => el.recipientEmail === r.email));

    if (!ok) {
      toast.error("At least one element should be created for each signer", { containerId: "requestSignature" });
      return;
    }
    setShowSendPopup(true);
  };

  const sendThroughEmail = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const headers = { headers: { authorization: `Bearer ${token}` } };

      // 1) Save final doc as non-draft by calling saveDocument
      const form = new FormData();
      form.append("document", file);
      form.append("title", formData.title);
      form.append("note", formData.note || "");
      form.append("folder", formData.folder || "default");

      const elementsToSave = normalizeForPdf(signatureElements);
      form.append("elements", JSON.stringify(elementsToSave));
      form.append("recipients", JSON.stringify(formData.recipients));

      const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
      const documentId = saveResponse.data.doc._id;

      // 2) Send invitations
      await axios.post(
        `${BASE_URL}/sendSignRequest`,
        {
          ...formData,
          documentId,
          elements: elementsToSave,
          sendInOrder: useSigningOrder,
          recipients: formData.recipients,
        },
        headers
      );

      // 3) Clear active draft pointer
      localStorage.removeItem(ACTIVE_DRAFT_KEY);

      toast.success("Signature request sent", { containerId: "requestSignature" });
      setLoading(false);
      window.location.href = "/admin";
    } catch (e) {
      const msg = e?.response?.data?.error || "Something went wrong please try again";
      toast.error(msg, { containerId: "requestSignature" });
      setLoading(false);
    }
  };

  /* ---------------- Render placeholder box with tooltip + color bar ---------------- */
  const renderFieldPreview = (element) => {
    const w = Math.max(minSize(element.type).w, Math.round(element.width || defSize(element.type).w));
    const h = Math.max(minSize(element.type).h, Math.round(element.height || defSize(element.type).h));
    const color = element.signerColor || recipientColors[element.recipientEmail] || "#64748b";
    const tooltip = element.signerLabel || getRecipientLabel(formData.recipients, element.recipientEmail);

    return (
      <div
        className="border-2 border-dashed cursor-move rounded-sm select-none overflow-hidden relative bg-white"
        style={{
          width: w,
          height: h,
          borderLeft: `8px solid ${color}`,
        }}
        title={tooltip} // ✅ hover shows person name
      >
        <div className="text-xs text-gray-600 p-2">
          {element.placeholderText}
        </div>

        {/* Resize handle */}
        <div
          data-resizer="true"
          onMouseDown={(e) => startResizeMouse(e, element.id, element.type)}
          className="absolute"
          style={{
            right: -6,
            bottom: -6,
            width: 12,
            height: 12,
            background: "#3b82f6",
            border: "2px solid white",
            borderRadius: 2,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.03)",
            cursor: "se-resize",
          }}
          title="Drag to resize"
        />
      </div>
    );
  };

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

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Add documents</label>

                <div className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-4">
                  {file ? (
                    <PdfPreviewCard
                      file={file}
                      onReplace={() => fileInputRef.current?.click()}
                      onRemove={() => setFile(null)}
                    />
                  ) : (
                    <div className="w-[320px] h-[284px] rounded-xl border border-dashed bg-white flex items-center justify-center text-gray-400">
                      No file selected
                    </div>
                  )}

                  <div
                    className="min-h-[284px] rounded-xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center text-center gap-3"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = [...(e.dataTransfer?.files || [])].find((f) => /\.pdf$/i.test(f.name));
                      if (dropped) handleFileChange({ target: { files: [dropped] } });
                    }}
                  >
                    <div className="rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center">
                      <span className="text-gray-600">↥</span>
                    </div>
                    <div className="text-gray-700">Drop your files here or</div>
                    <button type="button" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
                      Upload
                    </button>
                    <input ref={fileInputRef} type="file" hidden accept=".pdf" onChange={handleFileChange} />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-2">PDF only. We’ll show a preview of the first page.</p>
              </div>

              {/* Signing order toggle */}
              <div className="mb-3 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={useSigningOrder}
                    onChange={(e) => setUseSigningOrder(e.target.checked)}
                  />
                  <span className="text-sm font-medium">Set signing order</span>
                </label>
              </div>

              <div className="mb-6">
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

              {/* Recipients */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Add Recipients</h3>

                <div className="flex gap-2 mb-2">
                  <select className="flex-1 p-2 border rounded" value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
                    <option value="">Select recipient</option>
                    {contactBook?.map((c) => (
                      <option key={c?.email} value={c?.email}>
                        {c?.name ? `${c.name} (${c.email})` : c.email}
                      </option>
                    ))}
                  </select>

                  <button type="button" onClick={addRecipient} className="bg-[#29354a] text-white px-4 py-2 rounded" disabled={!selectedEmail}>
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

                  <button
                    type="button"
                    onClick={addManualRecipient}
                    className="w-fit mx-auto bg-[#29354a] text-white px-4 py-2 rounded-[20px] flex"
                  >
                    Add Recipient
                  </button>
                </div>

                {formData.recipients.length > 0 && (
                  <div className="border rounded p-2 mt-4">
                    {formData.recipients.map((recipient, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 last:mb-0 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words">
                            {recipient.name ? `${recipient.name} ` : ""}
                            <span className="text-gray-600">({recipient.email})</span>
                          </p>

                          {useSigningOrder && recipient.willSign && (
                            <p className="text-xs text-purple-700">Order: {recipient.order ?? index + 1}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                          <select
                            onChange={(e) => handleChangeSign(recipient, e.target.value === "true")}
                            value={recipient.willSign ? "true" : "false"}
                            className="border rounded p-1 w-full sm:w-auto"
                          >
                            <option value="true">Needs to Sign</option>
                            <option value="false">Will Receive a Copy</option>
                          </select>

                          {useSigningOrder && recipient.willSign && (
                            <div className="flex items-center gap-1">
                              <button type="button" className="px-2 py-1 border rounded" onClick={() => moveRecipient(index, -1)} title="Move up">
                                ↑
                              </button>
                              <button type="button" className="px-2 py-1 border rounded" onClick={() => moveRecipient(index, +1)} title="Move down">
                                ↓
                              </button>
                            </div>
                          )}

                          <button onClick={() => removeRecipient(index)} className="text-red-500 text-lg">
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="mx-auto flex bg-[#002864] text-white py-2 px-4 rounded-[20px] w-fit">
                Prepare Document
              </button>
            </form>
          </div>
        ) : (
          <div className="flex min-h-screen lg:flex-row flex-col bg-gray-100">
            {/* PDF + overlay */}
            <div
              className="flex-1 p-2 lg:p-4 overflow-auto relative w-full"
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDrop={handleDocumentDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{ touchAction: "none" }}
            >
              <button
                onClick={handleSendRequest}
                className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg"
                disabled={signatureElements.length === 0}
              >
                Send Request
              </button>

              {file ? (
                <div className="w-full">
                  {numPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mb-4 bg-white p-2 rounded shadow sticky top-0 z-40">
                      <button onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))} disabled={pageNumber <= 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
                        Previous
                      </button>
                      <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
                      <button onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))} disabled={pageNumber >= numPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
                        Next
                      </button>
                    </div>
                  )}

                  <Document file={file} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading="Loading PDF...">
                    <Page
                      pageNumber={pageNumber}
                      width={typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 800) : 800}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                  </Document>
                </div>
              ) : null}

              {signatureElements
                .filter((el) => el.pageNumber === pageNumber)
                .map((element) => (
                  <div key={element.id} className="absolute" style={{ left: element.x, top: element.y, zIndex: draggedElement === element.id ? 1000 : 1 }}>
                    <div className="relative" onMouseDown={(e) => handleMouseDown(e, element.id)}>
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

            {/* Right pane recipients — show NAME first */}
            <div className="lg:w-[320px] w-full bg-white p-4 shadow-lg overflow-y-auto sticky top-0 max-h-[calc(100vh-16px)]">
              <h3 className="text-xl font-bold mb-4">Field Types</h3>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Recipients</h4>

                {formData.recipients
                  .filter((u) => u.willSign === true)
                  .map((recipient, idx) => {
                    const color = recipientColors[recipient.email] || getSignerColorByIndex(idx);
                    const display = getRecipientDisplayName(recipient);

                    return (
                      <div key={recipient.email} className="mb-4 border rounded-xl p-3 bg-white shadow-sm" style={{ borderLeft: `8px solid ${color}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <div className="font-semibold break-words">{display}</div>
                        </div>

                        <div className="text-xs text-gray-600 break-all mb-2">{recipient.email}</div>

                        <div className="grid grid-cols-2 gap-2">
                          {Object.values(FIELD_TYPES).map((type) => (
                            <div
                              key={`${type}-${recipient.email}`}
                              className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded"
                              draggable
                              onDragStart={handleToolDragStart(type, recipient.email)}
                              onTouchStart={handleToolTouchStart(type, recipient.email)}
                              onTouchMove={handleToolTouchMove}
                              onTouchEnd={handleToolTouchEnd}
                              title={`Add ${type} for ${display}`}
                            >
                              {{
                                signature: "Signature",
                                initials: "Initials",
                                name: "Name",
                                jobTitle: "Job Title",
                                company: "Company",
                                date: "Date",
                                text: "Text",
                                checkbox: "Checkbox",
                                image: "Image",
                                email: "Email",
                                phone: "Phone",
                              }[type]}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send popup */}
      {showSendPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 text-left">
            <div className="flex justify-between">
              <h3 className="text-xl font-bold mb-4">Send Mail</h3>
              <div className="text-[18px] cursor-pointer" onClick={() => setShowSendPopup(false)}>X</div>
            </div>

            <div className="flex items-center mb-6">
              <button className="bg-[#002864] text-white px-4 w-full py-2 rounded" onClick={sendThroughEmail}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <h3 className="text-2xl font-semibold text-gray-900">Sending Document Invitations</h3>
            <p className="text-sm text-gray-600 mt-1">Please wait…</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
