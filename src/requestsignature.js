// // src/requestsignature.js
// import React, { useEffect, useRef, useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { v4 as uuidv4 } from "uuid";
// import axios from "axios";
// import { BASE_URL } from "./baseUrl";
// import { ToastContainer, toast } from "react-toastify";

// /* ------------------------ PDF worker with fallbacks ----------------------- */
// const WORKERS = [
//   `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
//   `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
//   `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
// ];
// (function setWorker() {
//   let i = 0;
//   const tryNext = () => {
//     if (i < WORKERS.length) {
//       pdfjs.GlobalWorkerOptions.workerSrc = WORKERS[i++];
//     }
//   };
//   tryNext();
// })();

// /* ------------------------------ Builder model ----------------------------- */
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

// const LABELS = {
//   signature: "Signature",
//   initials: "Initials",
//   name: "Name",
//   jobTitle: "Job Title",
//   company: "Company",
//   date: "Date",
//   text: "Text",
//   checkbox: "Checkbox",
//   image: "Image",
//   email: "Email",
//   phone: "Phone",
// };

// /* Canvas the backend expects */
// const VIRTUAL_WIDTH = 800;

// /* Compact defaults for each field */
// const DEFAULT_SIZES = {
//   signature: { w: 160, h: 60 },
//   initials: { w: 90, h: 40 },
//   name: { w: 200, h: 40 },
//   jobTitle: { w: 200, h: 40 },
//   company: { w: 200, h: 40 },
//   date: { w: 120, h: 40 },
//   text: { w: 220, h: 40 },
//   email: { w: 220, h: 40 },
//   phone: { w: 180, h: 40 },
//   image: { w: 160, h: 120 },
//   checkbox: { w: 20, h: 20 },
// };

// /* Palette used for previews */
// const TYPE_CLASSES = {
//   signature: "border-blue-500 bg-blue-50",
//   initials: "border-green-500 bg-green-50",
//   date: "border-purple-500 bg-purple-50",
//   image: "border-indigo-500 bg-indigo-50",
//   checkbox: "border-orange-500 bg-orange-50",
//   text: "border-gray-500 bg-gray-50",
//   name: "border-green-500 bg-green-50",
//   email: "border-yellow-500 bg-yellow-50",
//   jobTitle: "border-pink-500 bg-pink-50",
//   company: "border-indigo-500 bg-indigo-50",
//   phone: "border-gray-500 bg-gray-50",
// };

// /* ======================================================================== */

// const RequestSignaturesPage = () => {
//   /* Step 1 (details) / Step 2 (place fields) */
//   const [step, setStep] = useState(1);

//   /* File & PDF state */
//   const [file, setFile] = useState(null);
//   const [numPages, setNumPages] = useState(1);
//   const [pageNumber, setPageNumber] = useState(1);

//   /* Recipients & form details */
//   const [formData, setFormData] = useState({
//     title: "",
//     note: "",
//     folder: "default",
//     recipients: [],
//   });
//   const [selectedEmail, setSelectedEmail] = useState("");
//   const [contactBook, setContactBook] = useState([]);

//   /* Elements placed on the PDF (positions are RELATIVE to the page overlay) */
//   const [elements, setElements] = useState([]);

//   /* Drag/resize state */
//   const [dragId, setDragId] = useState(null);
//   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
//   const [resizeState, setResizeState] = useState(null); // { id, startX, startY, startW, startH }

//   /* Sending flow */
//   const [showSendPopup, setShowSendPopup] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [isSocial, setIsSocial] = useState(false);
//   const [shareId, setShareId] = useState("");

//   /* Refs */
//   const containerRef = useRef(null);
//   const fileInputRef = useRef(null);

//   /* The measured box of the current PDF page inside the scroll container */
//   const [pageBox, setPageBox] = useState({ left: 0, top: 0, width: VIRTUAL_WIDTH, height: 0 });

//   /* ----------------------------- Data loading ----------------------------- */
//   useEffect(() => {
//     (async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const headers = { headers: { authorization: `Bearer ${token}` } };
//         const res = await axios.get(`${BASE_URL}/fetchContactBooks`, headers);
//         setContactBook(res.data?.contactBooks || []);
//       } catch {
//         toast.error("Something went wrong, please try again", { containerId: "requestSignature" });
//       }
//     })();
//   }, []);

//   /* --------------------------- File & PDF handling ------------------------ */
//   const handleFileChange = (e) => {
//     const selected = e.target.files[0];
//     if (!selected) return;
//     if (!/\.pdf$/i.test(selected.name)) {
//       toast.error("Please select a PDF file.", { containerId: "requestSignature" });
//       return;
//     }
//     setFile(selected);
//     setPageNumber(1);
//     setTimeout(measurePage, 40);
//   };

//   const onPdfLoad = ({ numPages }) => {
//     setNumPages(numPages);
//     setTimeout(measurePage, 40);
//   };

//   const measurePage = () => {
//     const container = containerRef.current;
//     if (!container) return;

//     const selector = `.react-pdf__Page[data-page-number="${pageNumber}"]`;
//     const pageEl = container.querySelector(selector) || document.querySelector(selector);
//     if (!pageEl) return;

//     const contRect = container.getBoundingClientRect();
//     const pageRect = pageEl.getBoundingClientRect();
//     const canvas = pageEl.querySelector("canvas");

//     const width = canvas?.clientWidth || pageRect.width || VIRTUAL_WIDTH;
//     const height = canvas?.clientHeight || pageRect.height || 0;
//     const left = pageRect.left - contRect.left + container.scrollLeft;
//     const top = pageRect.top - contRect.top + container.scrollTop;

//     setPageBox({ left, top, width, height });
//   };

//   useEffect(() => {
//     measurePage();
//   }, [pageNumber, numPages, file]);

//   useEffect(() => {
//     const onResize = () => measurePage();
//     const onScroll = () => measurePage();
//     window.addEventListener("resize", onResize);
//     containerRef.current?.addEventListener("scroll", onScroll);
//     return () => {
//       window.removeEventListener("resize", onResize);
//       containerRef.current?.removeEventListener("scroll", onScroll);
//     };
//   }, [containerRef, pageNumber]);

//   /* ------------------------------- Step flow ------------------------------ */
//   const handleFormSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.title?.trim()) {
//       toast.error("Please enter document title", { containerId: "requestSignature" });
//       return;
//     }
//     if (!file) {
//       toast.error("Please select a document", { containerId: "requestSignature" });
//       return;
//     }
//     if (!formData.recipients?.length) {
//       toast.error("Please select recipients", { containerId: "requestSignature" });
//       return;
//     }
//     if (formData.recipients.filter((u) => u.willSign === true).length === 0) {
//       toast.error("Please select at least one signer", { containerId: "requestSignature" });
//       return;
//     }
//     setStep(2);
//     setTimeout(measurePage, 50);
//   };

//   /* ------------------------------- Recipients ----------------------------- */
//   const handleChangeSign = (recipient, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       recipients: prev.recipients.map((r) =>
//         r.email === recipient.email ? { ...r, willSign: value } : r
//       ),
//     }));
//   };

//   const addRecipient = () => {
//     if (!selectedEmail) return;
//     const exists = formData.recipients.some((r) => r.email === selectedEmail);
//     if (exists) {
//       toast.error("This email has already been added to recipients.", {
//         containerId: "requestSignature",
//       });
//       return;
//     }
//     setFormData((prev) => ({
//       ...prev,
//       recipients: [...prev.recipients, { email: selectedEmail, willSign: true }],
//     }));
//     setSelectedEmail("");
//   };

//   const addManualRecipient = () => {
//     const { newRecipientEmail, newRecipientName, newRecipientPhone, newRecipientAddress } =
//       formData;

//     if (!newRecipientName) {
//       toast.error("Please enter signer name", { containerId: "requestSignature" });
//       return;
//     }
//     if (!newRecipientEmail) {
//       toast.error("Please enter signer email", { containerId: "requestSignature" });
//       return;
//     }
//     if (!newRecipientPhone) {
//       toast.error("Please enter signer phone number", { containerId: "requestSignature" });
//       return;
//     }
//     const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
//     if (!phoneRegex.test(newRecipientPhone)) {
//       toast.error("Please enter a valid phone number", { containerId: "requestSignature" });
//       return;
//     }

//     setFormData((prev) => ({
//       ...prev,
//       recipients: [
//         ...prev.recipients,
//         {
//           email: newRecipientEmail,
//           name: newRecipientName,
//           phone: newRecipientPhone || "",
//           address: newRecipientAddress || "",
//           willSign: true,
//         },
//       ],
//       newRecipientEmail: "",
//       newRecipientName: "",
//       newRecipientPhone: "",
//       newRecipientAddress: "",
//     }));
//   };

//   const removeRecipient = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       recipients: prev.recipients.filter((_, i) => i !== index),
//     }));
//   };

//   /* -------------------------- Toolbox & placement ------------------------- */
//   const toolDragStart = (type, email, options = {}) => (e) => {
//     e.dataTransfer.setData("type", type);
//     e.dataTransfer.setData("email", email);
//     e.dataTransfer.setData("options", JSON.stringify(options));
//   };

//   const toolTouchStart = (type, email, options = {}) => (e) => {
//     e.preventDefault();
//     e.currentTarget.dataset.drag = JSON.stringify({ type, email, options });
//   };
//   const toolTouchEnd = (e) => {
//     const data = e.currentTarget.dataset.drag;
//     if (!data) return;
//     const { type, email, options } = JSON.parse(data);
//     const touch = e.changedTouches[0];
//     const contRect = containerRef.current.getBoundingClientRect();
//     const absX = touch.clientX - contRect.left + containerRef.current.scrollLeft;
//     const absY = touch.clientY - contRect.top + containerRef.current.scrollTop;
//     placeNewElement(type, email, absX, absY, options);
//   };

//   const handleDocumentDrop = (e) => {
//     e.preventDefault();
//     const contRect = containerRef.current.getBoundingClientRect();
//     const absX = e.clientX - contRect.left + containerRef.current.scrollLeft;
//     const absY = e.clientY - contRect.top + containerRef.current.scrollTop;

//     const type = e.dataTransfer.getData("type");
//     const email = e.dataTransfer.getData("email");
//     const options = JSON.parse(e.dataTransfer.getData("options") || "{}");

//     placeNewElement(type, email, absX, absY, options);
//   };

//   const placeNewElement = (type, email, absX, absY, options = {}) => {
//     if (!type || !email) return;
//     // Must be dropped INSIDE the current page box
//     if (
//       absX < pageBox.left ||
//       absY < pageBox.top ||
//       absX > pageBox.left + pageBox.width ||
//       absY > pageBox.top + pageBox.height
//     ) {
//       return;
//     }

//     const { w, h } = DEFAULT_SIZES[type] || { w: 200, h: 40 };
//     // Convert to coordinates relative to the page overlay
//     let x = absX - pageBox.left;
//     let y = absY - pageBox.top;

//     // Clamp inside page
//     x = Math.max(0, Math.min(x, pageBox.width - w));
//     y = Math.max(0, Math.min(y, pageBox.height - h));

