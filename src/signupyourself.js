import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { pdfjs } from 'react-pdf';
import axios from 'axios';
import { BASE_URL } from './baseUrl';
import { ToastContainer,toast } from 'react-toastify';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const SignYourselfPage = () => {
  const [step, setStep] = useState(1);
  const [loading,setLoading]=useState(false)
  const [currentUser,setCurrentUser]=useState("")
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({ title: '', note: '', folder: 'default' });
  const [signatureElements, setSignatureElements] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [signatureText, setSignatureText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasContext, setCanvasContext] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentProfile, setCurrentProfile] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [preference, setPreference] = useState({
    user: "",
    allowed_signature_types: "",
    notify_on_signatures: false,
    timezone: "",
    date_format: "",
    send_in_order: "",
  });
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userDetails, setUserDetails] = useState({ name: '', jobTitle: '', company: '', email: '' });
  const [checkboxText, setCheckboxText] = useState('');
  const [editingElement, setEditingElement] = useState(null);
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [signatureType, setSignatureType] = useState('draw');

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const datePickerRef = useRef(null);
  useEffect(() => {
    
    if (canvasRef.current && currentProfile?.signature && signatureType === 'draw') {
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.src = currentProfile.signature;
      
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      img.onload = () => {
        ctx.drawImage(
          img,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      };
    }
  
   
    if (signatureType === 'image' && currentProfile?.signature) {
      setImagePreview(currentProfile.signature);
    }
  
  
    if (signatureType === 'typed' && currentProfile?.name) {
      setSignatureText(currentProfile.name);
    }
  }, [currentProfile, signatureType, selectedTool]);

  
  
  useEffect(() => {
    if (canvasRef.current && selectedTool === 'signature' && signatureType === 'draw') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      setCanvasContext(ctx);
    }
  }, [selectedTool, signatureType]);


