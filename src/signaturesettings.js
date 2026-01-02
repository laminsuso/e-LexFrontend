//src/signaturesettings.js
import axios from "axios";
import React, { useRef, useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "./baseUrl";

const MIN_WIDTH = 0.8;
const MAX_WIDTH = 2.6;
const SMOOTHING = 0.85;
const VELOCITY_FILTER = 0.7;

const PenIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M15.2322 5.23223L18.7682 8.76823M3 21L8.32842 19.6716L19.3284 8.67157L15.3284 4.67157L4.32843 15.6716L3 21Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default function Signatures() {
  const [signatureColor, setSignatureColor] = useState("#1a73e8");
  const [initialsColor, setInitialsColor] = useState("#1a73e8");
  const [loading, setLoading] = useState(true);

  const [isDrawing, setIsDrawing] = useState(false);

  // store saved images (base64) so we can re-render them if canvas is re-setup
  const [signature, setSignature] = useState(null);
  const [initials, setInitials] = useState(null);

  const sigCanvasRef = useRef(null);
  const initialsCanvasRef = useRef(null);
  const currentCanvasRef = useRef(null);

  const lastPointRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lineWidthRef = useRef(MAX_WIDTH);

  useEffect(() => {
    getProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Robust profile fetch that avoids 304 empty body issues
  const getProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        toast.error("Not authenticated. Please log in again.", { containerId: "signature" });
        return;
      }

      const fetchOnce = async () => {
        return axios.get(`${BASE_URL}/getProfile?ts=${Date.now()}`, {
          headers: {
            authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
      };

      // First attempt
      let response = await fetchOnce();

      // If response body is empty/undefined for any reason, retry once
      if (!response?.data || typeof response.data !== "object") {
        response = await fetchOnce();
      }

      const profile = response?.data?.profile;

      // If backend still returns null (should not after your backend fix)
      if (!profile) {
        setLoading(false);
        toast.error("Profile could not be loaded. Please log out/in.", { containerId: "signature" });
        return;
      }

      // backend may store initials as `initial` (your update sends initial)
      const sig = profile.signature || null;
      const ini = profile.initial || profile.initials || null;

      setSignature(sig);
      setInitials(ini);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.error("getProfile error:", e);
      toast.error(
        e?.response?.data?.error || "Something went wrong, please try again",
        { containerId: "signature" }
      );
    }
  };

  // --- Setup canvas correctly (avoid cumulative scaling) ---
  const setupCanvas = (canvas, color) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // reset transform so scale doesn't stack
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = MAX_WIDTH;
    ctx.strokeStyle = color;
  };

  const loadCanvasImage = (canvasRef, base64String) => {
    const canvas = canvasRef.current;
    if (!canvas || !base64String) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(rect.width / img.width, rect.height / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (rect.width - w) / 2;
      const y = (rect.height - h) / 2;

      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = base64String;
  };

  // Whenever colors or loaded images change, re-setup canvases and redraw images.
  useEffect(() => {
    if (sigCanvasRef.current) {
      setupCanvas(sigCanvasRef.current, signatureColor);
      if (signature) loadCanvasImage(sigCanvasRef, signature);
    }
    if (initialsCanvasRef.current) {
      setupCanvas(initialsCanvasRef.current, initialsColor);
      if (initials) loadCanvasImage(initialsCanvasRef, initials);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureColor, initialsColor, signature, initials]);

  const startDrawing = (e, canvas) => {
    if (!canvas) return;

    currentCanvasRef.current = canvas;
    const rect = canvas.getBoundingClientRect();

    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    lastPointRef.current = { x, y };
    lastTimeRef.current = performance.now();
    lineWidthRef.current = MAX_WIDTH;

    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !currentCanvasRef.current) return;

    const canvas = currentCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);

    const lp = lastPointRef.current;
    if (!lp) return;

    const dx = x - lp.x;
    const dy = y - lp.y;
    const dist = Math.hypot(dx, dy);

    const velocity = dist / dt;
    const targetWidth = Math.max(MAX_WIDTH / (velocity * VELOCITY_FILTER + 1), MIN_WIDTH);
    const newWidth = lineWidthRef.current * SMOOTHING + targetWidth * (1 - SMOOTHING);

    ctx.lineWidth = newWidth;

    ctx.beginPath();
    ctx.moveTo(lp.x, lp.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lineWidthRef.current = newWidth;
    lastPointRef.current = { x, y };
    lastTimeRef.current = now;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = (canvasRef, setImageState) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    if (setImageState) setImageState(null);
  };

  const handleImageUpload = (e, canvasRef, setCanvasImage) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCanvasImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const updateSignatures = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Not authenticated", { containerId: "signature" });
        return;
      }

      const signatureData = sigCanvasRef.current?.toDataURL();
      const initialsData = initialsCanvasRef.current?.toDataURL();

      if (!signatureData || !initialsData) {
        toast.error("Canvas not ready yet", { containerId: "signature" });
        return;
      }

      await axios.patch(
        `${BASE_URL}/updateProfile`,
        { signature: signatureData, initial: initialsData },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      toast.success("Signature settings saved", { containerId: "signature" });
    } catch (e) {
      console.error("updateSignatures error:", e);
      toast.error(
        e?.response?.data?.error || "Something went wrong, please try again",
        { containerId: "signature" }
      );
    }
  };

  return (
    <>
      <ToastContainer containerId={"signature"} />

      <div className="w-full bg-white rounded-[20px] min-h-[700px] flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">My Signature</h1>

        {loading ? (
          <div className="h-[250px] flex justify-center items-center">
            <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Signature */}
              <div className="flex-1 flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Signature</h2>
                <canvas
                  ref={sigCanvasRef}
                  className="w-full h-48 border-2 border-black rounded-[20px] touch-none"
                  onMouseDown={(e) => startDrawing(e, sigCanvasRef.current)}
                  onTouchStart={(e) => startDrawing(e, sigCanvasRef.current)}
                  onMouseMove={draw}
                  onTouchMove={draw}
                  onMouseUp={stopDrawing}
                  onTouchEnd={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button
                      onClick={() => clearCanvas(sigCanvasRef, setSignature)}
                      className="text-black underline text-[16px]"
                    >
                      Clear
                    </button>
                    <label className="text-black underline text-[16px] cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, sigCanvasRef, setSignature)}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    {["#0000FF", "#FF0000", "#000000"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSignatureColor(color)}
                        className={`p-1 ${
                          signatureColor === color ? "ring-2 ring-offset-2 rounded-full" : ""
                        }`}
                      >
                        <PenIcon color={color} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Initials */}
              <div className="flex-1 flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Initials</h2>
                <canvas
                  ref={initialsCanvasRef}
                  className="w-full h-32 border-2 border-black rounded-[20px] touch-none"
                  onMouseDown={(e) => startDrawing(e, initialsCanvasRef.current)}
                  onTouchStart={(e) => startDrawing(e, initialsCanvasRef.current)}
                  onMouseMove={draw}
                  onTouchMove={draw}
                  onMouseUp={stopDrawing}
                  onTouchEnd={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button
                      onClick={() => clearCanvas(initialsCanvasRef, setInitials)}
                      className="text-black underline text-[16px]"
                    >
                      Clear
                    </button>
                    <label className="text-black underline text-[16px] cursor-pointer">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, initialsCanvasRef, setInitials)}
                      />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    {["#0000FF", "#FF0000", "#000000"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setInitialsColor(color)}
                        className={`p-1 ${
                          initialsColor === color ? "ring-2 ring-offset-2 rounded-full" : ""
                        }`}
                      >
                        <PenIcon color={color} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              className="mt-auto bg-[#002864] text-white px-6 py-2 rounded-[20px] self-start"
              onClick={updateSignatures}
            >
              Save
            </button>
          </>
        )}
      </div>
    </>
  );
}