//     const rec = (formData.recipients || []).find((r) => r.email === email) || {};
//     const prefill =
//       type === FIELD_TYPES.NAME && rec.name
//         ? rec.name
//         : type === FIELD_TYPES.EMAIL
//         ? email
//         : type === FIELD_TYPES.PHONE && rec.phone
//         ? rec.phone
//         : "";

//     const newEl = {
//       id: uuidv4(),
//       type,
//       pageNumber,
//       x,
//       y,
//       width: options.width || w,
//       height: options.height || h,
//       recipientEmail: email,
//       label: LABELS[type] || type,
//       value: prefill,
//       // mark as overlay-relative for normalization
//       relativeToPage: true,
//     };
//     setElements((prev) => [...prev, newEl]);
//   };

//   const deleteElement = (id) => setElements((prev) => prev.filter((el) => el.id !== id));

//   /* -------------------------- Dragging & resizing ------------------------- */
//   const startDrag = (e, id) => {
//     e.preventDefault();
//     const el = elements.find((s) => s.id === id);
//     if (!el) return;

//     const abs = eventToAbs(e);
//     setDragOffset({ x: abs.x - (pageBox.left + el.x), y: abs.y - (pageBox.top + el.y) });
//     setDragId(id);
//   };

//   const onMouseMove = (e) => {
//     // resize?
//     if (resizeState) {
//       e.preventDefault();
//       const abs = eventToAbs(e);
//       const el = elements.find((s) => s.id === resizeState.id);
//       if (!el) return;

//       let w = Math.max(20, resizeState.startW + (abs.x - resizeState.startX));
//       let h = Math.max(20, resizeState.startH + (abs.y - resizeState.startY));
//       // clamp within page
//       w = Math.min(w, pageBox.width - el.x);
//       h = Math.min(h, pageBox.height - el.y);

//       setElements((prev) =>
//         prev.map((s) => (s.id === resizeState.id ? { ...s, width: w, height: h } : s))
//       );
//       return;
//     }

//     // dragging?
//     if (!dragId) return;
//     const el = elements.find((s) => s.id === dragId);
//     if (!el) return;
//     const abs = eventToAbs(e);
//     let x = abs.x - pageBox.left - dragOffset.x;
//     let y = abs.y - pageBox.top - dragOffset.y;

//     // clamp
//     x = Math.max(0, Math.min(x, pageBox.width - el.width));
//     y = Math.max(0, Math.min(y, pageBox.height - el.height));

//     setElements((prev) => prev.map((s) => (s.id === dragId ? { ...s, x, y } : s)));
//   };

//   const endDragOrResize = () => {
//     setDragId(null);
//     setResizeState(null);
//   };

//   const startResize = (e, id) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const el = elements.find((s) => s.id === id);
//     if (!el) return;
//     const abs = eventToAbs(e);
//     setResizeState({
//       id,
//       startX: abs.x,
//       startY: abs.y,
//       startW: el.width,
//       startH: el.height,
//     });
//   };

//   const eventToAbs = (e) => {
//     const isTouch = !!e.touches?.length || !!e.changedTouches?.length;
//     const point = isTouch ? (e.touches?.[0] || e.changedTouches?.[0]) : e;
//     const contRect = containerRef.current.getBoundingClientRect();
//     const x = point.clientX - contRect.left + containerRef.current.scrollLeft;
//     const y = point.clientY - contRect.top + containerRef.current.scrollTop;
//     return { x, y };
//   };

//   useEffect(() => {
//     const mm = (e) => onMouseMove(e);
//     const mu = () => endDragOrResize();
//     window.addEventListener("mousemove", mm);
//     window.addEventListener("mouseup", mu);
//     window.addEventListener("touchmove", mm, { passive: false });
//     window.addEventListener("touchend", mu);
//     return () => {
//       window.removeEventListener("mousemove", mm);
//       window.removeEventListener("mouseup", mu);
//       window.removeEventListener("touchmove", mm);
//       window.removeEventListener("touchend", mu);
//     };
//   }, [dragId, resizeState, pageBox, elements, dragOffset]);

//   /* ------------------------------- Normalize ------------------------------ */
//   // Convert page-relative positions to backend's 800px coordinate space
//   const normalizeForPdf = (els) => {
//     return (els || []).map((el) => {
//       const selector = `.react-pdf__Page[data-page-number="${el.pageNumber || 1}"]`;
//       const pageEl =
//         containerRef.current?.querySelector(selector) || document.querySelector(selector);
//       const canvas = pageEl?.querySelector("canvas");
//       const pageWidth = canvas?.clientWidth || pageBox.width || VIRTUAL_WIDTH;

//       const s = VIRTUAL_WIDTH / (pageWidth || VIRTUAL_WIDTH);
//       return {
//         ...el,
//         x: Math.round((el.relativeToPage ? el.x : el.x) * s),
//         y: Math.round((el.relativeToPage ? el.y : el.y) * s),
//         width:
//           el.width != null ? Math.round((el.relativeToPage ? el.width : el.width) * s) : undefined,
//         height:
//           el.height != null ? Math.round((el.relativeToPage ? el.height : el.height) * s) : undefined,
//       };
//     });
//   };

//   /* ------------------------------- Sending -------------------------------- */
//   const handleSendRequest = () => {
//     const required = formData.recipients.filter((u) => u.willSign === true);
//     const ok = required.every((r) => elements.some((el) => el.recipientEmail === r.email));
//     if (!ok) {
//       toast.error("At least one field must be placed for each signer", {
//         containerId: "requestSignature",
//       });
//       return;
//     }
//     setShowSendPopup(true);
//   };

//   const sendThroughEmail = async () => {
//     try {
//       setLoading(true);
//       setIsSocial(false);

//       const token = localStorage.getItem("token");
//       const headers = { headers: { authorization: `Bearer ${token}` } };

