import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import DatePicker from "react-datepicker";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { toast, ToastContainer } from "react-toastify";

// Multiple CDN fallbacks for PDF.js worker
const PDF_WORKER_URLS = [
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
];

// Function to set PDF worker with fallback
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

const FRONTEND_SIGNATURE_WIDTH = 200;
const FRONTEND_SIGNATURE_HEIGHT = 80;
const FRONTEND_TEXT_WIDTH = 200;
const FRONTEND_TEXT_HEIGHT = 40;
const FRONTEND_DATE_WIDTH = 120;
const FRONTEND_DATE_HEIGHT = 45;

// Signature theme
const SIGNATURE_BLUE = '#1a73e8';     // e-signature blue
const MIN_WIDTH = 0.8;                // thinnest stroke
const MAX_WIDTH = 2.6;                // thickest stroke
const SMOOTHING = 0.85;               // line width smoothing (0..1)
const VELOCITY_FILTER = 0.7;          // higher => less thickness change

const SignDocumentPage = () => {
  const { documentId } = useParams();
 
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState("");
  const [file, setFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1); // Remove the constant declaration
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
  const location = useLocation();

  useEffect(() => {
    const getDocument = async () => {
      try {
        
        const token = localStorage.getItem("token");
        let params = new URLSearchParams(location.search);
        let email = params.get("email");

        if (!token) {
          let responseone = await axios.post(`${BASE_URL}/registerAndLogin`, {
            email,
          });
          console.log(responseone.data)
          localStorage.setItem("token", responseone.data.token);
          setCurrentUser(responseone.data.user);
          setPreference(responseone.data.preference);
          setCurrentProfile(responseone.data.profile);

          const response = await axios.get(
            `${BASE_URL}/getSpecificDoc/${documentId}`
          );
          setDocumentData(response.data.doc);
          setFile(response.data.doc.file);
          const elements =
            response.data.doc.elements?.map((el) => ({
              ...el,
              id: el._id || Math.random().toString(36).substr(2, 9),
              value: null,
              label: el.label || el.type,
            })) || [];
          setSignatureElements(elements);
        } else {
          const getUser = await axios.get(`${BASE_URL}/getUser`, {
            headers: { authorization: `Bearer ${token}` },
          });
          console.log(getUser.data)
          setCurrentUser(getUser.data.user);
          setPreference(getUser.data.preference);
          setCurrentProfile(getUser.data.profile);
          const response = await axios.get(
            `${BASE_URL}/getSpecificDoc/${documentId}`);
          const docData = response.data.doc;
          setDocumentData(docData);
          setFile(docData.file);
          const elements =
            docData.elements?.map((el) => ({
              ...el,
              id: el._id || Math.random().toString(36).substr(2, 9),
              value: null,
              label: el.label || el.type,
            })) || [];
          setSignatureElements(elements);
        }
      } catch (error) {
        
        console.error("Document loading error:", error);
        setLoadingError("Failed to load document");
      }
    };
    getDocument();
  }, [documentId, location.search]);

  useEffect(() => {
    if (
      canvasRef.current &&
      activeElement?.type === "signature" &&
      signatureType === "draw"
    ) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineWidth = MAX_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = 'round';
      ctx.strokeStyle = SIGNATURE_BLUE;
      setCanvasContext(ctx);
      if (currentProfile?.signature) {
        const img = new Image();
        img.onload = () =>
          ctx.drawImage(
            img,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        img.src = currentProfile.signature;
      }
    }
  }, [activeElement, signatureType, currentProfile]);

  // Enhanced PDF loading handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log("PDF loaded successfully with", numPages, "pages");
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfLoadError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error("PDF loading error:", error);
    setPdfLoading(false);
    
    // Try next worker if available
    if (error.name === 'MissingPDFException' || error.message?.includes('worker')) {
      tryNextWorker();
      // Force re-render to try with new worker
      setTimeout(() => {
        setFile(prev => prev);
      }, 100);
    } else {
      setPdfLoadError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    }
  };


  const getEventCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Handle touch events (mobile)
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // Handle mouse events (desktop)
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };



  const onDocumentLoadProgress = ({ loaded, total }) => {
    if (total > 0) {
      const progress = Math.round((loaded / total) * 100);
      console.log(`Loading progress: ${progress}%`);
    }
  };

  // Function to validate and fix PDF URL
  const validateAndFixPDFUrl = (url) => {
    if (!url) return null;
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      return `${BASE_URL}${url}`;
    }
    
    // Handle URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
      return `https://${url}`;
    }
    
    return url;
  };

      // Helpers to make the ink look like a real signature
    const lastPointRef = useRef(null);
    const lastTimeRef  = useRef(0);
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
      const dt = Math.max(now - lastTimeRef.current, 1); // avoid divide by 0

      const lp = lastPointRef.current;
      const dx = p.x - lp.x;
      const dy = p.y - lp.y;
      const dist = Math.hypot(dx, dy);

      // Velocity in px/ms
      const velocity = dist / dt;

      // Map velocity to stroke width (slower => thicker)
      const targetWidth = Math.max(MAX_WIDTH / (velocity * VELOCITY_FILTER + 1), MIN_WIDTH);
      const newWidth = lineWidthRef.current * SMOOTHING + targetWidth * (1 - SMOOTHING);

      canvasContext.strokeStyle = SIGNATURE_BLUE;
      canvasContext.lineCap = 'round';
      canvasContext.lineJoin = 'round';
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


  const handleElementClick = (element) => {
    if (element?.recipientEmail !== currentUser?.email){
      toast.error(`Your current email is ${currentUser.email} it is for ${element.recipientEmail}`,{containerId:"signaturesign"})
      return;
    } 
    setActiveElement(element);
    setSignatureType(null);
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

  const convertTextToSignature = (text) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = FRONTEND_SIGNATURE_WIDTH;
    canvas.height = FRONTEND_SIGNATURE_HEIGHT;
    ctx.font = "italic 42px 'Great Vibes', cursive";
    ctx.fillStyle = SIGNATURE_BLUE;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL();
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
        break;
      case "checkbox":
        value = inputValue;
        break;
      case "image":
        value = inputValue;
        break;
      case "initials":
        value = inputValue.toUpperCase();
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
    setSignatureElements((prev) =>
      prev.map((el) => (el.id === activeElement.id ? { ...el, value } : el))
    );
    setActiveElement(null);
    setInputValue("");
  };

  const handleImageUpload = (e) => {
    if (!activeElement || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureElements((prev) =>
        prev.map((el) =>
          el.id === activeElement.id
            ? { ...el, value: event.target.result }
            : el
        )
      );
      setActiveElement(null);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleClearCanvas = () => {
    if (!currentUser?.signature) {
      canvasContext.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    } else {
      canvasContext.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      const img = new Image();
      img.onload = () =>
        canvasContext.drawImage(
          img,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      img.src = currentUser.signature;
    }
  };

  const handleSaveDocument = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);
      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        {
          documentId,
          elements: signatureElements,
        },
        {
          headers: { authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const file = new File([blob], `signedDocument-${documentId}`, {
        type: "application/pdf",
      });
      const dataForm = new FormData();
      dataForm.append("document", file);
      dataForm.append("documentId", documentId);
      await axios.patch(`${BASE_URL}/editDocument/${documentId}`, dataForm, {
        headers: { authorization: `Bearer ${token}` },
      });
      await axios.patch(
        `${BASE_URL}/signDocument`,
        { documentId, email: currentUser.email },
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );
      toast.success("Document signed", {
        containerId: "signaturesign",
      });
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
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );
      toast.success("Sign declined successfully", {
        containerId: "signaturesign",
      });
      setTimeout(() => window.close(), 500);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Something went wrong", {
        containerId: "signaturesign",
      });
    }
  };

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
      stamp: "border-red-500 bg-red-50"
    };
  
    const dimensions = {
      signature: { width: FRONTEND_SIGNATURE_WIDTH, height: FRONTEND_SIGNATURE_HEIGHT },
      date: { width: FRONTEND_DATE_WIDTH, height: FRONTEND_DATE_HEIGHT },
      stamp: { width: FRONTEND_SIGNATURE_WIDTH, height: FRONTEND_SIGNATURE_HEIGHT },
      default: { width: FRONTEND_TEXT_WIDTH, height: FRONTEND_TEXT_HEIGHT }
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
      >
        <div className="flex-1">
          {element.value ? (
            element.type === "signature" || element.type === "image" || element.type === "stamp" ? (
              <img
                src={element.value}
                alt={element.type}
                className="w-full h-full object-contain"
              />
            ) : element.type === "checkbox" ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={element.value}
                  readOnly
                  className="w-4 h-4"
                />
              </div>
            ) : element.type === "initials" ? (
              <div className="text-2xl font-bold text-center">
                {element.value}
              </div>
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

  // Enhanced PDF rendering with better error handling
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
                // Force re-render
                setFile(prev => prev);
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
      {/* Add Page Navigation */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 mb-4 bg-white p-2 rounded shadow sticky top-0 z-40">
          <button
            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Previous
          </button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
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
              (el) => !el.value && el.recipientEmail === currentUser?.email
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
                {signatureElements.filter(element => 
  element.pageNumber === pageNumber || !element.pageNumber // Show elements without pageNumber for backward compatibility
).map(renderFieldPreview)}
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={file} 
                  alt="Document" 
                  className="max-w-full h-auto"
                  onError={(e) => {
                    console.error("Image loading error:", e);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{display: 'none'}} className="text-red-500 text-center mt-8">
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

          {/* Modal for editing elements - keeping your existing modal code */}
          {activeElement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">
                  {activeElement.label}
                </h3>

                {activeElement.type === "signature" && (
                  <>
                    <div className="flex border-b mb-4">
                      <button
                       
                        className={`flex-1 py-2 ${
                          signatureType === "draw"
                            ? "border-b-2 border-blue-500"
                            : ""
                        }`}
                        onClick={() => setSignatureType("draw")}
                      >
                        Draw
                      </button>
                      <button

                      
                        className={`flex-1 py-2 ${
                          signatureType === "image"
                            ? "border-b-2 border-blue-500"
                            : ""
                        }`}
                        onClick={() => setSignatureType("image")}
                      >
                        Upload
                      </button>
                      <button

            
                        className={`flex-1 py-2 ${
                          signatureType === "typed"
                            ? "border-b-2 border-blue-500"
                            : ""
                        }`}
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
                            <p className="text-sm text-gray-600 mb-2">
                              Existing Signature:
                            </p>
                            <img
                              src={currentProfile.signature}
                              alt="Existing Signature"
                              className="mx-auto w-40 h-20 object-contain border rounded"
                            />
                          </div>
                        )}
                        <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
                          {currentProfile?.signature
                            ? "Click to upload new image"
                            : "Click to upload signature image"}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
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
                              style={{
                                width: FRONTEND_SIGNATURE_WIDTH,
                                height: FRONTEND_SIGNATURE_HEIGHT,
                              }}
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
                      checked={inputValue}
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
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    {inputValue && (
                      <img
                        src={inputValue}
                        alt="Preview"
                        className="mx-auto max-h-32 object-contain"
                      />
                    )}
                  </div>
                )}

                {activeElement.type === "initials" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) =>
                        setInputValue(e.target.value.toUpperCase())
                      }
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
                    {(activeElement.options?.split(",") || []).map(
                      (option, i) => (
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
                      )
                    )}
                  </div>
                )}

                {activeElement.type === "date" && (
                  <DatePicker
                    selected={selectedDate}
                    onChange={setSelectedDate}
                    inline
                    className="w-full text-center"
                  />
                )}

                {["text", "name", "email", "jobTitle", "company"].includes(
                  activeElement.type
                ) && (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    placeholder={`Enter ${activeElement.type}`}
                  />
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActiveElement(null)}
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                   
                  >
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
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Updating Document
            </h3>
            <p className="text-gray-600">
              Please wait while the document is being updated
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignDocumentPage;