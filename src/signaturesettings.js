import axios from 'axios';
import { useRef, useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { BASE_URL } from './baseUrl';

const PenIcon = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15.2322 5.23223L18.7682 8.76823M3 21L8.32842 19.6716L19.3284 8.67157L15.3284 4.67157L4.32843 15.6716L3 21Z"
          stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function Signatures() {
  const [signatureColor, setSignatureColor] = useState('#000000');
  const [initialsColor, setInitialsColor] = useState('#000000');
  const [loading,setLoading]=useState(true)
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  const [signature, setSignature] = useState(null); 
  const [initials, setInitials] = useState(null);
  
  const sigCanvasRef = useRef(null);
  const initialsCanvasRef = useRef(null);
  const currentCanvasRef = useRef(null);

  useEffect(() => {
   
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      let token = localStorage.getItem('token');
      let headers = {
        headers: {
          authorization: `Bearer ${token}`
        },
      };
      let response = await axios.get(`${BASE_URL}/getProfile`, headers);
      console.log("Profile data:", response.data);

     setLoading(false)
      setSignature(response.data.profile.signature);
      setInitials(response.data.profile.initial);

      
      if (response.data.profile.signature) {
        loadCanvasImage(sigCanvasRef, response.data.profile.signature);
      }
      if (response.data.profile.initial) {
        loadCanvasImage(initialsCanvasRef, response.data.profile.initial);
      }
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "signature" });
      } else {
        toast.error("Something went wrong, please try again", { containerId: "signature" });
      }
    }
  };

  const loadCanvasImage = (canvasRef, base64String) => {
    const canvas = canvasRef.current;
    if (!canvas || !base64String) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * ratio) / 2;
      const y = (canvas.height - img.height * ratio) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
      ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio); 
    };
    img.src = base64String; 
  };

  const setupCanvas = (canvas, color) => {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
  };

  useEffect(() => {
    if (sigCanvasRef.current) setupCanvas(sigCanvasRef.current, signatureColor);
    if (initialsCanvasRef.current) setupCanvas(initialsCanvasRef.current, initialsColor);
  }, [signatureColor, initialsColor]);

  const startDrawing = (e, canvas, color) => {
    currentCanvasRef.current = canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = ('touches' in e) ? 
      (e.touches[0].clientX - rect.left) * scaleX : 
      e.nativeEvent.offsetX * scaleX;
      
    const y = ('touches' in e) ? 
      (e.touches[0].clientY - rect.top) * scaleY : 
      e.nativeEvent.offsetY * scaleY;

    setIsDrawing(true);
    setLastPosition({ x, y });
  };

  const draw = (e) => {
    if (!isDrawing || !currentCanvasRef.current) return;
    
    const canvas = currentCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = ('touches' in e) ? 
      (e.touches[0].clientX - rect.left) * scaleX : 
      e.nativeEvent.offsetX * scaleX;
      
    const y = ('touches' in e) ? 
      (e.touches[0].clientY - rect.top) * scaleY : 
      e.nativeEvent.offsetY * scaleY;

    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPosition.x / scaleX, lastPosition.y / scaleY);
      ctx.lineTo(x / scaleX, y / scaleY);
      ctx.stroke();
    }
    
    setLastPosition({ x, y });
  };

  const clearCanvas = (canvasRef) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleImageUpload = (e, canvasRef, setCanvasImage) => {
    const file = e.target.files?.[0];
    if (!file || !canvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * ratio) / 2;
        const y = (canvas.height - img.height * ratio) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        ctx.drawImage(img, x, y, img.width * ratio, img.height * ratio); 

        
        setCanvasImage(canvas.toDataURL());
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file); 
  };

  const updateSignatures = async () => {
    try {
      let token = localStorage.getItem('token');
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const signatureData = sigCanvasRef.current.toDataURL();  
      const initialsData = initialsCanvasRef.current.toDataURL(); 

      console.log(signatureData)
      console.log(initialsData);
     
      let response = await axios.patch(`${BASE_URL}/updateProfile`, {
        signature: signatureData,
        initial: initialsData
      }, headers);

      console.log("Profile updated", response.data);
      toast.success("Profile updated successfully", { containerId: "signature" });
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "signature" });
      } else {
        toast.error("Something went wrong, please try again", { containerId: "signature" });
      }
    }
  };

  return (
    <>
      <ToastContainer containerId={"signature"} />

      <div className="w-full bg-white rounded-[20px] min-h-[700px] flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">My Signature</h1>

       
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Signature</h2>
            <canvas
              ref={sigCanvasRef}
              className="w-full h-48 border-2 border-black rounded-[20px] touch-none"
              onMouseDown={(e) => startDrawing(e, sigCanvasRef.current, signatureColor)}
              onTouchStart={(e) => startDrawing(e, sigCanvasRef.current, signatureColor)}
              onMouseMove={draw}
              onTouchMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onTouchEnd={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button 
                  onClick={() => clearCanvas(sigCanvasRef)}
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
                {['#0000FF', '#FF0000', '#000000'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSignatureColor(color)}
                    className={`p-1 ${signatureColor === color ? 'ring-2 ring-offset-2 rounded-full' : ''}`}
                    style={{ ringColor: color }}
                  >
                    <PenIcon color={color} />
                  </button>
                ))}
              </div>
            </div>
          </div>

        
          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Initials</h2>
            <canvas
              ref={initialsCanvasRef}
              className="w-full h-32 border-2 border-black rounded-[20px] touch-none"
              onMouseDown={(e) => startDrawing(e, initialsCanvasRef.current, initialsColor)}
              onTouchStart={(e) => startDrawing(e, initialsCanvasRef.current, initialsColor)}
              onMouseMove={draw}
              onTouchMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onTouchEnd={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button 
                  onClick={() => clearCanvas(initialsCanvasRef)}
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
                {['#0000FF', '#FF0000', '#000000'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setInitialsColor(color)}
                    className={`p-1 ${initialsColor === color ? 'ring-2 ring-offset-2 rounded-full' : ''}`}
                    style={{ ringColor: color }}
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
      </div>
    </>
  );
}