//       const form = new FormData();
//       form.append("document", file);
//       form.append("title", formData.title);
//       form.append("folder", formData.folder);

//       const elementsToSave = normalizeForPdf(elements);
//       form.append("elements", JSON.stringify(elementsToSave));

//       if (!shareId) {
//         const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
//         await axios.post(
//           `${BASE_URL}/sendSignRequest`,
//           { ...formData, documentId: saveResponse.data.doc._id, elements: elementsToSave },
//           headers
//         );
//       } else {
//         await axios.post(
//           `${BASE_URL}/sendSignRequest`,
//           { ...formData, documentId: shareId, elements: elementsToSave },
//           headers
//         );
//       }

//       toast.success("Signature request sent", { containerId: "requestSignature" });
//       setFile(null);
//       setFormData({ title: "", note: "", folder: "default", recipients: [] });
//       setElements([]);
//       setLoading(false);
//       window.location.reload();
//     } catch (e) {
//       const msg = e?.response?.data?.error || "Something went wrong please try again";
//       toast.error(msg, { containerId: "requestSignature" });
//       setLoading(false);
//       setIsSocial(false);
//     }
//   };

//   const sendThroughShare = async (email) => {
//     try {
//       setLoading(true);
//       setIsSocial(true);

//       let documentId = shareId;

//       if (!shareId) {
//         const token = localStorage.getItem("token");
//         const headers = { headers: { authorization: `Bearer ${token}` } };

//         const form = new FormData();
//         form.append("document", file);
//         form.append("title", formData.title);
//         form.append("folder", formData.folder);

//         const elementsToSave = normalizeForPdf(elements);
//         form.append("elements", JSON.stringify(elementsToSave));

//         const signers = elements
//           .map((v) => ({ email: v.recipientEmail }))
//           .filter((v, i, self) => i === self.findIndex((t) => t.email === v.email));
//         form.append("signers", JSON.stringify(signers));

//         const save = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
//         documentId = save.data.doc._id;
//         setShareId(documentId);
//       }

//       const link = `${window.location.origin}/admin/request-signatures/sign-document/${documentId}?email=${email}`;

//       if (navigator.share) {
//         await navigator.share({ title: "Sign Document", text: "Please sign the document", url: link });
//         toast.success("Signature request sent", { containerId: "requestSignature" });
//       } else {
//         await navigator.clipboard.writeText(link);
//         toast.success("Link copied to clipboard", { containerId: "requestSignature" });
//       }
//     } catch (error) {
//       const msg =
//         error?.name === "AbortError"
//           ? null
//           : error?.response?.data?.error || "Something went wrong, please try again";
//       if (msg) toast.error(msg, { containerId: "requestSignature" });
//     } finally {
//       setLoading(false);
//       setIsSocial(false);
//     }
//   };

//   const sendThroughWPShare = async (email, val) => {
//     try {
//       setLoading(true);
//       setIsSocial(true);

//       let documentId = shareId;

//       if (!shareId) {
//         const token = localStorage.getItem("token");
//         const headers = { headers: { authorization: `Bearer ${token}` } };

//         const form = new FormData();
//         form.append("document", file);
//         form.append("title", formData.title);
//         form.append("folder", formData.folder);

//         const elementsToSave = normalizeForPdf(elements);
//         form.append("elements", JSON.stringify(elementsToSave));

//         const signers = elements
//           .map((v) => ({ email: v.recipientEmail }))
//           .filter((v, i, self) => i === self.findIndex((t) => t.email === v.email));
//         form.append("signers", JSON.stringify(signers));

//         const save = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
//         documentId = save.data.doc._id;
//         setShareId(documentId);
//       }

//       const link = `${window.location.origin}/admin/request-signatures/sign-document/${documentId}?email=${email}`;
//       await axios.post(`${BASE_URL}/sendSignatureLinkToWhatsApp`, { phone: val.phone, link });

//       toast.success("Signature request sent", { containerId: "requestSignature" });
//     } catch (error) {
//       toast.error(error?.response?.data?.error || "Something went wrong, please try again", {
//         containerId: "requestSignature",
//       });
//     } finally {
//       setLoading(false);
//       setIsSocial(false);
//     }
//   };

//   /* ------------------------------ Rendering ------------------------------- */
//   const renderToolItem = (type, email) => (
//     <div
//       key={`${type}-${email}`}
//       className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded select-none"
//       draggable
//       onDragStart={toolDragStart(type, email)}
//       onTouchStart={toolTouchStart(type, email)}
//       onTouchEnd={toolTouchEnd}
//     >
//       {LABELS[type] || type}
//     </div>
//   );

//   const renderFieldPreview = (el) => {
//     const classes = TYPE_CLASSES[el.type] || "border-gray-500 bg-gray-50";
//     return (
//       <div
//         className={`border-2 border-dashed ${classes} relative rounded-sm`}
//         style={{ width: el.width, height: el.height }}
//       >
//         {/* Content */}
//         <div className="w-full h-full">
//           {el.value ? (
//             el.type === FIELD_TYPES.IMAGE ? (
//               <img src={el.value} alt="Uploaded" className="w-full h-full object-contain" />
//             ) : el.type === FIELD_TYPES.CHECKBOX ? (
//               <div className="flex items-center gap-2 p-1">
//                 <input type="checkbox" disabled className="w-4 h-4" />
//                 <span className="text-xs text-gray-600">{LABELS[el.type]}</span>
//               </div>
//             ) : (
//               <div className="text-xs p-1 leading-tight break-words">{el.value}</div>
//             )
//           ) : el.type === FIELD_TYPES.SIGNATURE ? (
//             <div className="w-full h-full flex flex-col items-center justify-center text-xs">
//               <div className="font-semibold">Sign</div>
//               <div aria-hidden="true">🖊️</div>
//             </div>
//           ) : (
//             <div className="text-xs text-gray-500 p-1">{LABELS[el.type]}</div>
//           )}
//         </div>

