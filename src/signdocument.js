// // src/signdocument.js
// import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import DatePicker from "react-datepicker";
// import { useLocation, useParams } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "./baseUrl";
// import { toast, ToastContainer } from "react-toastify";

// /* ------------------------ PDF worker with fallbacks ----------------------- */
// const PDF_WORKER_URLS = [
//   `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
//   `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
//   `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
// ];
// const setPDFWorker = () => {
//   let idx = 0;
//   const tryWorker = () => {
//     if (idx < PDF_WORKER_URLS.length) {
//       pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URLS[idx];
//       idx++;
//     }
//   };
//   tryWorker();
//   return tryWorker;
// };
// const tryNextWorker = setPDFWorker();

// /* ------------------------------ UI constants ------------------------------ */
// const CONTACT_LABEL = { name: "Name", email: "Email", phone: "Phone" };
// const VIRTUAL_WIDTH = 800; // must match builder/backend

// // === Brand colors (from your site icon) =====================================
// const BRAND = {
//   from: "#7E3FF2",   // main purple
//   to:   "#D65BFF",   // magenta accent (for a soft gradient)
//   glow: "rgba(126, 63, 242, 0.32)", // shadow/glow around arrow & pills
// };
// const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND.from} 0%, ${BRAND.to} 100%)`;


// // Default box sizes (align with backend DEFAULT_BOXES)
// const SIG_W = 160, SIG_H = 60;
// const TXT_W = 140, TXT_H = 40;
// const DATE_W = 120, DATE_H = 40;

// const SIGNATURE_BLUE = "#1a73e8";
// const MIN_WIDTH = 0.8, MAX_WIDTH = 2.6, SMOOTHING = 0.85, VELOCITY_FILTER = 0.7;

// // Indicator styles
// const ARROW_RADIUS = 18;      // px
// const INDENT = 8;             // gap between arrow and field
// const HILITE_PAD = 6;         // extra rectangle padding around field

// /* ------------------------------ Date helpers ------------------------------ */
// const toISODate = (d = new Date()) => {
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// };
// const parseISODateToLocal = (iso) => {
//   if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date();
//   return new Date(`${iso}T12:00:00Z`);
// };
// const formatLocalDate = (iso, locale, timeZone) => {
//   try {
//     const dt = parseISODateToLocal(iso);
//     return new Intl.DateTimeFormat(locale || undefined, {
//       timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).format(dt);
//   } catch {
//     return iso;
//   }
// };

// /* --------------------------- Recipient resolution -------------------------- */
// function resolveCurrentRecipient(signingData = {}) {
//   const inviteEmail =
//     (signingData.queryEmail ||
//       signingData.recipientEmail ||
//       signingData.signerEmail ||
//       signingData.email ||
//       (signingData.user && signingData.user.email) ||
//       "") + "";

//   if (Array.isArray(signingData.recipients) && inviteEmail) {
//     const match = signingData.recipients.find(
//       (r) => (r.email || "").toLowerCase() === inviteEmail.toLowerCase()
//     );
//     if (match) return match;
//   }
//   if (Array.isArray(signingData.recipients) && signingData.recipients.length === 1) {
//     return signingData.recipients[0];
//   }
//   return {
//     email: inviteEmail || undefined,
//     name:
//       (signingData.user && signingData.user.name) ||
//       (signingData.profile && signingData.profile.name) ||
//       undefined,
//     phone:
//       (signingData.user &&
//         (signingData.user.phone || signingData.user.mobile || signingData.user.phoneNumber)) ||
//       (signingData.profile && (signingData.profile.phone || signingData.profile.mobile)) ||
//       undefined,
//   };
// }

// /* ---------------------- Elements cleanup + prefilling ---------------------- */
// function sanitizeIncomingElements(elements = []) {
//   return elements.map((el) => {
//     const type = el.type;
//     const cleanLabel = type === "signature" ? "Sign" : CONTACT_LABEL[type] || el.type;
//     const pageNumber = el.pageNumber || 1;

//     const defaults =
//       type === "signature" || type === "initials" || type === "stamp" || type === "image"
//         ? { width: SIG_W, height: SIG_H }
//         : type === "date"
//         ? { width: DATE_W, height: DATE_H }
//         : { width: TXT_W, height: TXT_H };

//     return {
//       ...el,
//       id: el._id || Math.random().toString(36).slice(2),
//       label: cleanLabel,
//       value: el.value ?? null,
//       pageNumber,
//       width: Number(el.width ?? defaults.width),
//       height: Number(el.height ?? defaults.height),
//       fontSize: el.fontSize ?? (type === "signature" ? 16 : 14),
//     };
//   });
// }

// function prefillForRecipient(elements = [], recipient = {}) {
//   if (!elements.length || !recipient) return elements;
//   const rEmail = (recipient.email || "").toLowerCase();
//   const rName = recipient.name || "";
//   const rPhone = recipient.phone || recipient.mobile || recipient.phoneNumber || "";
//   const todayISO = toISODate(new Date());

//   return elements.map((el) => {
//     const assignedEmail = (el.recipientEmail || "").toLowerCase();
//     const sameRecipient = !assignedEmail || (rEmail && assignedEmail === rEmail);
//     if (!sameRecipient) return el;

//     const hasValue = el.value != null && String(el.value).trim() !== "";
//     if (hasValue) return el;

//     if (el.type === "name" && rName) return { ...el, value: rName };
//     if (el.type === "email" && rEmail) return { ...el, value: recipient.email };
//     if (el.type === "phone" && rPhone) return { ...el, value: rPhone };
//     if (el.type === "date") return { ...el, value: todayISO };
//     return el;
//   });
// }

// /* --------------------------- Signing order helpers ------------------------- */
// function computeSigningOrderMeta(doc, myEmail) {
//   const uses = !!doc?.sendInOrder;
//   const signers = Array.isArray(doc?.signers) ? doc.signers : [];
//   const mySigner = signers.find(
//     (s) => (s.email || "").toLowerCase() === (myEmail || "").toLowerCase()
//   );
//   const myOrder = mySigner ? Number(mySigner.order) || 1 : undefined;
//   const currentOrder = uses ? Number(doc?.currentOrder) || 1 : undefined;
//   const canSign =
//     !uses || (myOrder !== undefined && currentOrder !== undefined && myOrder === currentOrder);

//   const waiting =
//     uses && myOrder
//       ? signers
//           .filter(
//             (s) =>
//               (Number(s.order) || 1) < myOrder && !s.signed && !s.declined && s.willSign !== false
//           )
//           .map((s) => s.email)
//       : [];

//   return { uses, myOrder, currentOrder, canSign, waiting, mySigner };
// }

// /* ---------------------------- Client audit meta ---------------------------- */
// const buildClientMeta = () =>
//   new Promise((resolve) => {
//     const meta = {
//       clientSignedAt: new Date().toISOString(),
//       clientLocale: navigator.language || "en-US",
//       clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
//     };
//     if (!navigator.geolocation) return resolve(meta);
//     navigator.geolocation.getCurrentPosition(
//       (pos) =>
//         resolve({
//           ...meta,
//           coords: {
//             lat: pos.coords.latitude,
//             lon: pos.coords.longitude,
//             accuracy: pos.coords.accuracy,
//           },
//         }),
//       () => resolve(meta),
//       { maximumAge: 60000, timeout: 2000 }
//     );
//   });

// /* ================================= Component ================================ */

// const SignDocumentPage = () => {
//   const { documentId } = useParams();
//   const location = useLocation();

//   // data
//   const [documentData, setDocumentData] = useState(null);
//   const [currentProfile, setCurrentProfile] = useState(null);
//   const [preference, setPreference] = useState({});
//   const [currentUser, setCurrentUser] = useState(null);

//   // signing order UI state
//   const [orderInfo, setOrderInfo] = useState({
//     uses: false,
//     myOrder: undefined,
//     currentOrder: undefined,
//     canSign: true,
//     waiting: [],
//     mySigner: null,
//   });

//   // ui state
//   const [file, setFile] = useState(null);
//   const [numPages, setNumPages] = useState(1);
//   const [pageNumber, setPageNumber] = useState(1);
//   const [pageHeight, setPageHeight] = useState(null);

//   const [signatureElements, setSignatureElements] = useState([]);
//   const [activeElement, setActiveElement] = useState(null);
//   const [inputValue, setInputValue] = useState("");
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [signatureType, setSignatureType] = useState();
//   const [loading, setLoading] = useState(false);

//   const [loadingError, setLoadingError] = useState(null);
//   const [pdfLoadError, setPdfLoadError] = useState(null);

//   // drawing
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [canvasContext, setCanvasContext] = useState(null);
//   const canvasRef = useRef(null);

//   // containers
//   const pageWrapRef = useRef(null);  // wraps a single Page
//   const overlayRef = useRef(null);   // absolute overlay that matches the PDF canvas

//   /* ---------------------------- Load document ---------------------------- */
//   const reloadDocument = async () => {
//     try {
//       const params = new URLSearchParams(location.search);
//       const queryEmail = (params.get("email") || "").trim();

//       // Ensure a token exists for the invite email
//       let token = localStorage.getItem("token");
//       let me;

