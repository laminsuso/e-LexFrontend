import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pdfjs } from "react-pdf";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer,toast } from "react-toastify";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
let draftId = `${Math.random() * 999999999 + Date.now()}`;

const DUMMY_EMAILS = [
  "john.doe@example.com",
  "jane.smith@example.com",
  "michael.johnson@example.com",
  "sarah.williams@example.com",
  "david.brown@example.com",
  "lemightyeagle@gmail.com",
];

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
};

const RequestSignaturesPage = () => {
  const [emails, setEmails] = useState([]);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading,setLoading]=useState(false)
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    folder: "default",
    recipients: [],
  });
  const [signatureElements, setSignatureElements] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [isSocial,setIsSocial]=useState(false)
  const [contactBook,setContactBook]=useState([])
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [numPages, setNumPages] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState("");
  const [shareId,setShareId]=useState("")
  const [radioOptions, setRadioOptions] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showSendPopup,setShowSendPopup]=useState(false)
  const [currentTool, setCurrentTool] = useState(null);
  const [isPreviewMode] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && /\.(pdf|png|jpg|jpeg|docx)$/i.test(selectedFile.name)) {
      setFile(selectedFile);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if(formData.title.length==0){
      toast.error("Please enter document title",{containerId:"requestSignature"})
    }else if(!file){
      toast.error("Please select a document",{containerId:"requestSignature"})
    }else if(formData.recipients?.length==0){
      toast.error("Please select recipients",{containerId:"requestSignature"})
    }
    if (file && formData.title && formData.recipients.length > 0) {
      setStep(2);
    }
  };

const fetchContactBooks=async()=>{
try{
  let token=localStorage.getItem('token')
  let headers={
    headers:{
      authorization:`Bearer ${token}`
    }
  }
let response=await axios.get(`${BASE_URL}/fetchContactBooks`,headers)
console.log(response.data)
setContactBook(response.data.contactBooks)
console.log("fetchContactBooks")
}catch(e){
if(e?.response?.data?.error){
  toast.error(e?.response?.data?.error,{containerId:"requestSignature"})
}else{
  toast.error("Something went wrong pleae try again",{containerId:"requestSignature"})
}
}
}
useEffect(()=>{
fetchContactBooks();
},[])



  const addRecipient = () => {
   
      const isEmailExists = formData.recipients.some(
        (recipient) => recipient.email === selectedEmail
      );
    
    
      if (isEmailExists) {
        
        toast.error("This email has already been added to recipients.", { containerId: "requestSignature" });
      } else {
        setFormData({
          ...formData,
          recipients: [...formData.recipients, { email: selectedEmail }],
        });
        setSelectedEmail("");
      }
    
    
  };
const sendThroughEmail=async()=>{
try{
  const token = localStorage.getItem("token");
  const headers = { headers: { authorization: `Bearer ${token}` } };
setLoading(true)
setIsSocial(false)
  const form = new FormData();
  form.append("document", file);
  form.append("title", formData.title);
  form.append("elements", JSON.stringify(signatureElements));
 

  const saveResponse = await axios.post(
    `${BASE_URL}/saveDocument`,
    form,
    headers
  );
  console.log(saveResponse)
  console.log('save response')

  await axios.post(
    `${BASE_URL}/sendSignRequest`,
    {
      ...formData,
      documentId: saveResponse.data.doc._id,
      elements: signatureElements,
     
    },
    headers
  );

  toast.success(`Signature request sent`,{containerId:"requestSignature"});
  setFile(null);
  setFormData({
    title: "",
    note: "",
    folder: "default",
    recipients: [],
  });
  setSignatureElements([]);
  setLoading(false)
 window.location.reload(true) 
}catch(e){
  if(e?.response?.data?.error){
    toast.error(e?.response?.data?.error,{containerId:"requestSignature"})
  }else{
    toast.error("Something went wrong pleae try again",{containerId:"requestSignature"})
  }
  setLoading(false)
setIsSocial(false)

}
}