//         {/* Delete */}
//         <button
//           onClick={() => deleteElement(el.id)}
//           className="absolute -right-3 -top-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
//           title="Remove"
//         >
//           ×
//         </button>

//         {/* Resize handle */}
//         <div
//           onMouseDown={(e) => startResize(e, el.id)}
//           onTouchStart={(e) => startResize(e, el.id)}
//           className="absolute w-3 h-3 bg-blue-600 right-0 bottom-0 translate-x-1/2 translate-y-1/2 rounded-sm cursor-se-resize"
//           title="Resize"
//         />
//       </div>
//     );
//   };

//   return (
//     <>
//       <ToastContainer containerId={"requestSignature"} />

//       <div className="admin-content">
//         {step === 1 ? (
//           /* -------------------------- Step 1: details ------------------------- */
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

//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-2">Upload Document*</label>
//                 <div
//                   className="border-2 border-dashed p-8 text-center cursor-pointer rounded"
//                   onClick={() => fileInputRef.current.click()}
//                 >
//                   {file ? file.name : "Click to choose file or drag and drop"}
//                   <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".pdf" />
//                 </div>
//                 <p className="text-sm text-gray-500 mt-1">PDF only</p>
//               </div>

//               <div className="mb-4">
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
//                 <select
//                   className="w-full p-2 border rounded"
//                   value={formData.folder}
//                   onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
//                 >
//                   <option value="default">Default</option>
//                   <option value="contracts">Contracts</option>
//                   <option value="personal">Personal</option>
//                 </select>
//               </div>

//               <div className="mb-6">
//                 <h3 className="font-medium mb-2">Add Recipients</h3>

//                 <div className="flex gap-2 mb-2">
//                   <select
//                     className="flex-1 p-2 border rounded"
//                     value={selectedEmail}
//                     onChange={(e) => setSelectedEmail(e.target.value)}
//                   >
//                     <option value="">Select recipient email</option>
//                     {contactBook?.map((c) => (
//                       <option key={c?.email} value={c?.email}>
//                         {c?.email}
//                       </option>
//                     ))}
//                   </select>
//                   <button
//                     type="button"
//                     onClick={addRecipient}
//                     className="bg-[#29354a] text-white px-4 py-2 rounded"
//                     disabled={!selectedEmail}
//                   >
//                     Add
//                   </button>
//                 </div>

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

//                 {formData.recipients.length > 0 && (
//                   <div className="border rounded p-2 mt-4">
//                     {formData.recipients.map((recipient, index) => (
//                       <div
//                         key={index}
//                         className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 last:mb-0 gap-2"
//                       >
//                         <div className="flex-1 min-w-0">
//                           <p className="font-medium break-words">
//                             {recipient.name} ({recipient.email})
//                           </p>
//                           {recipient.phone && (
//                             <p className="text-xs text-gray-500 break-words">📞 {recipient.phone}</p>
//                           )}
//                           {recipient.address && (
//                             <p className="text-xs text-gray-500 break-words">📍 {recipient.address}</p>
//                           )}
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

//                           <button onClick={() => removeRecipient(index)} className="text-red-500 text-lg">
//                             ×
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <button
//                 type="submit"
//                 className="mx-auto flex bg-[#002864] text-white py-2 px-4 rounded-[20px] w-fit"
//                 disabled={formData.recipients.length === 0 || !file}
//               >
//                 Prepare Document
//               </button>
//             </form>
//           </div>
//         ) : (
//           /* ----------------------- Step 2: place fields ----------------------- */
//           <div className="flex min-h-screen lg:flex-row flex-col bg-gray-100">
//             {/* Left: PDF + overlay */}
//             <div
//               className="flex-1 p-2 lg:p-4 overflow-auto relative w-full"
//               ref={containerRef}
//               onDrop={handleDocumentDrop}
//               onDragOver={(e) => e.preventDefault()}
//             >
//               <button
//                 onClick={handleSendRequest}
//                 className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg"
//                 disabled={elements.length === 0}
//               >
//                 Send Request
//               </button>

//               {file?.type === "application/pdf" && (
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
//                       <span className="text-sm font-medium">
//                         Page {pageNumber} of {numPages}
//                       </span>
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
//                     onLoadSuccess={onPdfLoad}
//                     onLoadError={() => toast.error("Failed to load PDF", { containerId: "requestSignature" })}
//                     loading="Loading PDF..."
//                     className="w-full"
//                   >
//                     <Page
//                       pageNumber={pageNumber}
//                       width={VIRTUAL_WIDTH} // fixed to match backend coordinate space
//                       className="w-full h-auto"
//                       renderAnnotationLayer={false}
//                       renderTextLayer={false}
//                       onRenderSuccess={measurePage}
//                     />
//                   </Document>

//                   {/* Absolute overlay anchored to the current page box */}
//                   <div
//                     className="absolute z-20"
//                     style={{
//                       left: `${pageBox.left}px`,
//                       top: `${pageBox.top}px`,
//                       width: `${pageBox.width}px`,
//                       height: `${pageBox.height}px`,
//                       pointerEvents: "none", // we enable on children
//                     }}
//                     onMouseMove={onMouseMove}
//                     onMouseUp={endDragOrResize}
//                     onTouchMove={onMouseMove}
//                     onTouchEnd={endDragOrResize}
//                   >
//                     {elements
//                       .filter((el) => el.pageNumber === pageNumber)
//                       .map((el) => (
//                         <div
//                           key={el.id}
//                           className="absolute pointer-events-auto select-none"
//                           style={{
//                             left: `${el.x}px`,
//                             top: `${el.y}px`,
//                             zIndex: dragId === el.id ? 1000 : 1,
//                           }}
//                           onMouseDown={(e) => startDrag(e, el.id)}
//                           onTouchStart={(e) => startDrag(e, el.id)}
//                         >
//                           {renderFieldPreview(el)}
//                         </div>
//                       ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Right: toolbox */}
//             <div className="lg:w-[320px] w-full bg-white p-4 shadow-lg overflow-y-auto sticky top-0 max-h-[calc(100vh-16px)]">
//               <h3 className="text-xl font-bold mb-4">Field Types</h3>