//       if (token) {
//         const res = await axios.get(`${BASE_URL}/getUser`, {
//           headers: { authorization: `Bearer ${token}` },
//         });
//         me = res.data;
//         if (queryEmail && (res.data?.user?.email || "").toLowerCase() !== queryEmail.toLowerCase()) {
//           const auth = await axios.post(`${BASE_URL}/registerAndLogin`, { email: queryEmail });
//           localStorage.setItem("token", auth.data.token);
//           token = auth.data.token;
//           me = auth.data;
//         }
//       } else {
//         const auth = await axios.post(`${BASE_URL}/registerAndLogin`, { email: queryEmail });
//         localStorage.setItem("token", auth.data.token);
//         token = auth.data.token;
//         me = auth.data;
//       }

//       setCurrentUser(me.user);
//       setPreference(me.preference);
//       setCurrentProfile(me.profile);

//       // Fetch document and prepare elements for this recipient
//       const docRes = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`);
//       const doc = docRes.data.doc || {};
//       setDocumentData(doc);
//       setFile(doc.file);

//       // compute signing order info (if enabled)
//       const info = computeSigningOrderMeta(doc, queryEmail || me?.user?.email || "");
//       setOrderInfo(info);

//       const signingContext = {
//         recipients: doc.recipients || [],
//         queryEmail,
//         user: me.user,
//         profile: me.profile,
//       };

//       const recipient = resolveCurrentRecipient(signingContext);
//       const sanitized = sanitizeIncomingElements(doc.elements || []);
//       const prefilled = prefillForRecipient(sanitized, recipient);

//       setSignatureElements(prefilled);
//     } catch (err) {
//       console.error("Load error:", err);
//       setLoadingError("Failed to load document");
//     }
//   };

//   useEffect(() => {
//     reloadDocument();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [documentId, location.search]);

//   /* ------------------------ Signature drawing setup ----------------------- */
//   useEffect(() => {
//     if (canvasRef.current && activeElement?.type === "signature" && signatureType === "draw") {
//       const ctx = canvasRef.current.getContext("2d");
//       ctx.lineWidth = MAX_WIDTH;
//       ctx.lineCap = "round";
//       ctx.lineJoin = "round";
//       ctx.strokeStyle = SIGNATURE_BLUE;
//       setCanvasContext(ctx);
//       if (currentProfile?.signature) {
//         const img = new Image();
//         img.onload = () => ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
//         img.src = currentProfile.signature;
//       }
//     }
//   }, [activeElement, signatureType, currentProfile]);

//   /* ----------------------------- PDF handlers ----------------------------- */
//   const onDocumentLoadSuccess = ({ numPages }) => {
//     setNumPages(numPages);
//     setPdfLoadError(null);
//   };
//   const onDocumentLoadError = (error) => {
//     console.error("PDF loading error:", error);
//     if (error.name === "MissingPDFException" || error.message?.includes("worker")) {
//       tryNextWorker();
//       setTimeout(() => setFile((prev) => prev), 100);
//     } else {
//       setPdfLoadError(`Failed to load PDF: ${error.message || "Unknown error"}`);
//     }
//   };

//   // When a page finishes rendering, measure its height so our overlay matches exactly.
//   const handlePageRenderSuccess = (page) => {
//     try {
//       const scale = VIRTUAL_WIDTH / page.view[2];
//       const vp = page.getViewport({ scale });
//       setPageHeight(vp.height);
//     } catch {
//       const canvas = pageWrapRef.current?.querySelector(".react-pdf__Page__canvas");
//       if (canvas) setPageHeight(canvas.height || canvas.offsetHeight || null);
//     }
//   };

//   /* ------------------------------ Utilities ------------------------------- */
//   const validateAndFixPDFUrl = (url) => {
//     if (!url) return null;
//     if (url.startsWith("/")) return `${BASE_URL}${url}`;
//     if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) return `https://${url}`;
//     return url;
//   };

//   // drawing helpers
//   const lastPointRef = useRef(null);
//   const lastTimeRef = useRef(0);
//   const lineWidthRef = useRef(MAX_WIDTH);

//   const startDrawing = (e) => {
//     if (!activeElement || !canvasRef.current || !canvasContext) return;
//     e.preventDefault();
//     const rect = canvasRef.current.getBoundingClientRect();
//     const p = e.touches?.[0]
//       ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
//       : { x: e.clientX - rect.left, y: e.clientY - rect.top };
//     lastPointRef.current = p;
//     lastTimeRef.current = performance.now();
//     lineWidthRef.current = MAX_WIDTH;
//     canvasContext.beginPath();
//     canvasContext.moveTo(p.x, p.y);
//     setIsDrawing(true);
//   };
//   const draw = (e) => {
//     if (!isDrawing || !canvasContext) return;
//     e.preventDefault();
//     const rect = canvasRef.current.getBoundingClientRect();
//     const p = e.touches?.[0]
//       ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
//       : { x: e.clientX - rect.left, y: e.clientY - rect.top };
//     const now = performance.now();
//     const dt = Math.max(now - lastTimeRef.current, 1);
//     const lp = lastPointRef.current;
//     const dx = p.x - lp.x, dy = p.y - lp.y;
//     const dist = Math.hypot(dx, dy);
//     const velocity = dist / dt;
//     const targetWidth = Math.max(MAX_WIDTH / (velocity * VELOCITY_FILTER + 1), MIN_WIDTH);
//     const newWidth = lineWidthRef.current * SMOOTHING + targetWidth * (1 - SMOOTHING);

//     canvasContext.strokeStyle = SIGNATURE_BLUE;
//     canvasContext.lineCap = "round";
//     canvasContext.lineJoin = "round";
//     canvasContext.lineWidth = newWidth;

//     canvasContext.beginPath();
//     canvasContext.moveTo(lp.x, lp.y);
//     canvasContext.lineTo(p.x, p.y);
//     canvasContext.stroke();

//     lineWidthRef.current = newWidth;
//     lastPointRef.current = p;
//     lastTimeRef.current = now;
//   };
//   const stopDrawing = () => {
//     if (!isDrawing) return;
//     canvasContext?.closePath();
//     setIsDrawing(false);
//     lastPointRef.current = null;
//   };
//   const handleClearCanvas = () => {
//     if (!canvasRef.current || !canvasContext) return;
//     canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
//   };

//   /* -------------------------- Required‑field list -------------------------- */
//   const isMine = (el) =>
//     (el.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase();

//   const todos = useMemo(() => {
//     const pending = signatureElements.filter((el) => isMine(el) && !el.value);
//     // deterministic order across pages/top->bottom->left
//     return pending.sort((a, b) =>
//       a.pageNumber !== b.pageNumber
//         ? a.pageNumber - b.pageNumber
//         : a.y !== b.y
//         ? a.y - b.y
//         : a.x - b.x
//     );
//   }, [signatureElements, currentUser]);

//   // currently selected "required" field (by index into todos)
//   const [todoIndex, setTodoIndex] = useState(null);

//   // After elements load, auto‑select first required and jump to its page
//   useEffect(() => {
//     if (!orderInfo.canSign) {
//       setTodoIndex(null);
//       return;
//     }
//     if (todos.length === 0) {
//       setTodoIndex(null);
//       return;
//     }
//     // If we don't already point to a valid item, point to the first and change page.
//     if (todoIndex == null || !todos[todoIndex]) {
//       setTodoIndex(0);
//       setPageNumber(todos[0].pageNumber);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [todos.length, orderInfo.canSign]);

//   /* --------------------- Indicator position via DOM rect -------------------- */
//   const [indicator, setIndicator] = useState({
//     visible: false,
//     top: 0,
//     left: 0,
//     side: "left", // left | right
//     hilite: { top: 0, left: 0, width: 0, height: 0 },
//   });

//   const activeTodoId = useMemo(() => (todos[todoIndex]?.id ?? null), [todos, todoIndex]);

//   // Measure the actual DOM box of the active field and position the indicator
//   const updateIndicator = React.useCallback(() => {
//     const overlay = overlayRef.current;
//     if (!overlay || !activeTodoId || !orderInfo.canSign) {
//       setIndicator((s) => ({ ...s, visible: false }));
//       return;
//     }

//     const fieldNode = overlay.querySelector(`[data-field-id="${activeTodoId}"]`);
//     if (!fieldNode) {
//       setIndicator((s) => ({ ...s, visible: false }));
//       return;
//     }

//     const oRect = overlay.getBoundingClientRect();
//     const fRect = fieldNode.getBoundingClientRect();

//     // Highlight rectangle padded a bit
//     const hLeft = Math.max(0, fRect.left - oRect.left - HILITE_PAD);
//     const hTop = Math.max(0, fRect.top - oRect.top - HILITE_PAD);
//     const hW = Math.min(oRect.width, fRect.width + HILITE_PAD * 2);
//     const hH = Math.min(oRect.height, fRect.height + HILITE_PAD * 2);

//     // Place the arrow to the left if there's room; otherwise to the right
//     const roomLeft = hLeft >= ARROW_RADIUS * 2 + INDENT;
//     const side = roomLeft ? "left" : "right";
//     const arrowLeft =
//       side === "left"
//         ? hLeft - ARROW_RADIUS * 2 - INDENT
//         : Math.min(oRect.width - ARROW_RADIUS * 2, hLeft + hW + INDENT);
//     const arrowTop = Math.max(
//       0,
//       Math.min(oRect.height - ARROW_RADIUS * 2, hTop + hH / 2 - ARROW_RADIUS)
//     );