useEffect(()=>{
getUser()
},[])
  const getUser=async()=>{
    try{
      let token=localStorage.getItem('token')
      const getUser = await axios.get(`${BASE_URL}/getUser`, {
        headers: { authorization: `Bearer ${token}` },
      });
      setCurrentUser(getUser.data.user)
      setCurrentProfile(getUser.data.profile);
      if(getUser.data.preference.allowed_signature_types=="all" || getUser.data.preference.allowed_signature_types=="draw"){
        setSignatureType('draw')
      }else if(getUser.data.preference.allowed_signature_types=="all" || getUser.data.preference.allowed_signature_types=="upload"){
        setSignatureType('image')
      }else if(getUser.data.preference.allowed_signature_types=="all" || getUser.data.preference.allowed_signature_types=="type"){
        setSignatureType('typed')
      }
      
      setPreference(getUser.data.preference);
    }catch(e){

    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && /\.(pdf|doc|docx)$/i.test(selectedFile.name)) {
      setFile(selectedFile);
    }else{
      toast.error("Invalid file format",{containerId:"signyourself"})
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if(!file){
      toast.error("Please upload document",{containerId:"signyourself"})
    }
    if (file && formData.title) setStep(2);
  };

  const createElement = (type, data, x = 50, y = 50) => {
    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      ...data
    };
    setSignatureElements(prev => [...prev, newElement]);
  };

  const deleteElement = (id) => {
    setSignatureElements(prev => prev.filter(el => el.id !== id));
  };

  const handleSaveDocument = async () => {
    const formDataToSend = new FormData();
    
let signers=[
  {
    name:currentUser.name,
    email:currentUser.email,
    signed:true
  }
] 
setLoading(true)
    formDataToSend.append('document', file);
    
    formDataToSend.append('title', formData.title);
    formDataToSend.append('note', formData.note);
    formDataToSend.append('folder', formData.folder);
    formDataToSend.append('elements', JSON.stringify(signatureElements));
    formDataToSend.append('userDetails', JSON.stringify(userDetails));
formDataToSend.append('status','completed')
    formDataToSend.append('signers',JSON.stringify(signers))
    try {
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(BASE_URL+'/saveDocument', formDataToSend, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      console.log(response)
      console.log("response")
      if (response.status==200) {
        setLoading(false)
       toast.success(response.data.message,{containerId:"signyourself"})
      setTimeout(()=>{
        setStep(1)
      },500)
      } 
    } catch (error) {
      setLoading(false)
      console.error('Error saving document:', error);
      if(error?.response?.data?.error){
        toast.error(error?.response?.data?.error,{containerId:"signyourself"})
      }else{
        toast.error("Something went wrong please try again",{containerId:"signyourself"})
      }
     
    }
  };



  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    canvasContext.beginPath();
    canvasContext.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    canvasContext.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    canvasContext.stroke();
  };

  const stopDrawing = () => {
    canvasContext.closePath();
    setIsDrawing(false);
  };

  const saveSignature = () => {
    if (signatureType === 'draw') {
      const dataUrl = canvasRef.current.toDataURL();
      createElement('signature', { data: dataUrl }, dropPosition.x, dropPosition.y);
    } else if (signatureType === 'typed') {
      createElement('text', { text: signatureText, isSignature: true }, dropPosition.x, dropPosition.y);
    } else if (signatureType === 'image' && imagePreview) {
      createElement('signature', { data: imagePreview }, dropPosition.x, dropPosition.y);
    }
    setSelectedTool(null);
    setSignatureText('');
    setImagePreview(null);
  };
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  const handleMouseDown = (e, id) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const element = signatureElements.find(el => el.id === id);
    setPositionOffset({ x: x - element.x, y: y - element.y });
    setDraggedElement(id);
  };

  const handleMouseMove = (e) => {
    if (!draggedElement) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - positionOffset.x;
    const y = e.clientY - rect.top - positionOffset.y;
    setSignatureElements(signatureElements.map(el =>
      el.id === draggedElement ? { ...el, x, y } : el
    ));
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

  

  const handleToolDragStart = (type) => (e) => {
    e.dataTransfer.setData('text/plain', type);
  };

  const handleDocumentDrop = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDropPosition({ x, y });
    const type = e.dataTransfer.getData('text/plain');

    switch (type) {
      case 'signature':
        setSelectedTool('signature');
        break;
      case 'date':
        createElement('date', { date: selectedDate, text: selectedDate.toLocaleDateString() }, x, y);
        break;
      case 'checkbox':
        createElement('checkbox', { checked: false, text: 'Checkbox' }, x, y);
        break;
      case 'name':
      case 'jobTitle':
      case 'company':
      case 'email':
        createElement('text', { text: userDetails[type] || type.charAt(0).toUpperCase() + type.slice(1) }, x, y);
        break;
     
        break;
    }
  };

  const updateDateElement = (id, newDate) => {
    setSignatureElements(prev => prev.map(el =>
      el.id === id ? { ...el, date: newDate, text: newDate.toLocaleDateString() } : el
    ));
  };

  return (
   <>
   <ToastContainer containerId={"signyourself"}/>


   <div className="admin-content h-full">
      {step === 1 ? (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Sign Yourself</h2>
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Document Title*</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-[20px]"
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
                {file ? file.name : 'Click to choose file or drag and drop'}
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">PDF, PNG, JPG, JPEG, DOCX</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea
                className="w-full p-2 border rounded-[20px]"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Note to myself"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Folder</label>
              <select
                className="w-full p-2 border rounded-[20px]"
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
              >
                <option value="default">Default</option>
                <option value="contracts">Contracts</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#002864] text-white py-2 px-4 rounded-[20px]"
            >
              Next
            </button>
          </form>
        </div>
      ) : (
        <div
          className="flex h-screen bg-gray-100"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDrop={handleDocumentDrop}
          onDragOver={(e) => e.preventDefault()}
          ref={containerRef}
        >
          <div className="flex-1 p-4 overflow-auto relative">
            <button
              onClick={handleSaveDocument}
              disabled={signatureElements?.length==0?true:false}
              className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg "
            >
              Finish
            </button>

            {file?.type === 'application/pdf' ? (
              <div className="pdf-container">
                <Document
                  file={file}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={console.error}
                  loading="Loading PDF..."
                >
                  <Page
                    pageNumber={pageNumber}
                    width={800}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </Document>
              </div>
            ) : (
              <img
                src={URL.createObjectURL(file)}
                alt="Document"
                className="max-w-full h-auto"
              />
            )}

            {signatureElements.map((element) => (
              <div
                key={element.id}
                className="absolute cursor-move"
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  zIndex: draggedElement === element.id ? 1000 : 1
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                <div className="relative">
                  {element.type === 'signature' && (
                    <img src={element.data} alt="Signature" className="w-32 h-32" />
                  )}
                  {element.type === 'text' && (
                    <span className={`text-2xl ${element.isSignature ? 'font-script italic' : ''}`}>
                      {element.text}
                    </span>
                  )}
                  {element.type === 'date' && (
                    <div className="bg-white p-1 rounded">
                      <DatePicker
                        selected={element.date || new Date()}
                        onChange={(date) => updateDateElement(element.id, date)}
                        customInput={<span className="text-lg cursor-pointer">{element.text}</span>}
                        popperPlacement="auto"
                        ref={datePickerRef}
                      />
                    </div>
                  )}
                  {element.type === 'checkbox' && (
                    <div className="flex items-center gap-2 bg-white p-1">
                      <input
                        type="checkbox"
                        className="w-6 h-6 cursor-move"
                        checked={element.checked}
                        onChange={(e) => {
                          setSignatureElements(prev => prev.map(el =>
                            el.id === element.id ? { ...el, checked: e.target.checked } : el
                          ));
                        }}
                      />
                      {editingElement === element.id ? (
                        <input
                          type="text"
                          value={element.text}
                          className="border p-1"
                          onChange={(e) => {
                            setSignatureElements(prev => prev.map(el =>
                              el.id === element.id ? { ...el, text: e.target.value } : el
                            ));
                          }}
                          onBlur={() => setEditingElement(null)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-text"
                          onClick={() => setEditingElement(element.id)}
                        >
                          {element.text}
                        </span>
                      )}
                    </div>
                  )}
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

          <div className="w-80 bg-white p-4 shadow-lg overflow-y-scroll">
            <h3 className="text-xl font-bold mb-4">Signing Tools</h3>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">User Details</h4>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-2 border rounded mb-2"
                  value={userDetails.name}
                  onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  className="w-full p-2 border rounded mb-2"
                  value={userDetails.jobTitle}
                  onChange={(e) => setUserDetails({ ...userDetails, jobTitle: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Company"
                  className="w-full p-2 border rounded mb-2"
                  value={userDetails.company}
                  onChange={(e) => setUserDetails({ ...userDetails, company: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-2 border rounded"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                />
              </div>

              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Drag & Drop Elements</h4>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('name')}
                >
                  Name
                </div>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('jobTitle')}
                >
                  Job Title
                </div>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('company')}
                >
                  Company
                </div>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('email')}
                >
                  Email
                </div>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('date')}
                >
                  Date
                </div>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('checkbox')}
                >
                  Checkbox
                </div>
              </div>

              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Signature</h4>
                <div
                  className="tool-item p-2 mb-2 bg-gray-100 cursor-move"
                  draggable
                  onDragStart={handleToolDragStart('signature')}
                >
                  Add Signature
                </div>
             
              </div>
            </div>
          </div>

          {selectedTool === 'signature' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <h3 className="text-xl font-bold mb-4">Add Signature</h3>

                <div className="flex border-b mb-4">
                  <button
                    className={`flex-1 py-2 ${signatureType === 'draw' ? 'border-b-2 border-blue-500' : ''}`}
                    onClick={() => setSignatureType('draw')}
                    disabled={
                      !(
                        preference?.allowed_signature_types === "draw" ||
                        preference?.allowed_signature_types === "all"
                      )
                    }
                  >
                    Draw
                  </button>
                  <button
                    className={`flex-1 py-2 ${signatureType === 'image' ? 'border-b-2 border-blue-500' : ''}`}
                    onClick={() => setSignatureType('image')}
                    disabled={
                      !["upload", "all"].includes(
                        preference?.allowed_signature_types
                      )
                    }
                  >
                    Upload Image
                  </button>
                  <button
                   disabled={
                    !["type", "all"].includes(
                      preference?.allowed_signature_types
                    )
                  }
                    className={`flex-1 py-2 ${signatureType === 'typed' ? 'border-b-2 border-blue-500' : ''}`}
                    onClick={() => setSignatureType('typed')}
                  >
                    Type
                  </button>
                </div>

                {signatureType === 'draw' && (
                  <>
                    <canvas
                      ref={canvasRef}
                      width={200}
                      height={80}
                      className="border mb-4"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <button
                      onClick={() => {
                        if (canvasRef.current) {
                          const ctx = canvasRef.current.getContext('2d');
                          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        }
                      }}
                      className="bg-gray-200 px-4 py-2 rounded mb-4"
                    >
                      Clear
                    </button>
                  </>
                )}

{signatureType === 'image' && (
  <div className="space-y-4">
    {imagePreview && (
      <div className="mb-4">
        <p className="text-sm mb-2">Signature Preview:</p>
        <img 
          src={imagePreview} 
          alt="Signature preview" 
          className="w-32 h-32 border object-contain"
        />
      </div>
    )}
    <label className="w-full border-2 border-dashed p-8 text-center cursor-pointer block mb-4">
      {imagePreview ? 'Replace signature image' : 'Click to upload signature image'}
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </label>
  
  </div>
)}

                {signatureType === 'typed' && (
  <input
    type="text"
    value={signatureText}
    onChange={(e) => setSignatureText(e.target.value)}
    className="w-full p-2 border rounded mb-4"
    placeholder="Type your name"
  />
)}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSignature}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={(signatureType === 'typed' && !signatureText)}
                  >
                    Add Signature
                  </button>
                </div>
              </div>
            </div>
          )}

        
        </div>
      )}
    </div>
   {loading?(
<>
<div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
  <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4 text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
      Attaching Document Elements
    </h3>
    <p className="text-gray-600">
      Please wait while your elements are being attached to the document
    </p>
  </div>
</div>
</>
   ):''}
   </>
  );
};

export default SignYourselfPage;