//               <div className="mb-6">
//                 <h4 className="font-medium mb-2">Recipients</h4>
//                 {formData.recipients
//                   .filter((u) => u.willSign === true)
//                   .map((recipient) => (
//                     <div key={recipient.email} className="mb-4 border-b pb-4 last:border-b-0">
//                       <div className="font-medium mb-2 break-all">{recipient.email}</div>
//                       <div className="grid grid-cols-2 gap-2">
//                         {Object.values(FIELD_TYPES).map((t) => renderToolItem(t, recipient.email))}
//                       </div>
//                     </div>
//                   ))}
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
//             <p className="mb-6">Are you sure you want to send out this document for signatures?</p>

//             <div className="flex items-center mb-6">
//               <button className="bg-[#002864] text-white px-4 w-full py-2 rounded" onClick={sendThroughEmail}>
//                 Send
//               </button>
//             </div>

//             <div className="relative mb-6">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-gray-300"></div>
//               </div>
//               <div className="relative flex justify-center">
//                 <span className="bg-white px-2 text-gray-500">OR</span>
//               </div>
//             </div>

//             {formData.recipients
//               .filter((u) => u.willSign === true)
//               .map((val, i) => (
//                 <div key={i} className="flex justify-between items-center">
//                   <div>
//                     <p className="text-gray-600 break-all">{val.email}</p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => sendThroughShare(val.email)}
//                       className="text-blue-600 hover:text-blue-800"
//                       title="Share"
//                     >
//                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
//                         />
//                       </svg>
//                     </button>

//                     <button
//                       onClick={() => sendThroughWPShare(val.email, val)}
//                       className="text-green-600 hover:text-green-800"
//                       title="Share via WhatsApp"
//                     >
//                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
//                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
//                       </svg>
//                     </button>
//                   </div>
//                 </div>
//               ))}
//           </div>
//         </div>
//       )}

//       {/* Loading overlays */}
//       {loading && !isSocial ? (
//         <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
//           <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
//             <div className="flex justify-between items-start mb-6">
//               <h3 className="text-2xl font-semibold text-gray-900">
//                 Sending Document Invitations
//                 <span className="block text-sm font-normal text-gray-500 mt-1">
//                   Server is sending signing invitations to recipients – please wait
//                 </span>
//               </h3>
//             </div>
//             <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
//               <h4 className="font-medium text-blue-800 mb-3">Invitation Process Status</h4>
//               <div className="text-blue-700 space-y-2">
//                 <p>• Secure invitation links being generated</p>
//                 <p>• Email notifications queued for delivery</p>
//                 <p>• Document access permissions being configured</p>
//               </div>
//             </div>
//             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
//               <p className="text-yellow-800 text-sm text-center">
//                 Note: Invitations contain secure links. Recipients will receive emails with signing instructions.
//               </p>
//             </div>
//           </div>
//         </div>
//       ) : loading && isSocial ? (
//         <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
//           <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
//             <div className="flex flex-col items-center mb-6">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//               <h3 className="text-2xl font-semibold text-gray-900 text-center">
//                 Generating Recipient Invitations
//                 <span className="block text-sm font-normal text-gray-500 mt-2">
//                   Please wait while we generate your recipient invitation links
//                 </span>
//               </h3>
//             </div>
//             <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
//               <div className="text-blue-700 space-y-2">
//                 <p>• Securely generating unique signing links for each recipient</p>
//                 <p>• Preparing invitation emails with document access</p>
//                 <p>• Encrypting sensitive document information</p>
//               </div>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//               <p className="text-gray-600 text-sm text-center">
//                 This process typically takes a few seconds. Please do not close this window.
//               </p>
//             </div>
//           </div>
//         </div>
//       ) : null}
//     </>
//   );
// };

// export default RequestSignaturesPage;

// src/requestsignature.js
import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer, toast } from "react-toastify";

// Add this small helper component near the top of requestsignature.js