//     setIndicator({
//       visible: true,
//       top: arrowTop,
//       left: arrowLeft,
//       side,
//       hilite: { top: hTop, left: hLeft, width: hW, height: hH },
//     });

//     // Ensure the field is visible vertically
//     fieldNode.scrollIntoView({ behavior: "smooth", block: "center" });
//   }, [activeTodoId, orderInfo.canSign]);

//   // Reposition indicator when:
//   //  - page renders (pageHeight changes)
//   //  - page number changes
//   //  - active todo changes
//   //  - window resizes or container scrolls
//   useLayoutEffect(() => {
//     updateIndicator();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pageHeight, pageNumber, activeTodoId]);

//   useEffect(() => {
//     const onResize = () => updateIndicator();
//     const onScroll = () => updateIndicator();
//     window.addEventListener("resize", onResize, { passive: true });
//     // scroll container is the main page; listen broadly
//     document.addEventListener("scroll", onScroll, { passive: true, capture: true });
//     return () => {
//       window.removeEventListener("resize", onResize);
//       document.removeEventListener("scroll", onScroll, true);
//     };
//   }, [updateIndicator]);

//   // Jump helpers
//   const gotoNextRequired = () => {
//     if (!orderInfo.canSign || todos.length === 0) return;
//     const next = (todoIndex ?? -1) + 1;
//     const idx = next < todos.length ? next : 0;
//     setTodoIndex(idx);
//     setPageNumber(todos[idx].pageNumber);
//     // position will update on next layout pass
//   };
//   const gotoPrevRequired = () => {
//     if (!orderInfo.canSign || todos.length === 0) return;
//     const prev = (todoIndex ?? todos.length) - 1;
//     const idx = prev >= 0 ? prev : todos.length - 1;
//     setTodoIndex(idx);
//     setPageNumber(todos[idx].pageNumber);
//   };

//   /* ------------------------------ UI actions ------------------------------ */
//   const handleElementClick = (element) => {
//     if (!orderInfo.canSign) {
//       toast.info(
//         `This document uses a signing order. You're order #${orderInfo.myOrder}. We'll notify you when it’s your turn.`,
//         { containerId: "signaturesign" }
//       );
//       return;
//     }
//     if (
//       (element?.recipientEmail || "").toLowerCase() !== (currentUser?.email || "").toLowerCase()
//     ) {
//       toast.error(
//         `Your current email is ${currentUser?.email || "unknown"}; this field is for ${element.recipientEmail}`,
//         { containerId: "signaturesign" }
//       );
//       return;
//     }
//     setActiveElement(element);
//     setSignatureType(null);

//     switch (element.type) {
//       case "checkbox":
//         setInputValue(!!element.value);
//         break;
//       case "image":
//         setInputValue(element.value || "");
//         break;
//       case "initials":
//         setInputValue(element.value || (currentProfile?.initials || "")); break;
//       case "date": {
//         const d = element.value ? parseISODateToLocal(element.value) : new Date();
//         setSelectedDate(d);
//         break;
//       }
//       default:
//         setInputValue(element.value || "");
//     }
//   };

//   const convertTextToSignature = (text) => {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     canvas.width = 200; canvas.height = 80;
//     ctx.font = "italic 42px 'Great Vibes', cursive";
//     ctx.fillStyle = SIGNATURE_BLUE;
//     ctx.textBaseline = "middle";
//     ctx.textAlign = "center";
//     ctx.fillText(text, canvas.width / 2, canvas.height / 2);
//     return canvas.toDataURL();
//   };

//   const completeAndAdvanceRef = useRef(null); // stores last completed field id

//   // Keep the signature BOX size fixed; only the image scales inside it
//   const commitSignatureValue = (elementId, dataUrl) => {
//     completeAndAdvanceRef.current = elementId;
//     setSignatureElements((prev) =>
//       prev.map((el) => (el.id === elementId ? { ...el, value: dataUrl } : el))
//     );
//     setActiveElement(null);
//     setInputValue("");
//   };

//   const handleImageUpload = (e) => {
//     if (!activeElement || !e.target.files[0]) return;
//     const reader = new FileReader();
//     reader.onload = (event) => commitSignatureValue(activeElement.id, event.target.result);
//     reader.readAsDataURL(e.target.files[0]);
//   };

//   const handleSave = () => {
//     if (!activeElement) return;
//     let value;

//     switch (activeElement.type) {
//       case "signature":
//         value =
//           signatureType === "draw"
//             ? canvasRef.current?.toDataURL()
//             : signatureType === "image"
//             ? inputValue || currentProfile?.signature
//             : inputValue
//             ? convertTextToSignature(inputValue)
//             : null;
//         if (value) {
//           commitSignatureValue(activeElement.id, value);
//           return;
//         }
//         break;
//       case "checkbox": value = !!inputValue; break;
//       case "image":    value = inputValue;   break;
//       case "initials": value = (inputValue || "").toUpperCase(); break;
//       case "date":     value = toISODate(selectedDate); break;
//       default:         value = inputValue;
//     }

//     completeAndAdvanceRef.current = activeElement.id;
//     setSignatureElements((prev) =>
//       prev.map((el) => (el.id === activeElement.id ? { ...el, value } : el))
//     );
//     setActiveElement(null);
//     setInputValue("");
//   };

//   // After any field is completed, move indicator to the next required field
//   useEffect(() => {
//     const justCompleted = completeAndAdvanceRef.current;
//     if (!justCompleted) return;
//     completeAndAdvanceRef.current = null;

//     if (!orderInfo.canSign) return;

//     if (todos.length > 0) {
//       // if the just-completed item is still the current, advance to the next item
//       const pos = todos.findIndex((t) => t.id === activeTodoId);
//       const idx = pos >= 0 ? Math.min(pos, todos.length - 1) : 0;
//       setTodoIndex(idx);
//       setPageNumber(todos[idx].pageNumber);
//     } else {
//       setTodoIndex(null);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [signatureElements]); // when elements change, recompute where to move

//   /* --------------------------- Save / decline flow -------------------------- */
//   const normalizeForBackend = (elements) => {
//     const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
//     const loc = navigator.language || "en-US";

//     return elements.map((el) => {
//       const base = {
//         ...el,
//         width:
//           el.width ??
//           (["signature", "initials", "stamp", "image"].includes(el.type)
//             ? SIG_W
//             : el.type === "date"
//             ? DATE_W
//             : TXT_W),
//         height:
//           el.height ??
//           (["signature", "initials", "stamp", "image"].includes(el.type)
//             ? SIG_H
//             : el.type === "date"
//             ? DATE_H
//             : TXT_H),
//       };
//       return el.type === "date" ? { ...base, locale: loc, timeZone: tz } : base;
//     });
//   };

//   const handleSaveDocument = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       setLoading(true);

//       // Ensure this signer’s date(s) are set to today (ISO) if empty
//       const todayISO = toISODate(new Date());
//       const ensured = signatureElements.map((el) => {
//         const mine =
//           (el.recipientEmail || "").toLowerCase() === (currentUser.email || "").toLowerCase();
//         if (mine && el.type === "date" && (!el.value || String(el.value).trim() === "")) {
//           return { ...el, value: todayISO };
//         }
//         return el;
//       });

//       const withDims = normalizeForBackend(ensured);

//       // Render to PDF on backend and get back bytes
//       const embedResponse = await axios.post(
//         `${BASE_URL}/embedElementsInPDF`,
//         { documentId, elements: withDims },
//         { headers: { authorization: `Bearer ${token}` }, responseType: "blob" }
//       );

//       // Replace the document file with the signed version
//       const blob = new Blob([embedResponse.data], { type: "application/pdf" });
//       const signedFile = new File([blob], `signedDocument-${documentId}.pdf`, {
//         type: "application/pdf",
//       });

//       const dataForm = new FormData();
//       dataForm.append("document", signedFile);
//       dataForm.append("documentId", documentId);

//       await axios.patch(`${BASE_URL}/editDocument/${documentId}`, dataForm, {
//         headers: { authorization: `Bearer ${token}` },
//       });

//       // Mark this signer as signed (send audit meta)
//       const meta = await buildClientMeta();
//       await axios.patch(
//         `${BASE_URL}/signDocument`,
//         { documentId, email: currentUser.email, meta },
//         { headers: { authorization: `Bearer ${token}` } }
//       );

//       toast.success("Document signed", { containerId: "signaturesign" });
//       window.location.href = "/admin";
//     } catch (error) {
//       setLoading(false);
//       toast.error(error?.response?.data?.error || "Something went wrong", {
//         containerId: "signaturesign",
//       });
//     }
//   };

//   const declineSign = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       await axios.patch(
//         `${BASE_URL}/declineDocs`,
//         { email: currentUser.email, docId: documentId },
//         { headers: { authorization: `Bearer ${token}` } }
//       );
//       toast.success("Sign declined successfully", { containerId: "signaturesign" });
//       setTimeout(() => window.close(), 500);
//     } catch (error) {
//       toast.error(error?.response?.data?.error || "Something went wrong", {
//         containerId: "signaturesign",
//       });
//     }
//   };