const sendThroughShare=async(email)=>{
try{
  if(!shareId.length>0){
    setLoading(true)
    setIsSocial(true)
    const token = localStorage.getItem("token");
  const headers = { headers: { authorization: `Bearer ${token}` } };

  const form = new FormData();
  form.append("document", file);
  form.append("title", formData.title);
  form.append("elements", JSON.stringify(signatureElements));
 let signers=signatureElements.map((val,i)=>{
  return {
    email:val.recipientEmail
  }
 })


signers = signers.filter((value, index, self) => 
  index === self.findIndex((t) => (
    t.email === value.email
  ))
);
form.append('signers',JSON.stringify(signers))
  const saveResponse = await axios.post(
    `${BASE_URL}/saveDocument`,
    form,
    headers
  );
  const link = `${window.location.origin}/admin/request-signatures/sign-document/${saveResponse.data.doc._id}?email=${email}`;
  setShareId(saveResponse.data.doc._id)
    if (navigator.share) {
      navigator.share({
        title: 'Sign Document',
        text: 'Please sign the document',
        url: link,
      })
      .then(() => {
        toast.success(`Signature request sent`,{containerId:"requestSignature"});
      
        setLoading(false)
        setIsSocial(false)
      
      })
      .catch((error) => {
        console.log(error.message)
        toast.error("Failed to share the link", { containerId: "requestSignature" });
      });
    } 
  }else{
    setLoading(false)
    setIsSocial(false)
    const link = `${window.location.origin}/admin/request-signatures/sign-document/${shareId}?email=${email}`;
  setShareId("")
    if (navigator.share) {
      navigator.share({
        title: 'Sign Document',
        text: 'Please sign the document',
        url: link,
      })
      .then(() => {
        toast.success(`Signature request sent`,{containerId:"requestSignature"});
      
       
      
      })
      .catch((error) => {
        console.log(error.message)
        toast.error("Failed to share the link", { containerId: "requestSignature" });
      });
    } 
  }
 

  

}catch(e){
  setLoading(false)
setIsSocial(false)
  if(e?.response?.data?.error){
    toast.error(e?.response?.data?.error,{containerId:"requestSignature"})
  }else{
    toast.error("Something went wrong pleae try again",{containerId:"requestSignature"})
  }

}
}


  const removeRecipient = (index) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index),
    });
  };

  const createPlaceholder = (type, email, x = 50, y = 50, options = {}) => {
    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      recipientEmail: email,
      placeholderText: getPlaceholderText(type, email, options),
      isPlaceholder: true,
      ...options,
      value: "",
    };
    setSignatureElements((prev) => [...prev, newElement]);
  };

  const getPlaceholderText = (type, email, options) => {
    const texts = {
      [FIELD_TYPES.SIGNATURE]: `Signature for ${email}`,
      
      [FIELD_TYPES.INITIALS]: `Initials for ${email}`,
      [FIELD_TYPES.NAME]: `Name`,
      [FIELD_TYPES.JOB_TITLE]: `Job Title`,
      [FIELD_TYPES.COMPANY]: `Company`,
      [FIELD_TYPES.DATE]: `Date`,
      [FIELD_TYPES.TEXT]: `Text Field`,
      [FIELD_TYPES.CHECKBOX]: `Checkbox`,
      // [FIELD_TYPES.DROPDOWN]: `Dropdown: ${options.options || ""}`,
      // [FIELD_TYPES.RADIO]: `Radio: ${options.options || ""}`,
      [FIELD_TYPES.IMAGE]: `Image`,
      [FIELD_TYPES.EMAIL]: `Email`,
    };
    return texts[type];
  };

  const deleteElement = (id) => {
    setSignatureElements((prev) => prev.filter((el) => el.id !== id));
  };

  const handleMouseDown = (e, id) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const element = signatureElements.find((el) => el.id === id);
    setPositionOffset({ x: x - element.x, y: y - element.y });
    setDraggedElement(id);
  };

  const handleMouseMove = (e) => {
    if (!draggedElement) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - positionOffset.x;
    const y = e.clientY - rect.top - positionOffset.y;
    setSignatureElements(
      signatureElements.map((el) =>
        el.id === draggedElement ? { ...el, x, y } : el
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

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
    const options = JSON.parse(e.dataTransfer.getData("options")) || {};

    if (type && email) {
     
        createPlaceholder(type, email, x, y, options);
      
    }
  };

  // const handleOptionsSubmit = () => {
  //   const options = {
  //     options:
  //       currentTool.type === FIELD_TYPES.DROPDOWN
  //         ? dropdownOptions
  //         : radioOptions,
  //   };
  //   createPlaceholder(
  //     currentTool.type,
  //     currentTool.email,
  //     dropPosition.x,
  //     dropPosition.y,
  //     options
  //   );
  //   setShowOptionsModal(false);
  //   setDropdownOptions("");
  //   setRadioOptions("");
  // };

  const handleSendRequest = async () => {
    try {

     let check=formData.recipients.every(recipient => {
        return signatureElements.some(signature => signature.recipientEmail === recipient.email);
      });
      if (!check) {
        toast.error("Atleast one element should be created for each recipient",{containerId:"requestSignature"});
        return
      } 

    //   const token = localStorage.getItem("token");
    //   const headers = { headers: { authorization: `Bearer ${token}` } };

    //   const form = new FormData();
    //   form.append("document", file);
    //   form.append("title", formData.title);
    //   form.append("elements", JSON.stringify(signatureElements));
     

    //   const saveResponse = await axios.post(
    //     `${BASE_URL}/saveDocument`,
    //     form,
    //     headers
    //   );
    //   console.log(saveResponse)
    //   console.log('save response')

    //   await axios.post(
    //     `${BASE_URL}/sendSignRequest`,
    //     {
    //       ...formData,
    //       documentId: saveResponse.data.doc._id,
    //       elements: signatureElements,
         
    //     },
    //     headers
    //   );

    //   toast.success(`Signature request sent`,{containerId:"requestSignature"});
    //   setFile(null);
    //   setFormData({
    //     title: "",
    //     note: "",
    //     folder: "default",
    //     recipients: [],
    //   });
    //   setSignatureElements([]);
    //  window.location.reload(true) 
     setShowSendPopup(true)
    } catch (error) {
      console.error("Submission failed:", error);
    if(error?.response?.data?.error){
      toast.error(error.response.data.error,{containerId:"requestSignature"});
    }else{
      toast.error("Failed to send signature requests",{containerId:"requestSignature"});
    }
    }
  };

  const handleElementClick = (element) => {};

  const renderFieldPreview = (element) => {
    const baseClasses = "border-2 border-dashed p-2 cursor-move min-w-[100px] min-h-[40px]";
    const typeClasses = {
      [FIELD_TYPES.SIGNATURE]: "border-blue-500 bg-blue-50",
   
      [FIELD_TYPES.INITIALS]: "border-green-500 bg-green-50",
      [FIELD_TYPES.DATE]: "border-purple-500 bg-purple-50",
      // [FIELD_TYPES.DROPDOWN]: "border-yellow-500 bg-yellow-50",
      // [FIELD_TYPES.RADIO]: "border-pink-500 bg-pink-50",
      [FIELD_TYPES.IMAGE]: "border-indigo-500 bg-indigo-50",
      [FIELD_TYPES.CHECKBOX]: "border-orange-500 bg-orange-50",
    };
    
  
    const renderContent = () => {
      if (element.value) {
        switch(element.type) {
          case FIELD_TYPES.IMAGE:
            return <img src={element.value} alt="Uploaded" className="w-full h-full object-contain" />;
          default:
            return <div className="text-sm mt-1">{element.value}</div>;
        }
      }
  
      switch(element.type) {
        case FIELD_TYPES.CHECKBOX:
          return (
            <div className="flex items-center gap-2">
              <input type="checkbox" disabled className="w-4 h-4" />
              <span className="text-xs text-gray-500">{element.placeholderText}</span>
            </div>
          );
          
        // case FIELD_TYPES.DROPDOWN:
        //   return (
        //     <select className="w-full text-xs bg-transparent">
        //       {(element.options?.split(',') || []).map((option, i) => (
        //         <option key={i} value={option.trim()}>{option.trim()}</option>
        //       ))}
        //     </select>
        //   );
  
        // case FIELD_TYPES.RADIO:
        //   return (
        //     <div className="space-y-1">
        //       {(element.options?.split(',') || []).map((option, i) => (
        //         <label key={i} className="flex items-center gap-2">
        //           <input type="radio" name={element.id} disabled className="w-4 h-4" />
        //           <span className="text-xs">{option.trim()}</span>
        //         </label>
        //       ))}
        //     </div>
        //   );
  
        case FIELD_TYPES.INITIALS:
          return (
            <div className="flex items-center justify-center h-full">
              <span className="text-2xl font-bold text-gray-500">✍️</span>
              <div className="text-xs text-gray-500 ml-2">{element.placeholderText}</div>
            </div>
          );
  
        default:
          return <div className="text-xs text-gray-500">{element.placeholderText}</div>;
      }
    };
  
    return (
      <div
        className={`${baseClasses} ${
          typeClasses[element.type] || "border-gray-500 bg-gray-50"
        }`}
      >
        {renderContent()}
      </div>
    );
  };

  const renderToolItem = (type, email) => {
    const toolLabels = {
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
    };

    return (
      <div
        key={`${type}-${email}`}
        className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move"
        draggable
        onDragStart={handleToolDragStart(type, email)}
      >
        {toolLabels[type]}
      </div>
    );
  };
  const addManualRecipient = () => {
    const {
      newRecipientEmail,
      newRecipientName,
      newRecipientPhone,
      newRecipientAddress,
    } = formData;

    if(!newRecipientName){
toast.error("Please enter signer name",{containerId:"requestSignature"})
return;
    }else if(!newRecipientEmail){
toast.error("Please enter signer email",{containerId:"requestSignature"})
return;
    }else if(!newRecipientPhone){
toast.error("Please enter signer phone number",{containerId:"requestSignature"})
return;
    }

    const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
    if(!phoneRegex.test(newRecipientPhone)){
toast.error("Please enter a valid phone number",{containerId:"requestSignature"})
return;
    }
    setFormData({
      ...formData,
      recipients: [
        ...formData.recipients,
        {
          email: newRecipientEmail,
          name: newRecipientName,
          phone: newRecipientPhone || "",
          address: newRecipientAddress || "",
        },
      ],
      newRecipientEmail: "",
      newRecipientName: "",
      newRecipientPhone: "",
      newRecipientAddress: "",
    });
  };

  return (
   <>
   <ToastContainer containerId={"requestSignature"}/>


   <div className="admin-content">
      {step === 1 ? (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Request Signatures</h2>
          <form onSubmit={handleFormSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Document Title*
              </label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Upload Document*
              </label>
              <div
                className="border-2 border-dashed p-8 text-center cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                {file ? file.name : "Click to choose file or drag and drop"}
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                PDF, PNG, JPG, JPEG, DOCX
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea
                className="w-full p-2 border rounded"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="Note for recipients"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Select Folder
              </label>
              <select
                className="w-full p-2 border rounded"
                value={formData.folder}
                onChange={(e) =>
                  setFormData({ ...formData, folder: e.target.value })
                }
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
                  {contactBook?.map((email) => (
                    <option key={email?.email} value={email?.email}>
                      {email?.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addRecipient}
                  className="bg-[#29354a] text-white px-4 py-2 rounded-[#29354a]"
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      newRecipientName: e.target.value,
                    })
                  }
                />
                <input
                  type="email"
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Email Address"
                  value={formData.newRecipientEmail || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      newRecipientEmail: e.target.value,
                    })
                  }
                />
                <input
                  type="tel"
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Phone Number"
                  value={formData.newRecipientPhone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      newRecipientPhone: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded mb-2"
                  placeholder="Address"
                  value={formData.newRecipientAddress || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      newRecipientAddress: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  onClick={addManualRecipient}
                  className="w-fit mx-auto bg-[#29354a] text-white px-4 py-2 rounded-[20px] flex "
                  disabled={
                    !formData.newRecipientEmail || !formData.newRecipientName
                  }
                >
                  Add Recipient
                </button>
              </div>

             
              {formData.recipients.length > 0 && (
                <div className="border rounded p-2 mt-4">
                  {formData.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center mb-2 last:mb-0"
                    >
                      <div>
                        <p className="font-medium">
                          {recipient.name} ({recipient.email})
                        </p>
                        {recipient.phone && (
                          <p className="text-xs text-gray-500">
                            📞 {recipient.phone}
                          </p>
                        )}
                        {recipient.address && (
                          <p className="text-xs text-gray-500">
                            📍 {recipient.address}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeRecipient(index)}
                        className="text-red-500"
                      >
                        ×
                      </button>
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
              onClick={handleSendRequest}
              className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg "
              disabled={signatureElements.length === 0}
            >
              Send Request
            </button>

            {file?.type === "application/pdf" ? (
              <div className="pdf-container">
                <Document
                  file={file}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={console.error}
                  loading="Loading PDF..."
                >
                  <Page
                    pageNumber={1}
                    width={800}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </Document>
              </div>
            ) : (
              ''
            )}

            {signatureElements.map((element) => (
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

          <div className="w-80 bg-white p-4 shadow-lg overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Field Types</h3>

            <div className="mb-6">
              <h4 className="font-medium mb-2">Recipients</h4>
              {formData.recipients.map((recipient) => (
                <div
                  key={recipient.email}
                  className="mb-4 border-b pb-4 last:border-b-0"
                >
                  <div className="font-medium mb-2">{recipient.email}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(FIELD_TYPES).map((type) =>
                      renderToolItem(type, recipient.email)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

      
        </div>
      )}
    </div>
    {showSendPopup && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
       <div className="bg-white p-6 rounded-lg w-96 text-left">
         <div className="flex justify-between">
           <h3 className="text-xl font-bold mb-4">Send Mail</h3>
           <div
             className="text-[18px] cursor-pointer"
             onClick={() => {
               setShowSendPopup(false)
             }}
           >
             X
           </div>
         </div>
         <p className="mb-6">
           Are you sure you want to send out this document for
           signatures?
         </p>

         <div className="flex items-center mb-6">
           <button
             className="bg-[#002864] text-white px-4 w-full py-2 rounded"
            onClick={sendThroughEmail}
           >
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

       {formData?.recipients?.map((val,i)=>{
        return <div key={i.toString()} className="flex justify-between items-center">
       <div>
         <p className="text-gray-600">{val?.email}</p>
       </div>
       <div className="flex items-center">
         
         <button
          onClick={()=>sendThroughShare(val?.email)}
           className="text-blue-600 underline flex items-center"
         >
           <svg
             xmlns="http://www.w3.org/2000/svg"
             className="h-4 w-4 mr-1"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
             />
           </svg>
           Share
         </button>
       </div>
     </div>
       })}
      
       </div>
     </div>
    )}

    {loading && !isSocial?<>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
  <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
    <div className="flex justify-between items-start mb-6">
      <h3 className="text-2xl font-semibold text-gray-900">
        Sending Document Invitations
        <span className="block text-sm font-normal text-gray-500 mt-1">
          Server is sending signing invitations to recipients - please wait
        </span>
      </h3>
    </div>

    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
      <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
        Invitation Process Status
      </h4>
      <div className="text-blue-700 space-y-2">
        <p className="flex items-start gap-2">
          <span className="mt-1">•</span>
          <span>Secure invitation links being generated</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="mt-1">•</span>
          <span>Email notifications queued for delivery</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="mt-1">•</span>
          <span>Document access permissions being configured</span>
        </p>
      </div>
    </div>

    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <p className="text-yellow-800 flex items-start gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        <span>
          Note: Invitations contain secure links to access documents. 
          Recipients will receive emails with signing instructions.
        </span>
      </p>
    </div>

    <div className="mt-6 text-center text-sm text-gray-500">
      <p>This process typically takes 15-30 seconds. Do not close this window.</p>
    </div>
  </div>
</div>
    </>:loading && isSocial?<>
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
        <p className="flex items-start gap-2">
          <span className="mt-1">•</span>
          <span>Securely generating unique signing links for each recipient</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="mt-1">•</span>
          <span>Preparing invitation emails with document access</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="mt-1">•</span>
          <span>Encrypting sensitive document information</span>
        </p>
      </div>
    </div>

    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <p className="text-gray-600 text-sm text-center">
        This process typically takes 10-15 seconds. Please do not close this window.
      </p>
    </div>
  </div>
</div>
    </>:''}
   </>
  );
};

export default RequestSignaturesPage;