const PdfPreviewCard = ({ file, onReplace, onRemove }) => {
  const [numPages, setNumPages] = React.useState(null);

  return (
    <div className="w-[320px] bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="h-[220px] flex items-center justify-center bg-gray-50">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => {}}
          loading={<div className="text-sm text-gray-500">Generating preview…</div>}
        >
          <Page
            pageNumber={1}
            width={280}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      </div>

      <div className="p-3">
        <div className="font-semibold truncate">{file?.name || "Document.pdf"}</div>
        <div className="text-sm text-gray-500">{numPages ? `${numPages} ${numPages > 1 ? "pages" : "page"}` : ""}</div>
      </div>

      <div className="px-3 pb-3 flex gap-2">
        <button
          type="button"
          onClick={onReplace}
          className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm hover:bg-gray-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
};


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
    recipients: [],      // [{email, name?, phone?, willSign, order?}]
  });
  const [useSigningOrder, setUseSigningOrder] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [contactBook, setContactBook] = useState([]);
  const [signatureElements, setSignatureElements] = useState([]);

  // Dragging/positioning for fields
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });

  // Toolbox touch drag
  const [touchDraggedElement, setTouchDraggedElement] = useState(null);

  // Send flow
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSocial, setIsSocial] = useState(false);
  const [shareId, setShareId] = useState("");

  // Refs
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ---------- Helpers ---------- */

  // normalize absolute positions to the 800px PDF canvas
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
        x: Math.round(localX * s),
        y: Math.round(localY * s),
        ...(el.width != null ? { width: Math.round(Number(el.width) * s) } : {}),
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
    // When turning on signing order, seed order values by current list order
    if (useSigningOrder) {
      setFormData((prev) => ({
        ...prev,
        recipients: prev.recipients.map((r, i) =>
          r.willSign ? { ...r, order: (r.order ?? i + 1) } : r
        ),
      }));
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

  /* ---------- Toolbox (touch) ---------- */
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

  /* ---------- Placed elements: mouse/touch drag ---------- */
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
  const handleElementTouchMove = (e) => {
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
  const handleElementTouchEnd = () => setDraggedElement(null);

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
    if (!draggedElement) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - positionOffset.x;
    const y = e.clientY - rect.top - positionOffset.y;
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === draggedElement ? { ...el, x, y } : el))
    );
  };
  const handleMouseUp = () => setDraggedElement(null);

  /* ---------- Recipients ---------- */
  const handleChangeSign = (recipient, value) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) =>
        r.email === recipient.email ? { ...r, willSign: value } : r
      ),
    }));
  };

  // Reorder helpers when signing order is enabled
  const moveRecipient = (index, delta) => {
    setFormData((prev) => {
      const arr = [...prev.recipients];
      const to = index + delta;
      if (to < 0 || to >= arr.length) return prev;
      const tmp = arr[index];
      arr[index] = arr[to];
      arr[to] = tmp;
      // recompute order values only for signers
      const recomputed = arr.map((r, i) =>
        r.willSign ? { ...r, order: i + 1 } : r
      );
      return { ...prev, recipients: recomputed };
    });
  };

  const addRecipient = () => {
    if (!selectedEmail) return;
    const exists = formData.recipients.some((r) => r.email === selectedEmail);
    if (exists) {
      toast.error("This email has already been added to recipients.", {
        containerId: "requestSignature",
      });
      return;
    }
    setFormData((prev) => {
      const nextOrder =
        useSigningOrder && prev.recipients.filter((r) => r.willSign).length + 1;
      return {
        ...prev,
        recipients: [
          ...prev.recipients,
          { email: selectedEmail, willSign: true, ...(useSigningOrder ? { order: nextOrder } : {}) },
        ],
      };
    });
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

    setFormData((prev) => {
      const nextOrder = useSigningOrder && prev.recipients.filter((r) => r.willSign).length + 1;
      return {
        ...prev,
        recipients: [
          ...prev.recipients,
          {
            email: newRecipientEmail,
            name: newRecipientName,
            phone: newRecipientPhone || "",
            address: newRecipientAddress || "",
            willSign: true,
            ...(useSigningOrder ? { order: nextOrder } : {}),
          },
        ],
        newRecipientEmail: "",
        newRecipientName: "",
        newRecipientPhone: "",
        newRecipientAddress: "",
      };
    });
  };

  const removeRecipient = (index) => {
    setFormData((prev) => {
      const arr = prev.recipients.filter((_, i) => i !== index);
      // re-sequence order if enabled
      const resequenced = useSigningOrder
        ? arr.map((r, i) => (r.willSign ? { ...r, order: i + 1 } : r))
        : arr;
      return { ...prev, recipients: resequenced };
    });
  };

  /* ---------- Elements ---------- */
  const createPlaceholder = (type, email, x = 50, y = 50, options = {}) => {
    const rec = (formData.recipients || []).find((r) => r.email === email) || {};
    let prefill = "";
    if (type === FIELD_TYPES.NAME && rec.name) prefill = rec.name;
    if (type === FIELD_TYPES.EMAIL && email) prefill = email;
    if (type === FIELD_TYPES.PHONE && rec.phone) prefill = rec.phone;
    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      pageNumber,
      recipientEmail: email,
      placeholderText:
        type === FIELD_TYPES.SIGNATURE
          ? "Sign"
          : type === FIELD_TYPES.NAME
          ? "Name"
          : type === FIELD_TYPES.EMAIL
          ? "Email"
          : type === FIELD_TYPES.PHONE
          ? "Phone"
          : type === FIELD_TYPES.DATE
          ? "Date"
          : type === FIELD_TYPES.JOB_TITLE
          ? "Job Title"
          : type === FIELD_TYPES.COMPANY
          ? "Company"
          : type === FIELD_TYPES.CHECKBOX
          ? "Checkbox"
          : type === FIELD_TYPES.IMAGE
          ? "Image"
          : "Text",
      isPlaceholder: true,
      ...options,
      value: prefill,
    };
    setSignatureElements((prev) => [...prev, newElement]);
  };

  const deleteElement = (id) => {
    setSignatureElements((prev) => prev.filter((el) => el.id !== id));
  };

  /* ---------- Toolbox drag & drop ---------- */
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

    if (type && email) {
      createPlaceholder(type, email, x, y, options);
    }
  };

  /* ---------- Send flow ---------- */
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
    if (useSigningOrder) {
      const missingOrder = required.some((r) => !Number.isInteger(r.order));
      if (missingOrder) {
        toast.error("Please set an order for each signer", { containerId: "requestSignature" });
        return;
      }
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

      // Persist document first (creates the doc id)
      let documentId = shareId;
      if (!documentId) {
        const saveResponse = await axios.post(`${BASE_URL}/saveDocument`, form, headers);
        documentId = saveResponse.data.doc._id;
        setShareId(documentId);
      }

      // Prepare recipients payload including order if enabled
      const recipients = formData.recipients.map((r, idx) => ({
        ...r,
        ...(useSigningOrder && r.willSign ? { order: r.order ?? idx + 1 } : {}),
      }));

      await axios.post(
        `${BASE_URL}/sendSignRequest`,
        {
          ...formData,
          documentId,
          elements: elementsToSave,
          sendInOrder: useSigningOrder,
          recipients,
        },
        headers
      );

      toast.success("Signature request sent", { containerId: "requestSignature" });
      setFile(null);
      setFormData({ title: "", note: "", folder: "default", recipients: [] });
      setSignatureElements([]);
      setLoading(false);
      window.location.reload();
    } catch (e) {
      const msg = e?.response?.data?.error || "Something went wrong please try again";
      toast.error(msg, { containerId: "requestSignature" });
      setLoading(false);
      setIsSocial(false);
    }
  };

  /* ---------- Render helpers ---------- */
  const renderFieldPreview = (element) => {
    const baseClasses =
      "border-2 border-dashed p-2 cursor-move min-w-[100px] min-h-[40px]";
    const typeClasses = {
      [FIELD_TYPES.SIGNATURE]: "border-blue-500 bg-blue-50",
      [FIELD_TYPES.INITIALS]: "border-green-500 bg-green-50",
      [FIELD_TYPES.DATE]: "border-purple-500 bg-purple-50",
      [FIELD_TYPES.IMAGE]: "border-indigo-500 bg-indigo-50",
      [FIELD_TYPES.CHECKBOX]: "border-orange-500 bg-orange-50",
    };

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
        return <div className="text-sm mt-1 break-words">{element.value}</div>;
      }
      if (element.type === FIELD_TYPES.CHECKBOX) {
        return (
          <div className="flex items-center gap-2">
            <input type="checkbox" disabled className="w-4 h-4" />
            <span className="text-xs text-gray-500">{element.placeholderText}</span>
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
      <div className={`${baseClasses} ${typeClasses[element.type] || "border-gray-500 bg-gray-50"}`}>
        {content()}
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
        className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded"
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

  /* ---------- Render ---------- */
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
                  {/* Left: preview card (only if a file is selected) */}
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

                  {/* Right: dropzone */}
                  <div
                    className="min-h-[284px] rounded-xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center text-center gap-3"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = [...(e.dataTransfer?.files || [])].find(f => /\.pdf$/i.test(f.name));
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


              {/* Signing order toggle like DocuSign */}
              <div className="mb-3 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={useSigningOrder}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseSigningOrder(checked);
                      if (checked) {
                        // seed order
                        setFormData((prev) => ({
                          ...prev,
                          recipients: prev.recipients.map((r, i) =>
                            r.willSign ? { ...r, order: (r.order ?? i + 1) } : r
                          ),
                        }));
                      } else {
                        // remove order props
                        setFormData((prev) => ({
                          ...prev,
                          recipients: prev.recipients.map((r) => {
                            const { order, ...rest } = r;
                            return rest;
                          }),
                        }));
                      }
                    }}
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
                            {recipient.name ? `${recipient.name} ` : ""}({recipient.email})
                          </p>
                          {useSigningOrder && recipient.willSign && (
                            <p className="text-xs text-purple-700">Order: {recipient.order ?? index + 1}</p>
                          )}
                          {recipient.phone && (
                            <p className="text-xs text-gray-500 break-words">📞 {recipient.phone}</p>
                          )}
                          {recipient.address && (
                            <p className="text-xs text-gray-500 break-words">📍 {recipient.address}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                          <select
                            onChange={(e) => handleChangeSign(recipient, e.target.value === "true")}
                            value={recipient.willSign ? true : false}
                            className="border rounded p-1 w-full sm:w-auto"
                          >
                            <option value="true">Needs to Sign</option>
                            <option value="false">Will Receive a Copy</option>
                          </select>

                          {useSigningOrder && recipient.willSign && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="px-2 py-1 border rounded"
                                onClick={() => moveRecipient(index, -1)}
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="px-2 py-1 border rounded"
                                onClick={() => moveRecipient(index, +1)}
                                title="Move down"
                              >
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
          <div className="flex min-h-screen lg:flex-row flex-col bg-gray-100">
            {/* PDF + canvas */}
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
              ) : null}

              {signatureElements
                .filter((el) => el.pageNumber === pageNumber)
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      zIndex: draggedElement === element.id ? 1000 : 1,
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

            {/* Right pane */}
            <div className="lg:w-[320px] w-full bg-white p-4 shadow-lg overflow-y-auto sticky top-0 max-h-[calc(100vh-16px)]">
              <h3 className="text-xl font-bold mb-4">Field Types</h3>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Recipients</h4>
                {formData.recipients
                  .filter((u) => u.willSign === true)
                  .map((recipient) => (
                    <div key={recipient.email} className="mb-4 border-b pb-4 last:border-b-0">
                      <div className="font-medium mb-2 break-all">
                        {recipient.email}
                        {useSigningOrder && <span className="text-xs text-purple-700 ml-2">Order: {recipient.order}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(FIELD_TYPES).map((type) => renderToolItem(type, recipient.email))}
                      </div>
                    </div>
                  ))}
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
            <p className="mb-6">
              {useSigningOrder
                ? "Invitations will be sent in the specified order."
                : "All signers will be invited immediately."}
            </p>

            <div className="flex items-center mb-6">
              <button className="bg-[#002864] text-white px-4 w-full py-2 rounded" onClick={sendThroughEmail}>
                Send
              </button>
            </div>
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
          </div>
        </div>
      ) : null}
    </>
  );
};

export default RequestSignaturesPage;