//   /* ----------------------------- Field preview ----------------------------- */
//   const renderFieldPreview = (element, canInteract) => {
//     const width = element.width, height = element.height;

//     const mine =
//       (element.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase();
//     const clickable = mine && canInteract;

//     const commonStyle = {
//       position: "absolute",
//       left: `${element.x}px`,
//       top: `${element.y}px`,
//       width: `${width}px`,
//       height: `${height}px`,
//       overflow: "hidden",
//       transform: "translateZ(0)",
//     };

//     const palette = {
//       signature: "border-blue-500 bg-blue-50",
//       date: "border-purple-500 bg-purple-50",
//       text: "border-gray-500 bg-gray-50",
//       name: "border-green-500 bg-green-50",
//       email: "border-yellow-500 bg-yellow-50",
//       jobTitle: "border-pink-500 bg-pink-50",
//       company: "border-indigo-500 bg-indigo-50",
//       checkbox: "border-orange-500 bg-orange-50",
//       radio: "border-teal-500 bg-teal-50",
//       image: "border-indigo-500 bg-indigo-50",
//       initials: "border-cyan-500 bg-cyan-50",
//       stamp: "border-red-500 bg-red-50",
//       phone: "border-gray-500 bg-gray-50",
//     };

//     const previewFontSize = Math.max(10, Math.min(14, height - 6));

//     const maybeRenderDate = () => {
//       if (element.type !== "date") return null;
//       const shown = element.value
//         ? formatLocalDate(
//             element.value,
//             navigator.language,
//             Intl.DateTimeFormat().resolvedOptions().timeZone
//           )
//         : "";
//       return (
//         <div
//           className="w-full h-full break-words flex items-center px-1"
//           style={{ fontSize: `${previewFontSize}px` }}
//         >
//           {shown}
//         </div>
//       );
//     };

//     return (
//       <div
//         key={element.id}
//         data-field-id={element.id}           /* <-- used for indicator positioning */
//         className={`border-2 rounded-sm p-1 ${
//           palette[element.type]
//         } ${clickable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
//         style={commonStyle}
//         onClick={() => clickable && handleElementClick(element)}
//         title={
//           !orderInfo.canSign && mine
//             ? `Waiting for previous signers. Your order is #${orderInfo.myOrder}.`
//             : undefined
//         }
//       >
//         <div className="w-full h-full">
//           {element.value ? (
//             element.type === "signature" ||
//             element.type === "image" ||
//             element.type === "stamp" ? (
//               <img
//                 src={element.value}
//                 alt={element.type}
//                 className="w-full h-full object-contain select-none"
//                 draggable={false}
//               />
//             ) : element.type === "checkbox" ? (
//               <div className="w-full h-full flex items-center justify-center">
//                 <input type="checkbox" checked={!!element.value} readOnly className="w-4 h-4" />
//               </div>
//             ) : element.type === "initials" ? (
//               <div
//                 className="w-full h-full flex items-center justify-center font-bold"
//                 style={{ fontSize: Math.max(12, Math.min(18, height - 6)) }}
//               >
//                 {element.value}
//               </div>
//             ) : element.type === "date" ? (
//               maybeRenderDate()
//             ) : (
//               <div
//                 className="w-full h-full break-words flex items-center px-1"
//                 style={{ fontSize: `${previewFontSize}px` }}
//               >
//                 {element.value}
//               </div>
//             )
//           ) : (
//             <div
//               className="w-full h-full text-gray-500 flex items-center justify-center select-none"
//               style={{ fontSize: `${Math.max(10, Math.min(13, height - 8))}px` }}
//             >
//               {element.type === "signature" ? (
//                 <div className="text-center leading-tight">
//                   <div className="font-semibold">Sign</div>
//                   <div aria-hidden="true">🖊️</div>
//                 </div>
//               ) : (
//                 CONTACT_LABEL[element.type] || element.label || element.type
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   /* --------------------------- PDF rendering UI --------------------------- */
//   const renderPDFWithOverlay = () => {
//     const validatedUrl = validateAndFixPDFUrl(file);

//     if (pdfLoadError) {
//       return (
//         <div className="flex flex-col items-center justify-center h-64 bg-red-50 border-2 border-red-200 rounded-lg">
//           <div className="text-red-600 text-center p-4">
//             <h3 className="font-semibold mb-2">PDF Loading Error</h3>
//             <p className="text-sm mb-4">{pdfLoadError}</p>
//             <button
//               onClick={() => {
//                 setPdfLoadError(null);
//                 setFile((prev) => prev);
//               }}
//               className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
//             >
//               Retry Loading
//             </button>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div ref={pageWrapRef} className="relative inline-block" style={{ width: `${VIRTUAL_WIDTH}px` }}>
//         <Document
//           file={validatedUrl}
//           onLoadSuccess={onDocumentLoadSuccess}
//           onLoadError={onDocumentLoadError}
//           loading={
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
//                 <p>Loading PDF...</p>
//               </div>
//             </div>
//           }
//         >
//           {numPages > 1 && (
//             <div className="flex items-center justify-center gap-4 mb-4 bg-white p-2 rounded shadow sticky top-0 z-40">
//               <button
//                 onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
//                 disabled={pageNumber <= 1}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
//               >
//                 Previous
//               </button>
//               <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
//               <button
//                 onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages))}
//                 disabled={pageNumber >= numPages}
//                 className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
//               >
//                 Next
//               </button>
//             </div>
//           )}

//           <Page
//             pageNumber={pageNumber}
//             width={VIRTUAL_WIDTH}
//             renderAnnotationLayer={false}
//             renderTextLayer={false}
//             onRenderSuccess={handlePageRenderSuccess}
//             loading={
//               <div className="flex items-center justify-center h-96">
//                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//               </div>
//             }
//           />
//         </Document>

//         {/* Absolute overlay anchored to page top-left */}
//         {pageHeight && (
//           <div
//             ref={overlayRef}
//             className="absolute left-0 top-0 z-20 pointer-events-none"
//             style={{ width: `${VIRTUAL_WIDTH}px`, height: `${pageHeight}px` }}
//           >
//             {signatureElements
//               .filter((e) => (e.pageNumber || 1) === pageNumber)
//               .map((el) => (
//                 <div key={el.id} className="pointer-events-auto">
//                   {renderFieldPreview(el, orderInfo.canSign)}
//                 </div>
//               ))}

//             {/* Highlight box */}
//             {indicator.visible && (
//               <div
//                 className="absolute rounded-lg border-2 border-indigo-400"
//                 style={{
//                   left: indicator.hilite.left,
//                   top: indicator.hilite.top,
//                   width: indicator.hilite.width,
//                   height: indicator.hilite.height,
//                   boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
//                 }}
//               />
//             )}

//             {/* Arrow bubble */}
//             {indicator.visible && (
//               <div
//                 className="absolute flex items-center justify-center"
//                 style={{
//                   left: indicator.left,
//                   top: indicator.top,
//                   width: ARROW_RADIUS * 2,
//                   height: ARROW_RADIUS * 2,
//                   borderRadius: ARROW_RADIUS,
//                   background: "#5848ff",
//                   color: "white",
//                   boxShadow: "0 6px 16px rgba(88,72,255,0.35)",
//                 }}
//               >
//                 <span className="text-sm" style={{ transform: indicator.side === "left" ? "rotate(0deg)" : "rotate(180deg)" }}>
//                   ➜
//                 </span>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   /* --------------------------------- JSX --------------------------------- */
//   const myFieldsIncomplete = signatureElements.some(
//     (el) =>
//       (el.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase() &&
//       !el.value
//   );

//   return (
//     <div>
//       <ToastContainer containerId={"signaturesign"} />
//       <div className="flex h-screen bg-gray-100">
//         <div className="flex-1 p-4 overflow-auto">
//           {/* Signing-order banners */}
//           {orderInfo.uses && (
//             <div
//               className={`mb-4 p-3 rounded border ${
//                 orderInfo.canSign
//                   ? "bg-green-50 border-green-200 text-green-800"
//                   : "bg-yellow-50 border-yellow-200 text-yellow-800"
//               }`}
//             >
//               {orderInfo.canSign ? (
//                 <div><strong>It’s your turn to sign.</strong> You are order #{orderInfo.myOrder}.</div>
//               ) : (
//                 <div className="flex items-start justify-between gap-3">
//                   <div>
//                     <strong>Waiting for your turn…</strong> You are order #{orderInfo.myOrder}. Current order is #{orderInfo.currentOrder}.
//                     {orderInfo.waiting?.length > 0 && (
//                       <div className="text-xs mt-1">Pending before you: {orderInfo.waiting.join(", ")}</div>
//                     )}
//                   </div>
//                   <button
//                     onClick={reloadDocument}
//                     className="shrink-0 bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
//                     title="Refresh status"
//                   >
//                     Refresh
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Top action buttons */}
//           <button
//             onClick={declineSign}
//             className="fixed top-4 right-[20%] z-50 bg-[#29354a] text-white px-6 py-2 rounded-[20px] shadow-l"
//           >
//             Decline
//           </button>
//           <button
//             onClick={handleSaveDocument}
//             className="fixed top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-l disabled:opacity-60 disabled:cursor-not-allowed"
//             disabled={!orderInfo.canSign || myFieldsIncomplete}
//           >
//             Complete Signing
//           </button>

