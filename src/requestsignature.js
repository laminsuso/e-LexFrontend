import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pdfjs } from "react-pdf";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer, toast } from "react-toastify";

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
  const [touchDraggedElement, setTouchDraggedElement] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [emails, setEmails] = useState([]);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    folder: "default",
    recipients: [],
  });
  const [signatureElements, setSignatureElements] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [isSocial, setIsSocial] = useState(false)
  const [contactBook, setContactBook] = useState([])
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [numPages, setNumPages] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState("");
  const [shareId, setShareId] = useState("")
  const [radioOptions, setRadioOptions] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showSendPopup, setShowSendPopup] = useState(false)
  const [currentTool, setCurrentTool] = useState(null);
  const [isPreviewMode] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

 const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile && /\.(pdf|png|jpg|jpeg|docx)$/i.test(selectedFile.name)) {
    setFile(selectedFile);
    setPageNumber(1); // Reset to first page when new file is selected
  }
};

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.length == 0) {
      toast.error("Please enter document title", { containerId: "requestSignature" })
    } else if (!file) {
      toast.error("Please select a document", { containerId: "requestSignature" })
    } else if (formData.recipients?.length == 0) {
      toast.error("Please select recipients", { containerId: "requestSignature" })
    }else if(formData.recipients.filter(u=>u.willSign==true).length==0){
      toast.error("Please select atleast one signer",{containerId:"requestSignature"})
      return
    }
    if (file && formData.title && formData.recipients.length > 0) {
      setStep(2);
    }
  };

  const fetchContactBooks = async () => {
    try {
      let token = localStorage.getItem('token')
      let headers = {
        headers: {
          authorization: `Bearer ${token}`
        }
      }
      let response = await axios.get(`${BASE_URL}/fetchContactBooks`, headers)
      console.log(response.data)
      setContactBook(response.data.contactBooks)
      console.log("fetchContactBooks")
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "requestSignature" })
      } else {
        toast.error("Something went wrong pleae try again", { containerId: "requestSignature" })
      }
    }
  }
  useEffect(() => {
    fetchContactBooks();
  }, [])

  const handleToolTouchStart = (type, email, options = {}) => (e) => {
    e.preventDefault();
    const touch = e.touches[0];

    setTouchDraggedElement({ type, email, options });
    setTouchStartPos({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleToolTouchMove = (e) => {
    if (!touchDraggedElement) return;
    e.preventDefault();
    // This prevents scrolling while dragging
  };

  const handleToolTouchEnd = (e) => {
    if (!touchDraggedElement) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Check if drop is within the document container
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const { type, email, options } = touchDraggedElement;
      createPlaceholder(type, email, x, y, options);
    }

    setTouchDraggedElement(null);
    setTouchStartPos({ x: 0, y: 0 });
  };

  // Add touch event handlers for moving existing elements
  const handleElementTouchStart = (e, id) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const element = signatureElements.find((el) => el.id === id);

    setPositionOffset({ x: x - element.x, y: y - element.y });
    setDraggedElement(id);
  };

  const handleElementTouchMove = (e) => {
    if (!draggedElement) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left - positionOffset.x;
    const y = touch.clientY - rect.top - positionOffset.y;

    setSignatureElements(
      signatureElements.map((el) =>
        el.id === draggedElement ? { ...el, x, y } : el
      )
    );
  };


  const handleChangeSign = (recipient, value) => {
    try {
      setFormData((prev) => {
        const updatedRecipients = prev.recipients.map((r) =>
          r.email === recipient.email ? { ...r, willSign: value } : r
        );
  
        return {
          ...prev,
          recipients: updatedRecipients,
        };
      });
    } catch (e) {
      console.error("Error updating recipient:", e);
    }
  };

  const handleElementTouchEnd = () => {
    setDraggedElement(null);
  };


  const addRecipient = () => {

    const isEmailExists = formData.recipients.some(
      (recipient) => recipient.email === selectedEmail
    );


    if (isEmailExists) {

      toast.error("This email has already been added to recipients.", { containerId: "requestSignature" });
    } else {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, { email: selectedEmail,willSign:true }],
      });
      setSelectedEmail("");
    }


  };
  const sendThroughEmail = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { headers: { authorization: `Bearer ${token}` } };
      setLoading(true)
      setIsSocial(false)
      const form = new FormData();
      form.append("document", file);
      form.append("title", formData.title);
      form.append("elements", JSON.stringify(signatureElements));

      if (shareId.length == 0) {

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
      } else {



        await axios.post(
          `${BASE_URL}/sendSignRequest`,
          {
            ...formData,
            documentId: shareId,
            elements: signatureElements,

          },
          headers
        );
      }

      toast.success(`Signature request sent`, { containerId: "requestSignature" });
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
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "requestSignature" })
      } else {
        toast.error("Something went wrong pleae try again", { containerId: "requestSignature" })
      }
      setLoading(false)
      setIsSocial(false)

    }
  }

  const sendThroughShare = async (email) => {
    try {
      setLoading(true);
      setIsSocial(true);

      let documentId = shareId;


      if (!shareId || shareId.length === 0) {
        const token = localStorage.getItem("token");
        const headers = { headers: { authorization: `Bearer ${token}` } };

        const form = new FormData();
        form.append("document", file);
        form.append("title", formData.title);
        form.append("elements", JSON.stringify(signatureElements));

        let signers = signatureElements.map((val, i) => {
          return {
            email: val.recipientEmail
          }
        });


        signers = signers.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.email === value.email
          ))
        );

        form.append('signers', JSON.stringify(signers));

        const saveResponse = await axios.post(
          `${BASE_URL}/saveDocument`,
          form,
          headers
        );

        documentId = saveResponse.data.doc._id;
        setShareId(documentId);
      }


      const link = `${window.location.origin}/admin/request-signatures/sign-document/${documentId}?email=${email}`;


      if (navigator.share) {
        await navigator.share({
          title: 'Sign Document',
          text: 'Please sign the document',
          url: link,
        });

        toast.success(`Signature request sent`, { containerId: "requestSignature" });
      } else {

        await navigator.clipboard.writeText(link);
        toast.success(`Link copied to clipboard`, { containerId: "requestSignature" });
      }

    } catch (error) {
      console.error('Share error:', error);

      if (error.name === 'AbortError') {

        console.log('User cancelled share');
      } else if (error?.response?.data?.error) {
        console.log("CANT SHARE")
        console.log(JSON.stringify(error))
        toast.error(error.response.data.error, { containerId: "requestSignature" });
      } else {
        console.log("CANT SHARE")
        console.log(JSON.stringify(error))
        toast.error("Something went wrong, please try again", { containerId: "requestSignature" });
      }
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


      if (!shareId || shareId.length === 0) {
        const token = localStorage.getItem("token");
        const headers = { headers: { authorization: `Bearer ${token}` } };

        const form = new FormData();
        form.append("document", file);
        form.append("title", formData.title);
        form.append("elements", JSON.stringify(signatureElements));

        let signers = signatureElements.map((val, i) => {
          return {
            email: val.recipientEmail
          }
        });


        signers = signers.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.email === value.email
          ))
        );

        form.append('signers', JSON.stringify(signers));

        const saveResponse = await axios.post(
          `${BASE_URL}/saveDocument`,
          form,
          headers
        );

        documentId = saveResponse.data.doc._id;
        setShareId(documentId);
      }


      const link = `${window.location.origin}/admin/request-signatures/sign-document/${documentId}?email=${email}`;
      console.log("LINK IS" + link)

      await axios.post(`${BASE_URL}/sendSignatureLinkToWhatsApp`, { phone: val.phone, link })
      toast.success(`Signature request sent`, { containerId: "requestSignature" });

    } catch (error) {
      console.error('Share error:', error);

      if (error.name === 'AbortError') {

        console.log('User cancelled share');
      } else if (error?.response?.data?.error) {
        console.log("CANT SHARE")
        console.log(JSON.stringify(error))
        toast.error(error.response.data.error, { containerId: "requestSignature" });
      } else {
        console.log("CANT SHARE")
        console.log(JSON.stringify(error))
        toast.error("Something went wrong, please try again", { containerId: "requestSignature" });
      }
    } finally {

      setLoading(false);
      setIsSocial(false);
    }
  };



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
      pageNumber: pageNumber, // Add current page number
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

      let check = formData.recipients.filter(u=>u.willSign==true).every(recipient => {
        return signatureElements.some(signature => signature.recipientEmail === recipient.email);
      });
      if (!check) {
        toast.error("Atleast one element should be created for each recipient", { containerId: "requestSignature" });
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
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error, { containerId: "requestSignature" });
      } else {
        toast.error("Failed to send signature requests", { containerId: "requestSignature" });
      }
    }
  };

  const handleElementClick = (element) => { };

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
        switch (element.type) {
          case FIELD_TYPES.IMAGE:
            return <img src={element.value} alt="Uploaded" className="w-full h-full object-contain" />;
          default:
            return <div className="text-sm mt-1">{element.value}</div>;
        }
      }

      switch (element.type) {
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
        className={`${baseClasses} ${typeClasses[element.type] || "border-gray-500 bg-gray-50"
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
        onTouchStart={handleToolTouchStart(type, email)}
        onTouchMove={handleToolTouchMove}
        onTouchEnd={handleToolTouchEnd}
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

    if (!newRecipientName) {
      toast.error("Please enter signer name", { containerId: "requestSignature" })
      return;
    } else if (!newRecipientEmail) {
      toast.error("Please enter signer email", { containerId: "requestSignature" })
      return;
    } else if (!newRecipientPhone) {
      toast.error("Please enter signer phone number", { containerId: "requestSignature" })
      return;
    }

    const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
    if (!phoneRegex.test(newRecipientPhone)) {
      toast.error("Please enter a valid phone number", { containerId: "requestSignature" })
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
          willSign:true
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
      <ToastContainer containerId={"requestSignature"} />


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
                    accept=".pdf"
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
        className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 last:mb-0 gap-2"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium break-words">
            {recipient.name} ({recipient.email})
          </p>
          {recipient.phone && (
            <p className="text-xs text-gray-500 break-words">
              📞 {recipient.phone}
            </p>
          )}
          {recipient.address && (
            <p className="text-xs text-gray-500 break-words">
              📍 {recipient.address}
            </p>
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

          <button
            onClick={() => removeRecipient(index)}
            className="text-red-500 text-lg"
          >
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
          <div
            className="flex min-h-screen lg:flex-row flex-col bg-gray-100"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDrop={handleDocumentDrop}
            onDragOver={(e) => e.preventDefault()}
            onTouchMove={handleElementTouchMove}
            onTouchEnd={handleElementTouchEnd}
            ref={containerRef}
            style={{ touchAction: 'none' }}
          >
            <div className="flex-1 p-2 lg:p-4 overflow-auto relative w-full">
              <button
                onClick={handleSendRequest}
                className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg "
                disabled={signatureElements.length === 0}

              >
                Send Request
              </button>

              {file?.type === "application/pdf" ? (
  <div className="pdf-containerpdf-container w-full">
    {/* Page Navigation */}
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
    
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      onLoadError={console.error}
      loading="Loading PDF..."
      className="w-full"
    >
      <Page
        pageNumber={pageNumber}
        width={window.innerWidth < 1024 ? window.innerWidth - 32 : 800}
        className="w-full h-auto"
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
    </Document>
  </div>
) : (
  ''
)}
              {signatureElements?.filter(element => element?.pageNumber === pageNumber)?.map((element) => (
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

            <div className="lg:w-[320px] w-full bg-white p-4 shadow-lg overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Field Types</h3>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Recipients</h4>
                {formData?.recipients?.filter(u=>u.willSign==true)?.map((recipient) => (
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

            {formData?.recipients?.filter(u=>u.willSign==true)?.map((val, i) => {
              return <div key={i.toString()} className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">{val?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => sendThroughShare(val?.email)}
                    className="text-blue-600 hover:text-blue-800" title="Share">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>

                  <button onClick={() => sendThroughWPShare(val?.email, val)}
                    className="text-green-600 hover:text-green-800" title="Share via WhatsApp">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                  </button>
                </div>
              </div>
            })}

          </div>
        </div>
      )}

      {loading && !isSocial ? <>
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
      </> : loading && isSocial ? <>
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
      </> : ''}
    </>
  );
};

export default RequestSignaturesPage;