//           {/* Bottom-right Next/Prev required */}
//           {orderInfo.canSign && todos.length > 0 && (
//             <>
//               <button
//                 onClick={gotoPrevRequired}
//                 className="fixed right-40 bottom-6 z-50 bg-[#5848ff] text-white px-4 py-2 rounded-[20px] shadow-lg"
//               >
//                 Prev required
//               </button>
//               <button
//                 onClick={gotoNextRequired}
//                 className="fixed right-6 bottom-6 z-50 bg-[#5848ff] text-white px-4 py-2 rounded-[20px] shadow-lg"
//               >
//                 Next required
//               </button>
//             </>
//           )}

//           {loadingError ? (
//             <div className="text-red-500 text-center mt-8">{loadingError}</div>
//           ) : file ? (
//             file.toLowerCase().includes(".pdf") || file.startsWith("http") ? (
//               renderPDFWithOverlay()
//             ) : (
//               <div className="relative inline-block" style={{ width: `${VIRTUAL_WIDTH}px` }}>
//                 <img
//                   src={file}
//                   alt="Document"
//                   className="w-[800px] h-auto block"
//                   onLoad={(e) => setPageHeight(e.currentTarget.height)}
//                   onError={(e) => { e.currentTarget.style.display = "none"; }}
//                 />
//                 {pageHeight && (
//                   <div
//                     ref={overlayRef}
//                     className="absolute left-0 top-0 z-20 pointer-events-none"
//                     style={{ width: `${VIRTUAL_WIDTH}px`, height: `${pageHeight}px` }}
//                   >
//                     {signatureElements
//                       .filter((e) => (e.pageNumber || 1) === pageNumber)
//                       .map((el) => (
//                         <div key={el.id} className="pointer-events-auto">
//                           {renderFieldPreview(el, orderInfo.canSign)}
//                         </div>
//                       ))}

//                     {indicator.visible && (
//                       <>
//                         <div
//                           className="absolute rounded-lg border-2 border-indigo-400"
//                           style={{
//                             left: indicator.hilite.left,
//                             top: indicator.hilite.top,
//                             width: indicator.hilite.width,
//                             height: indicator.hilite.height,
//                             boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
//                           }}
//                         />
//                         <div
//                           className="absolute flex items-center justify-center"
//                           style={{
//                             left: indicator.left,
//                             top: indicator.top,
//                             width: ARROW_RADIUS * 2,
//                             height: ARROW_RADIUS * 2,
//                             borderRadius: ARROW_RADIUS,
//                             background: "#5848ff",
//                             color: "white",
//                             boxShadow: "0 6px 16px rgba(88,72,255,0.35)",
//                           }}
//                         >
//                           <span className="text-sm" style={{ transform: indicator.side === "left" ? "rotate(0deg)" : "rotate(180deg)" }}>➜</span>
//                         </div>
//                       </>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )
//           ) : (
//             <div className="flex items-center justify-center h-full"><p>Loading document...</p></div>
//           )}

//           {/* Element modal */}
//           {activeElement && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//               <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
//                 <h3 className="text-xl font-bold mb-4">{activeElement.label}</h3>

//                 {activeElement.type === "signature" && (
//                   <>
//                     <div className="flex border-b mb-4">
//                       <button className={`flex-1 py-2 ${signatureType === "draw" ? "border-b-2 border-blue-500" : ""}`} onClick={() => setSignatureType("draw")}>Draw</button>
//                       <button className={`flex-1 py-2 ${signatureType === "image" ? "border-b-2 border-blue-500" : ""}`} onClick={() => setSignatureType("image")}>Upload</button>
//                       <button className={`flex-1 py-2 ${signatureType === "typed" ? "border-b-2 border-blue-500" : ""}`} onClick={() => setSignatureType("typed")}>Type</button>
//                     </div>

//                     {signatureType === "draw" && (
//                       <div className="mb-4">
//                         <canvas
//                           ref={canvasRef}
//                           width={SIG_W}
//                           height={SIG_H}
//                           className="border mb-2"
//                           onMouseDown={startDrawing}
//                           onMouseMove={draw}
//                           onMouseUp={stopDrawing}
//                           onMouseLeave={stopDrawing}
//                           onTouchStart={startDrawing}
//                           onTouchMove={draw}
//                           onTouchEnd={stopDrawing}
//                         />
//                         <button onClick={handleClearCanvas} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">Clear</button>
//                       </div>
//                     )}

//                     {signatureType === "image" && (
//                       <div className="space-y-4">
//                         {currentProfile?.signature && (
//                           <div className="text-center">
//                             <p className="text-sm text-gray-600 mb-2">Existing Signature:</p>
//                             <img src={currentProfile.signature} alt="Existing Signature" className="mx-auto w-40 h-20 object-contain border rounded" />
//                           </div>
//                         )}
//                         <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
//                           {currentProfile?.signature ? "Click to upload new image" : "Click to upload signature image"}
//                           <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
//                         </label>
//                       </div>
//                     )}

//                     {signatureType === "typed" && (
//                       <>
//                         <input
//                           type="text"
//                           value={inputValue}
//                           onChange={(e) => setInputValue(e.target.value)}
//                           className="w-full p-2 border rounded mb-4"
//                           placeholder="Type your signature"
//                         />
//                         {inputValue && (
//                           <div className="text-center border p-2">
//                             <img src={convertTextToSignature(inputValue)} alt="Signature Preview" className="mx-auto" style={{ width: 200, height: 80 }} />
//                           </div>
//                         )}
//                       </>
//                     )}
//                   </>
//                 )}

//                 {activeElement.type === "checkbox" && (
//                   <div className="flex items-center gap-2">
//                     <input type="checkbox" checked={!!inputValue} onChange={(e) => setInputValue(e.target.checked)} className="w-5 h-5" />
//                     <span className="text-sm">Checkbox</span>
//                   </div>
//                 )}

//                 {activeElement.type === "image" && (
//                   <div className="space-y-4">
//                     <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
//                       Click to upload image
//                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
//                     </label>
//                     {inputValue && <img src={inputValue} alt="Preview" className="mx-auto max-h-32 object-contain" />}
//                   </div>
//                 )}

//                 {activeElement.type === "initials" && (
//                   <div className="space-y-4">
//                     <input
//                       type="text"
//                       value={inputValue}
//                       onChange={(e) => setInputValue(e.target.value.toUpperCase())}
//                       className="w-full p-2 border rounded mb-4 text-center text-xl font-bold"
//                       placeholder="Enter initials"
//                       maxLength={3}
//                     />
//                     {inputValue && (
//                       <div className="text-center border p-2">
//                         <div className="text-2xl font-bold">{inputValue}</div>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {activeElement.type === "date" && (
//                   <DatePicker selected={selectedDate} onChange={setSelectedDate} inline className="w-full text-center" />
//                 )}

//                 {["text", "name", "email", "jobTitle", "company", "phone"].includes(activeElement.type) && (
//                   <input
//                     type="text"
//                     value={inputValue}
//                     onChange={(e) => setInputValue(e.target.value)}
//                     className="w-full p-2 border rounded mb-4"
//                     placeholder={`Enter ${CONTACT_LABEL[activeElement.type] || activeElement.type}`}
//                   />
//                 )}

//                 <div className="flex justify-end gap-2">
//                   <button onClick={() => setActiveElement(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
//                   <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {loading && (
//         <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
//           <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4 text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <h3 className="text-2xl font-semibold text-gray-900 mb-2">Updating Document</h3>
//             <p className="text-gray-600">Please wait while the document is being updated</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SignDocumentPage;

// src/signdocument.js
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import DatePicker from "react-datepicker";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { toast, ToastContainer } from "react-toastify";

/* ------------------------ PDF worker with fallbacks ----------------------- */
const PDF_WORKER_URLS = [
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
];
const setPDFWorker = () => {
  let idx = 0;
  const tryWorker = () => {
    if (idx < PDF_WORKER_URLS.length) {
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URLS[idx];
      idx++;
    }
  };
  tryWorker();
  return tryWorker;
};
const tryNextWorker = setPDFWorker();

/* ------------------------------ UI constants ------------------------------ */
const CONTACT_LABEL = { name: "Name", email: "Email", phone: "Phone" };
const VIRTUAL_WIDTH = 800; // must match builder/backend

// === Brand colors (from your site icon) =====================================
const BRAND = {
  from: "#7E3FF2",   // main purple
  to:   "#D65BFF",   // magenta accent (for a soft gradient)
  glow: "rgba(126, 63, 242, 0.32)", // shadow/glow around arrow & pills
};
const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND.from} 0%, ${BRAND.to} 100%)`;

// Optional tiny helper for brand pill buttons
const BrandPillButton = ({ children, style, ...props }) => (
  <button
    {...props}
    className="px-4 py-2 rounded-[20px] text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
    style={{
      background: BRAND_GRADIENT,
      boxShadow: `0 10px 22px ${BRAND.glow}`,
      ...style,
    }}
  >
    {children}
  </button>
);

// Default box sizes (align with backend DEFAULT_BOXES)
const SIG_W = 160, SIG_H = 60;
const TXT_W = 140, TXT_H = 40;
const DATE_W = 120, DATE_H = 40;

const SIGNATURE_BLUE = "#1a73e8";
const MIN_WIDTH = 0.8, MAX_WIDTH = 2.6, SMOOTHING = 0.85, VELOCITY_FILTER = 0.7;

// Indicator styles
const ARROW_RADIUS = 18;      // px
const INDENT = 8;             // gap between arrow and field
const HILITE_PAD = 6;         // extra rectangle padding around field

/* ------------------------------ Date helpers ------------------------------ */
const toISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseISODateToLocal = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date();
  return new Date(`${iso}T12:00:00Z`);
};
const formatLocalDate = (iso, locale, timeZone) => {
  try {
    const dt = parseISODateToLocal(iso);
    return new Intl.DateTimeFormat(locale || undefined, {
      timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dt);
  } catch {
    return iso;
  }
};

/* --------------------------- Recipient resolution -------------------------- */
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

/* ---------------------- Elements cleanup + prefilling ---------------------- */
function sanitizeIncomingElements(elements = []) {
  return elements.map((el) => {
    const type = el.type;
    const cleanLabel = type === "signature" ? "Sign" : CONTACT_LABEL[type] || el.type;
    const pageNumber = el.pageNumber || 1;

    const defaults =
      type === "signature" || type === "initials" || type === "stamp" || type === "image"
        ? { width: SIG_W, height: SIG_H }
        : type === "date"
        ? { width: DATE_W, height: DATE_H }
        : { width: TXT_W, height: TXT_H };

    return {
      ...el,
      id: el._id || Math.random().toString(36).slice(2),
      label: cleanLabel,
      value: el.value ?? null,
      pageNumber,
      width: Number(el.width ?? defaults.width),
      height: Number(el.height ?? defaults.height),
      fontSize: el.fontSize ?? (type === "signature" ? 16 : 14),
    };
  });
}

function prefillForRecipient(elements = [], recipient = {}) {
  if (!elements.length || !recipient) return elements;
  const rEmail = (recipient.email || "").toLowerCase();
  const rName = recipient.name || "";
  const rPhone = recipient.phone || recipient.mobile || recipient.phoneNumber || "";
  const todayISO = toISODate(new Date());

  return elements.map((el) => {
    const assignedEmail = (el.recipientEmail || "").toLowerCase();
    const sameRecipient = !assignedEmail || (rEmail && assignedEmail === rEmail);
    if (!sameRecipient) return el;

    const hasValue = el.value != null && String(el.value).trim() !== "";
    if (hasValue) return el;

    if (el.type === "name" && rName) return { ...el, value: rName };
    if (el.type === "email" && rEmail) return { ...el, value: recipient.email };
    if (el.type === "phone" && rPhone) return { ...el, value: rPhone };
    if (el.type === "date") return { ...el, value: todayISO };
    return el;
  });
}

/* --------------------------- Signing order helpers ------------------------- */
function computeSigningOrderMeta(doc, myEmail) {
  const uses = !!doc?.sendInOrder;
  const signers = Array.isArray(doc?.signers) ? doc.signers : [];
  const mySigner = signers.find(
    (s) => (s.email || "").toLowerCase() === (myEmail || "").toLowerCase()
  );
  const myOrder = mySigner ? Number(mySigner.order) || 1 : undefined;
  const currentOrder = uses ? Number(doc?.currentOrder) || 1 : undefined;
  const canSign =
    !uses || (myOrder !== undefined && currentOrder !== undefined && myOrder === currentOrder);

  const waiting =
    uses && myOrder
      ? signers
          .filter(
            (s) =>
              (Number(s.order) || 1) < myOrder && !s.signed && !s.declined && s.willSign !== false
          )
          .map((s) => s.email)
      : [];

  return { uses, myOrder, currentOrder, canSign, waiting, mySigner };
}

/* ---------------------------- Client audit meta ---------------------------- */
const buildClientMeta = () =>
  new Promise((resolve) => {
    const meta = {
      clientSignedAt: new Date().toISOString(),
      clientLocale: navigator.language || "en-US",
      clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };
    if (!navigator.geolocation) return resolve(meta);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ...meta,
          coords: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        }),
      () => resolve(meta),
      { maximumAge: 60000, timeout: 2000 }
    );
  });

/* ================================= Component ================================ */

const SignDocumentPage = () => {
  const { documentId } = useParams();
  const location = useLocation();

  // data
  const [documentData, setDocumentData] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [preference, setPreference] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  // signing order UI state
  const [orderInfo, setOrderInfo] = useState({
    uses: false,
    myOrder: undefined,
    currentOrder: undefined,
    canSign: true,
    waiting: [],
    mySigner: null,
  });

  // ui state
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageHeight, setPageHeight] = useState(null);

  const [signatureElements, setSignatureElements] = useState([]);
  const [activeElement, setActiveElement] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [signatureType, setSignatureType] = useState();
  const [loading, setLoading] = useState(false);

  const [loadingError, setLoadingError] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);

  // drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasContext, setCanvasContext] = useState(null);
  const canvasRef = useRef(null);

  // containers
  const pageWrapRef = useRef(null);  // wraps a single Page
  const overlayRef = useRef(null);   // absolute overlay that matches the PDF canvas

  /* ---------------------------- Load document ---------------------------- */
  const reloadDocument = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const queryEmail = (params.get("email") || "").trim();

      // Ensure a token exists for the invite email
      let token = localStorage.getItem("token");
      let me;

      if (token) {
        const res = await axios.get(`${BASE_URL}/getUser`, {
          headers: { authorization: `Bearer ${token}` },
        });
        me = res.data;
        if (queryEmail && (res.data?.user?.email || "").toLowerCase() !== queryEmail.toLowerCase()) {
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

      // Fetch document and prepare elements for this recipient
      const docRes = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`);
      const doc = docRes.data.doc || {};
      setDocumentData(doc);
      setFile(doc.file);

      // compute signing order info (if enabled)
      const info = computeSigningOrderMeta(doc, queryEmail || me?.user?.email || "");
      setOrderInfo(info);

      const signingContext = {
        recipients: doc.recipients || [],
        queryEmail,
        user: me.user,
        profile: me.profile,
      };

      const recipient = resolveCurrentRecipient(signingContext);
      const sanitized = sanitizeIncomingElements(doc.elements || []);
      const prefilled = prefillForRecipient(sanitized, recipient);

      setSignatureElements(prefilled);
    } catch (err) {
      console.error("Load error:", err);
      setLoadingError("Failed to load document");
    }
  };

  useEffect(() => {
    reloadDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPdfLoadError(null);
  };
  const onDocumentLoadError = (error) => {
    console.error("PDF loading error:", error);
    if (error.name === "MissingPDFException" || error.message?.includes("worker")) {
      tryNextWorker();
      setTimeout(() => setFile((prev) => prev), 100);
    } else {
      setPdfLoadError(`Failed to load PDF: ${error.message || "Unknown error"}`);
    }
  };

  // When a page finishes rendering, measure its height so our overlay matches exactly.
  const handlePageRenderSuccess = (page) => {
    try {
      const scale = VIRTUAL_WIDTH / page.view[2];
      const vp = page.getViewport({ scale });
      setPageHeight(vp.height);
    } catch {
      const canvas = pageWrapRef.current?.querySelector(".react-pdf__Page__canvas");
      if (canvas) setPageHeight(canvas.height || canvas.offsetHeight || null);
    }
  };

  /* ------------------------------ Utilities ------------------------------- */
  const validateAndFixPDFUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("/")) return `${BASE_URL}${url}`;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) return `https://${url}`;
    return url;
  };

  // drawing helpers
  const lastPointRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lineWidthRef = useRef(MAX_WIDTH);

  const startDrawing = (e) => {
    if (!activeElement || !canvasRef.current || !canvasContext) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches?.[0]
      ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      : { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches?.[0]
      ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      : { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    const lp = lastPointRef.current;
    const dx = p.x - lp.x, dy = p.y - lp.y;
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
  const handleClearCanvas = () => {
    if (!canvasRef.current || !canvasContext) return;
    canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  /* -------------------------- Required‑field list -------------------------- */
  const isMine = (el) =>
    (el.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase();

  const todos = useMemo(() => {
    const pending = signatureElements.filter((el) => isMine(el) && !el.value);
    // deterministic order across pages/top->bottom->left
    return pending.sort((a, b) =>
      a.pageNumber !== b.pageNumber
        ? a.pageNumber - b.pageNumber
        : a.y !== b.y
        ? a.y - b.y
        : a.x - b.x
    );
  }, [signatureElements, currentUser]);

  // currently selected "required" field (by index into todos)
  const [todoIndex, setTodoIndex] = useState(null);

  // After elements load, auto‑select first required and jump to its page
  useEffect(() => {
    if (!orderInfo.canSign) {
      setTodoIndex(null);
      return;
    }
    if (todos.length === 0) {
      setTodoIndex(null);
      return;
    }
    // If we don't already point to a valid item, point to the first and change page.
    if (todoIndex == null || !todos[todoIndex]) {
      setTodoIndex(0);
      setPageNumber(todos[0].pageNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos.length, orderInfo.canSign]);

  /* --------------------- Indicator position via DOM rect -------------------- */
  const [indicator, setIndicator] = useState({
    visible: false,
    top: 0,
    left: 0,
    side: "left", // left | right
    hilite: { top: 0, left: 0, width: 0, height: 0 },
  });

  const activeTodoId = useMemo(() => (todos[todoIndex]?.id ?? null), [todos, todoIndex]);

  // Measure the actual DOM box of the active field and position the indicator
  const updateIndicator = React.useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay || !activeTodoId || !orderInfo.canSign) {
      setIndicator((s) => ({ ...s, visible: false }));
      return;
    }

    const fieldNode = overlay.querySelector(`[data-field-id="${activeTodoId}"]`);
    if (!fieldNode) {
      setIndicator((s) => ({ ...s, visible: false }));
      return;
    }

    const oRect = overlay.getBoundingClientRect();
    const fRect = fieldNode.getBoundingClientRect();

    // Highlight rectangle padded a bit
    const hLeft = Math.max(0, fRect.left - oRect.left - HILITE_PAD);
    const hTop = Math.max(0, fRect.top - oRect.top - HILITE_PAD);
    const hW = Math.min(oRect.width, fRect.width + HILITE_PAD * 2);
    const hH = Math.min(oRect.height, fRect.height + HILITE_PAD * 2);

    // Place the arrow to the left if there's room; otherwise to the right
    const roomLeft = hLeft >= ARROW_RADIUS * 2 + INDENT;
    const side = roomLeft ? "left" : "right";
    const arrowLeft =
      side === "left"
        ? hLeft - ARROW_RADIUS * 2 - INDENT
        : Math.min(oRect.width - ARROW_RADIUS * 2, hLeft + hW + INDENT);
    const arrowTop = Math.max(
      0,
      Math.min(oRect.height - ARROW_RADIUS * 2, hTop + hH / 2 - ARROW_RADIUS)
    );

    setIndicator({
      visible: true,
      top: arrowTop,
      left: arrowLeft,
      side,
      hilite: { top: hTop, left: hLeft, width: hW, height: hH },
    });

    // Ensure the field is visible vertically
    fieldNode.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeTodoId, orderInfo.canSign]);

  // Reposition indicator when:
  //  - page renders (pageHeight changes)
  //  - page number changes
  //  - active todo changes
  //  - window resizes or container scrolls
  useLayoutEffect(() => {
    updateIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageHeight, pageNumber, activeTodoId]);

  useEffect(() => {
    const onResize = () => updateIndicator();
    const onScroll = () => updateIndicator();
    window.addEventListener("resize", onResize, { passive: true });
    // scroll container is the main page; listen broadly
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [updateIndicator]);

  // Jump helpers
  const gotoNextRequired = () => {
    if (!orderInfo.canSign || todos.length === 0) return;
    const next = (todoIndex ?? -1) + 1;
    const idx = next < todos.length ? next : 0;
    setTodoIndex(idx);
    setPageNumber(todos[idx].pageNumber);
    // position will update on next layout pass
  };
  const gotoPrevRequired = () => {
    if (!orderInfo.canSign || todos.length === 0) return;
    const prev = (todoIndex ?? todos.length) - 1;
    const idx = prev >= 0 ? prev : todos.length - 1;
    setTodoIndex(idx);
    setPageNumber(todos[idx].pageNumber);
  };

  /* ------------------------------ UI actions ------------------------------ */
  const handleElementClick = (element) => {
    if (!orderInfo.canSign) {
      toast.info(
        `This document uses a signing order. You're order #${orderInfo.myOrder}. We'll notify you when it’s your turn.`,
        { containerId: "signaturesign" }
      );
      return;
    }
    if (
      (element?.recipientEmail || "").toLowerCase() !== (currentUser?.email || "").toLowerCase()
    ) {
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
        setInputValue(element.value || (currentProfile?.initials || "")); break;
      case "date": {
        const d = element.value ? parseISODateToLocal(element.value) : new Date();
        setSelectedDate(d);
        break;
      }
      default:
        setInputValue(element.value || "");
    }
  };

  const convertTextToSignature = (text) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 200; canvas.height = 80;
    ctx.font = "italic 42px 'Great Vibes', cursive";
    ctx.fillStyle = SIGNATURE_BLUE;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL();
  };

  const completeAndAdvanceRef = useRef(null); // stores last completed field id

  // Keep the signature BOX size fixed; only the image scales inside it
  const commitSignatureValue = (elementId, dataUrl) => {
    completeAndAdvanceRef.current = elementId;
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === elementId ? { ...el, value: dataUrl } : el))
    );
    setActiveElement(null);
    setInputValue("");
  };

  const handleImageUpload = (e) => {
    if (!activeElement || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (event) => commitSignatureValue(activeElement.id, event.target.result);
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSave = () => {
    if (!activeElement) return;
    let value;

    switch (activeElement.type) {
      case "signature":
        value =
          signatureType === "draw"
            ? canvasRef.current?.toDataURL()
            : signatureType === "image"
            ? inputValue || currentProfile?.signature
            : inputValue
            ? convertTextToSignature(inputValue)
            : null;
        if (value) {
          commitSignatureValue(activeElement.id, value);
          return;
        }
        break;
      case "checkbox": value = !!inputValue; break;
      case "image":    value = inputValue;   break;
      case "initials": value = (inputValue || "").toUpperCase(); break;
      case "date":     value = toISODate(selectedDate); break;
      default:         value = inputValue;
    }

    completeAndAdvanceRef.current = activeElement.id;
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === activeElement.id ? { ...el, value } : el))
    );
    setActiveElement(null);
    setInputValue("");
  };

  // After any field is completed, move indicator to the next required field
  useEffect(() => {
    const justCompleted = completeAndAdvanceRef.current;
    if (!justCompleted) return;
    completeAndAdvanceRef.current = null;

    if (!orderInfo.canSign) return;

    if (todos.length > 0) {
      // if the just-completed item is still the current, advance to the next item
      const pos = todos.findIndex((t) => t.id === activeTodoId);
      const idx = pos >= 0 ? Math.min(pos, todos.length - 1) : 0;
      setTodoIndex(idx);
      setPageNumber(todos[idx].pageNumber);
    } else {
      setTodoIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureElements]); // when elements change, recompute where to move

  /* --------------------------- Save / decline flow -------------------------- */
  const normalizeForBackend = (elements) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const loc = navigator.language || "en-US";

    return elements.map((el) => {
      const base = {
        ...el,
        width:
          el.width ??
          (["signature", "initials", "stamp", "image"].includes(el.type)
            ? SIG_W
            : el.type === "date"
            ? DATE_W
            : TXT_W),
        height:
          el.height ??
          (["signature", "initials", "stamp", "image"].includes(el.type)
            ? SIG_H
            : el.type === "date"
            ? DATE_H
            : TXT_H),
      };
      return el.type === "date" ? { ...base, locale: loc, timeZone: tz } : base;
    });
  };

  const handleSaveDocument = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      // Ensure this signer’s date(s) are set to today (ISO) if empty
      const todayISO = toISODate(new Date());
      const ensured = signatureElements.map((el) => {
        const mine =
          (el.recipientEmail || "").toLowerCase() === (currentUser.email || "").toLowerCase();
        if (mine && el.type === "date" && (!el.value || String(el.value).trim() === "")) {
          return { ...el, value: todayISO };
        }
        return el;
      });

      const withDims = normalizeForBackend(ensured);

      // Render to PDF on backend and get back bytes
      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        { documentId, elements: withDims },
        { headers: { authorization: `Bearer ${token}` }, responseType: "blob" }
      );

      // Replace the document file with the signed version
      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const signedFile = new File([blob], `signedDocument-${documentId}.pdf`, {
        type: "application/pdf",
      });

      const dataForm = new FormData();
      dataForm.append("document", signedFile);
      dataForm.append("documentId", documentId);

      await axios.patch(`${BASE_URL}/editDocument/${documentId}`, dataForm, {
        headers: { authorization: `Bearer ${token}` },
      });

      // Mark this signer as signed (send audit meta)
      const meta = await buildClientMeta();
      await axios.patch(
        `${BASE_URL}/signDocument`,
        { documentId, email: currentUser.email, meta },
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

  /* ----------------------------- Field preview ----------------------------- */
  const renderFieldPreview = (element, canInteract) => {
    const width = element.width, height = element.height;

    const mine =
      (element.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase();
    const clickable = mine && canInteract;

    const commonStyle = {
      position: "absolute",
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${width}px`,
      height: `${height}px`,
      overflow: "hidden",
      transform: "translateZ(0)",
    };

    const palette = {
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

    const previewFontSize = Math.max(10, Math.min(14, height - 6));

    const maybeRenderDate = () => {
      if (element.type !== "date") return null;
      const shown = element.value
        ? formatLocalDate(
            element.value,
            navigator.language,
            Intl.DateTimeFormat().resolvedOptions().timeZone
          )
        : "";
      return (
        <div
          className="w-full h-full break-words flex items-center px-1"
          style={{ fontSize: `${previewFontSize}px` }}
        >
          {shown}
        </div>
      );
    };

    return (
      <div
        key={element.id}
        data-field-id={element.id}           /* <-- used for indicator positioning */
        className={`border-2 rounded-sm p-1 ${
          palette[element.type]
        } ${clickable ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
        style={commonStyle}
        onClick={() => clickable && handleElementClick(element)}
        title={
          !orderInfo.canSign && mine
            ? `Waiting for previous signers. Your order is #${orderInfo.myOrder}.`
            : undefined
        }
      >
        <div className="w-full h-full">
          {element.value ? (
            element.type === "signature" ||
            element.type === "image" ||
            element.type === "stamp" ? (
              <img
                src={element.value}
                alt={element.type}
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
            ) : element.type === "checkbox" ? (
              <div className="w-full h-full flex items-center justify-center">
                <input type="checkbox" checked={!!element.value} readOnly className="w-4 h-4" />
              </div>
            ) : element.type === "initials" ? (
              <div
                className="w-full h-full flex items-center justify-center font-bold"
                style={{ fontSize: Math.max(12, Math.min(18, height - 6)) }}
              >
                {element.value}
              </div>
            ) : element.type === "date" ? (
              maybeRenderDate()
            ) : (
              <div
                className="w-full h-full break-words flex items-center px-1"
                style={{ fontSize: `${previewFontSize}px` }}
              >
                {element.value}
              </div>
            )
          ) : (
            <div
              className="w-full h-full text-gray-500 flex items-center justify-center select-none"
              style={{ fontSize: `${Math.max(10, Math.min(13, height - 8))}px` }}
            >
              {element.type === "signature" ? (
                <div className="text-center leading-tight">
                  <div className="font-semibold">Sign</div>
                  <div aria-hidden="true">🖊️</div>
                </div>
              ) : (
                CONTACT_LABEL[element.type] || element.label || element.type
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* --------------------------- PDF rendering UI --------------------------- */
  const renderPDFWithOverlay = () => {
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

    return (
      <div ref={pageWrapRef} className="relative inline-block" style={{ width: `${VIRTUAL_WIDTH}px` }}>
        <Document
          file={validatedUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Loading PDF...</p>
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
              <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
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
            width={VIRTUAL_WIDTH}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            onRenderSuccess={handlePageRenderSuccess}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            }
          />
        </Document>

        {/* Absolute overlay anchored to page top-left */}
        {pageHeight && (
          <div
            ref={overlayRef}
            className="absolute left-0 top-0 z-20 pointer-events-none"
            style={{ width: `${VIRTUAL_WIDTH}px`, height: `${pageHeight}px` }}
          >
            {signatureElements
              .filter((e) => (e.pageNumber || 1) === pageNumber)
              .map((el) => (
                <div key={el.id} className="pointer-events-auto">
                  {renderFieldPreview(el, orderInfo.canSign)}
                </div>
              ))}

            {/* Highlight box */}
            {indicator.visible && (
              <div
                className="absolute rounded-lg border-2"
                style={{
                  left: indicator.hilite.left,
                  top: indicator.hilite.top,
                  width: indicator.hilite.width,
                  height: indicator.hilite.height,
                  borderColor: BRAND.from,
                  boxShadow: `0 0 0 3px ${BRAND.glow}`,
                }}
              />
            )}

            {/* Arrow bubble (brand gradient) */}
            {indicator.visible && (
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: indicator.left,
                  top: indicator.top,
                  width: ARROW_RADIUS * 2,
                  height: ARROW_RADIUS * 2,
                  borderRadius: ARROW_RADIUS,
                  background: BRAND_GRADIENT,
                  color: "white",
                  boxShadow: `0 10px 24px ${BRAND.glow}`,
                  border: "2px solid #fff",
                }}
              >
                <span
                  className="text-sm"
                  style={{ transform: indicator.side === "left" ? "rotate(0deg)" : "rotate(180deg)" }}
                >
                  ➜
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* --------------------------------- JSX --------------------------------- */
  const myFieldsIncomplete = signatureElements.some(
    (el) =>
      (el.recipientEmail || "").toLowerCase() === (currentUser?.email || "").toLowerCase() &&
      !el.value
  );

  return (
    <div>
      <ToastContainer containerId={"signaturesign"} />
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 p-4 overflow-auto">
          {/* Signing-order banners */}
          {orderInfo.uses && (
            <div
              className={`mb-4 p-3 rounded border ${
                orderInfo.canSign
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}
            >
              {orderInfo.canSign ? (
                <div><strong>It’s your turn to sign.</strong> You are order #{orderInfo.myOrder}.</div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>Waiting for your turn…</strong> You are order #{orderInfo.myOrder}. Current order is #{orderInfo.currentOrder}.
                    {orderInfo.waiting?.length > 0 && (
                      <div className="text-xs mt-1">Pending before you: {orderInfo.waiting.join(", ")}</div>
                    )}
                  </div>
                  <button
                    onClick={reloadDocument}
                    className="shrink-0 bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    title="Refresh status"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Top action buttons (unchanged) */}
          <button
            onClick={declineSign}
            className="fixed top-4 right-[20%] z-50 bg-[#29354a] text-white px-6 py-2 rounded-[20px] shadow-l"
          >
            Decline
          </button>
          <button
            onClick={handleSaveDocument}
            className="fixed top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-l disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!orderInfo.canSign || myFieldsIncomplete}
          >
            Complete Signing
          </button>

          {/* Bottom-right Next/Prev required (brand gradient) */}
          {orderInfo.canSign && todos.length > 0 && (
            <>
              <BrandPillButton
                onClick={gotoPrevRequired}
                style={{ position: "fixed", right: 160, bottom: 24, zIndex: 50 }}
              >
                Prev required
              </BrandPillButton>
              <BrandPillButton
                onClick={gotoNextRequired}
                style={{ position: "fixed", right: 24, bottom: 24, zIndex: 50 }}
              >
                Next required
              </BrandPillButton>
            </>
          )}

          {loadingError ? (
            <div className="text-red-500 text-center mt-8">{loadingError}</div>
          ) : file ? (
            file.toLowerCase().includes(".pdf") || file.startsWith("http") ? (
              renderPDFWithOverlay()
            ) : (
              <div className="relative inline-block" style={{ width: `${VIRTUAL_WIDTH}px` }}>
                <img
                  src={file}
                  alt="Document"
                  className="w-[800px] h-auto block"
                  onLoad={(e) => setPageHeight(e.currentTarget.height)}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                {pageHeight && (
                  <div
                    ref={overlayRef}
                    className="absolute left-0 top-0 z-20 pointer-events-none"
                    style={{ width: `${VIRTUAL_WIDTH}px`, height: `${pageHeight}px` }}
                  >
                    {signatureElements
                      .filter((e) => (e.pageNumber || 1) === pageNumber)
                      .map((el) => (
                        <div key={el.id} className="pointer-events-auto">
                          {renderFieldPreview(el, orderInfo.canSign)}
                        </div>
                      ))}

                    {indicator.visible && (
                      <>
                        <div
                          className="absolute rounded-lg border-2"
                          style={{
                            left: indicator.hilite.left,
                            top: indicator.hilite.top,
                            width: indicator.hilite.width,
                            height: indicator.hilite.height,
                            borderColor: BRAND.from,
                            boxShadow: `0 0 0 3px ${BRAND.glow}`,
                          }}
                        />
                        <div
                          className="absolute flex items-center justify-center"
                          style={{
                            left: indicator.left,
                            top: indicator.top,
                            width: ARROW_RADIUS * 2,
                            height: ARROW_RADIUS * 2,
                            borderRadius: ARROW_RADIUS,
                            background: BRAND_GRADIENT,
                            color: "white",
                            boxShadow: `0 10px 24px ${BRAND.glow}`,
                            border: "2px solid #fff",
                          }}
                        >
                          <span
                            className="text-sm"
                            style={{ transform: indicator.side === "left" ? "rotate(0deg)" : "rotate(180deg)" }}
                          >
                            ➜
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full"><p>Loading document...</p></div>
          )}

          {/* Element modal */}
          {activeElement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">{activeElement.label}</h3>

                {activeElement.type === "signature" && (
                  <>
                    <div className="flex border-b mb-4">
                      <button className={`flex-1 py-2 ${signatureType === "draw" ? "border-b-2 border-blue-500" : ""}`} onClick={() => setSignatureType("draw")}>Draw</button>
                      <button className={`flex-1 py-2 ${signatureType === "image" ? "border-b-2 border-blue-500" : ""}`} onClick={() => setSignatureType("image")}>Upload</button>
                      <button className={`flex-1 py-2 ${signatureType === "typed" ? "border-b-2 border-blue-500" : ""}`} onClick={() => setSignatureType("typed")}>Type</button>
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
                        <button onClick={handleClearCanvas} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm">Clear</button>
                      </div>
                    )}

                    {signatureType === "image" && (
                      <div className="space-y-4">
                        {currentProfile?.signature && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">Existing Signature:</p>
                            <img src={currentProfile.signature} alt="Existing Signature" className="mx-auto w-40 h-20 object-contain border rounded" />
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
                            <img src={convertTextToSignature(inputValue)} alt="Signature Preview" className="mx-auto" style={{ width: 200, height: 80 }} />
                          </div>
                        )}
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
                  <button onClick={() => setActiveElement(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                  <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
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
