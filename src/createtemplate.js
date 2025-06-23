import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { pdfjs } from "react-pdf";
import { toast, ToastContainer } from "react-toastify";
let draftId = `${Math.random() * 999999999}`
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const FIELD_TYPES = {
  SIGNATURE: "signature",

  INITIALS: "initials",
  NAME: "name",
  JOB_TITLE: "jobTitle",
  COMPANY: "company",
  DATE: "date",
  CHECKBOX: "checkbox",
  IMAGE: "image",
  EMAIL: "email",
};

const CreateTemplate = () => {
  const [touchDraggedElement, setTouchDraggedElement] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    sendInOrder: "yes",
    timeToComplete: "",
    redirectUrl: "",
    isTemplate: true,
  });
  const [signatureElements, setSignatureElements] = useState([]);
  const [step, setStep] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const [dropdownOptions, setDropdownOptions] = useState("");
  const [radioOptions, setRadioOptions] = useState("");
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [staticEmails, setStaticEmails] = useState([]);
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [newContact, setNewContact] = useState({
    email: '',
    name: '',
    phone: ''
  });
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

  const handleElementTouchEnd = () => {
    setDraggedElement(null);
  };

  const handleAddEmail = () => {
    const phoneRegex = /^(03\d{9}|\+92\d{9})$/;
    if (newContact.email.length == 0) {
      toast.error("Please enter email", { containerId: "template" })
      return;
    } else if (newContact.name.length == 0) {
      toast.error("Please enter name", { containerId: "template" })
      return;
    } else if (newContact.phone.length == 0) {
      toast.error("Please enter phone", { containerId: "template" })
      return;
    } else if (!phoneRegex.test(newContact.phone)) {
      toast.error("Please enter valid phone", { containerId: "template" })
      return;
    }
    staticEmails.push(newContact);
    setShowAddEmailModal(false);
    const mail = newContact.email
    setNewContact({ email: '', name: '', phone: '' });
    setSelectedEmail(mail)
  };
  const handleAssignmentSubmit = () => {

    if (selectedRole.length == 0) {
      toast.error("Please select role", { containerId: "template" })
      return;
    }
    let alreadySelected = signatureElements.find(u => u.recipientRole == selectedRole)
    if (alreadySelected) {
      toast.error("Role already assigned", { containerId: "template" })
      return
    }
    setSignatureElements((prev) =>
      prev.map((el) =>
        el.id === selectedElementId
          ? { ...el, recipientEmail: selectedEmail, recipientRole: selectedRole }
          : el
      )
    );
    setShowAssignmentModal(false);
    setSelectedEmail("");
    setSelectedRole("");
  };
  const getContainerPosition = (clientX, clientY) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && /\.(pdf|png|jpg|jpeg)$/i.test(selectedFile.name)) {
      setFile(selectedFile);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (file && formData.title) {
      setStep(2);
    }
  };

  const createPlaceholder = (type, x = 50, y = 50, options = {}) => {
    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      value: "",
      placeholderText: getPlaceholderText(type, options),
      isPlaceholder: true,
      ...options,
    };


    setSignatureElements((prev) => [...prev, newElement]);
  };

  useEffect(() => {
    getContacts();
  }, []);





  const getContacts = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let response = await axios.get(`${BASE_URL}/fetchContactBooks`, headers);
      setStaticEmails(response.data.contactBooks);
    } catch (e) {
      if (e?.response?.data?.error) {
      }
    }
  };

  const getPlaceholderText = (type, options) => {
    const texts = {
      [FIELD_TYPES.SIGNATURE]: "Signature",

      [FIELD_TYPES.INITIALS]: "Initials",
      [FIELD_TYPES.NAME]: "Name",
      [FIELD_TYPES.JOB_TITLE]: "Job Title",
      [FIELD_TYPES.COMPANY]: "Company",
      [FIELD_TYPES.DATE]: "Date",
      [FIELD_TYPES.CHECKBOX]: "Checkbox",
      [FIELD_TYPES.DROPDOWN]: `Dropdown: ${options.options || ""}`,
      [FIELD_TYPES.RADIO]: `Radio: ${options.options || ""}`,
      [FIELD_TYPES.IMAGE]: "Image",
      [FIELD_TYPES.EMAIL]: "Email",
    };
    return texts[type];
  };

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    const { x, y } = getContainerPosition(e.clientX, e.clientY);
    const element = signatureElements.find((el) => el.id === id);

    setPositionOffset({
      x: x - element.x,
      y: y - element.y,
    });
    setDraggedElement(id);
  };

  const handleMouseMove = (e) => {
    if (!draggedElement) return;

    const { x: cursorX, y: cursorY } = getContainerPosition(
      e.clientX,
      e.clientY
    );

    setSignatureElements((prev) =>
      prev.map((el) =>
        el.id === draggedElement
          ? {
            ...el,
            x: cursorX - positionOffset.x,
            y: cursorY - positionOffset.y,
          }
          : el
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };
  const deleteElement = (id) => {
    setSignatureElements((prev) => prev.filter((el) => el.id !== id));
  };

  const handleToolDragStart = (type) => (e) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("options", JSON.stringify({}));
  };
  const handleDocumentDrop = (e) => {
    e.preventDefault();
    const { x, y } = getContainerPosition(e.clientX, e.clientY);
    const type = e.dataTransfer.getData("type");

    let options = {};
    try {
      options = JSON.parse(e.dataTransfer.getData("options")) || {};
    } catch (error) {
      console.error("Error parsing options:", error);
    }

    if (type) {
      if (type === FIELD_TYPES.DROPDOWN || type === FIELD_TYPES.RADIO) {
        setCurrentTool(type);
        setShowOptionsModal(true);
        setDropPosition({ x, y });
      } else {
        createPlaceholder(type, x, y, options);
      }
    }
  };

  const handleOptionsSubmit = () => {
    const options = {
      options:
        currentTool === FIELD_TYPES.DROPDOWN ? dropdownOptions : radioOptions,
    };
    createPlaceholder(currentTool, dropPosition.x, dropPosition.y, options);
    setShowOptionsModal(false);
    setDropdownOptions("");
    setRadioOptions("");
  };

  const convertPositionsToPDFCoordinates = (elements, containerWidth) => {
    const scaleFactor = 800 / (containerWidth || 800);
    return elements.map((el) => ({
      ...el,
      x: el.x * scaleFactor,
      y: el.y * scaleFactor,
    }));
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token");
      const headers = { headers: { authorization: `Bearer ${token}` } };
      const containerWidth = containerRef.current?.offsetWidth || 800;
      const elementsToSave = convertPositionsToPDFCoordinates(
        signatureElements,
        containerWidth
      ).map((element) => ({
        ...element,
        recipientEmail: element.recipientEmail || "",
        recipientRole: element.recipientRole || "",
      }));
      let allRolesNotAssigned = elementsToSave.find(u => u.recipientRole.length == 0)

      if (allRolesNotAssigned) {
        setLoading(false)
        toast.error("Please assign roles to all elements", { containerId: "template" })
        return
      } else if (!elementsToSave || elementsToSave?.length == 0) {
        toast.error("Please insert elements", { containerId: "template" })
        setLoading(false)
        return
      }
      const form = new FormData();
      form.append("document", file);
      form.append("title", formData.title);
      form.append("elements", JSON.stringify(elementsToSave));
      form.append("sendInOrder", formData.sendInOrder);
      form.append("timeToComplete", formData.timeToComplete);
      form.append("redirectUrl", formData.redirectUrl);
      form.append("template", formData.isTemplate);
      form.append('draftId', draftId)
      let recipients = staticEmails.map((val) => val);


      recipients.forEach((email) => {
        form.append('recipients[]', JSON.stringify(email));
      });


      const saveResponse = await axios.post(
        `${BASE_URL}/saveTemplate`,
        form,
        headers
      );
      setLoading(false)
      toast.success(`Template saved successfully`, { containerId: "template" });
      window.location.reload(true)
      // setStep(1);
    } catch (error) {
      setLoading(false)

      if (error?.response?.data?.error) {
        toast.error(error?.response?.data?.error, { containerId: "template" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "template",
        });
      }
    }
  };

  const renderFieldPreview = (element) => {
    const typeClasses = {
      [FIELD_TYPES.SIGNATURE]: "border-blue-500 bg-blue-50",

      [FIELD_TYPES.INITIALS]: "border-green-500 bg-green-50",
      [FIELD_TYPES.NAME]: "border-yellow-500 bg-yellow-50",
      [FIELD_TYPES.JOB_TITLE]: "border-purple-500 bg-purple-50",
      [FIELD_TYPES.COMPANY]: "border-pink-500 bg-pink-50",
      [FIELD_TYPES.DATE]: "border-indigo-500 bg-indigo-50",
      [FIELD_TYPES.EMAIL]: "border-gray-500 bg-gray-50",
    };

    return (
      <div
        className={`border-2 p-2 cursor-move ${typeClasses[element.type] || "border-gray-500 bg-gray-50"
          }`}
        style={{
          position: "absolute",
          left: `${element.x}px`,
          top: `${element.y}px`,
          zIndex: draggedElement === element.id ? 1000 : 1,
          minWidth: "100px",
          minHeight: "40px",
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        onTouchStart={(e) => handleElementTouchStart(e, element.id)}
        onTouchMove={handleElementTouchMove}
        onTouchEnd={handleElementTouchEnd}
      >
        <div className="text-xs text-gray-500">{element.placeholderText}</div>
        {element.value && <div className="text-sm mt-1">{element.value}</div>}


        {(element.recipientEmail || element.recipientRole) && (
          <div className="text-xs mt-1">
            {element.recipientEmail && <div>{element.recipientEmail}</div>}
            {element.recipientRole && <div>({element.recipientRole})</div>}
          </div>
        )}



        <button
          onClick={() => deleteElement(element.id)}
          className="absolute -right-3 -top-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>


        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedElementId(element.id);
            setShowAssignmentModal(true);
          }}
          className="absolute -left-3 -top-3 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  };

  const renderToolItem = (type, role) => {
    const toolLabels = {
      [FIELD_TYPES.SIGNATURE]: "Signature",

      [FIELD_TYPES.INITIALS]: "Initials",
      [FIELD_TYPES.NAME]: "Name",
      [FIELD_TYPES.JOB_TITLE]: "Job Title",
      [FIELD_TYPES.COMPANY]: "Company",
      [FIELD_TYPES.DATE]: "Date",
      [FIELD_TYPES.CHECKBOX]: "Checkbox",
      [FIELD_TYPES.DROPDOWN]: "Dropdown",
      [FIELD_TYPES.RADIO]: "Radio",
      [FIELD_TYPES.IMAGE]: "Image",
      [FIELD_TYPES.EMAIL]: "Email",
    };

    return (
      <div
        key={`${type}-${role?.id || "default"}`}
        className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded mb-1"
        draggable
        onDragStart={handleToolDragStart(type, role?.name)}
        onTouchStart={handleToolTouchStart(type, role?.name)}
        onTouchMove={handleToolTouchMove}
        onTouchEnd={handleToolTouchEnd}
      >
        {toolLabels[type]}
      </div>
    );
  };

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  const handleAddRole = () => {
    if (newRole.trim()) {
      setRoles((prev) => {
        let old;
        if (prev.length > 0) {
          old = [...prev]
        } else {
          old = [prev]
        }
        let already = old.find(u => u.name == newRole.trim())
        if (already) {
          toast.error("Role already created", { containerId: "requestSignature" })
          return old
        } else {
          old = [...prev, { id: uuidv4(), name: newRole.trim() }]
          return old
        }
      })

      setNewRole("");
      setShowRoleModal(false);
    }
  };

  const deleteRole = (id) => {
    setRoles(roles.filter((role) => role.id !== id));
  };



  useEffect(() => {
    if (signatureElements.length > 0 && file) {
      createDraft();
    }
  }, [signatureElements, file])

  const createDraft = async () => {

    try {
      let myForm = new FormData();
      myForm.append('document', file)
      myForm.append('elements', JSON.stringify(signatureElements))
      let recipients = staticEmails.map((val) => val);
      myForm.append('recipients', JSON.stringify(recipients))
      myForm.append('title', formData.title)
      myForm.append('draftId', draftId)
      let token = localStorage.getItem('token')
      let headers = {
        headers: {
          authorization: `Bearer ${token}`
        }
      }
      let res = await axios.post(`${BASE_URL}/createDraft`, myForm, headers)
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "requestSignature" })
      } else {
        toast.error("Something went wrong pleae try again", { containerId: "requestSignature" })
      }
    }
  }


  return (
    <>
      <ToastContainer containerId={"template"} />

      <div className="admin-content">
        {step === 1 ? (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Create Template</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Template Title*
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
                  PDF, PNG, JPG, JPEG
                </p>
              </div>



              <button
                type="submit"
                className="w-fit mx-auto flex bg-[#002864] text-white py-2 px-4 rounded-[20px] "
              >
                Create Template
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
                onClick={handleSaveTemplate}
                className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg "
              >
                Save Template
              </button>

              {file?.type === "application/pdf" ? (
                <div className="pdf-container">
                  <Document file={file} onLoadSuccess={onLoadSuccess} className="w-full">
                    <Page
                      pageNumber={1}
                      width={window.innerWidth < 1024 ? window.innerWidth - 32 : 800}
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

              {signatureElements.map((element) => renderFieldPreview(element))}
            </div>

            <div className="lg:w-80 w-full bg-white p-4 shadow-lg overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="border border-red-600 text-red-600 px-3 py-1 rounded-[20px] w-full hover:bg-red-600 hover:text-white font-bold"
                >
                  Add Role
                </button>
              </div>

              <div className="mb-6">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded mb-2"
                  >
                    <span>{role.name}</span>
                    <button
                      onClick={() => deleteRole(role.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <h3 className="text-xl font-bold mb-4">Field Types</h3>
              {Object.values(FIELD_TYPES).map((type) => renderToolItem(type))}
            </div>
            {showRoleModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                  <h3 className="text-xl font-bold mb-4">Add New Role</h3>
                  <input
                    type="text"
                    className="w-full p-2 border rounded mb-4"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Enter role name"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowRoleModal(false);
                        setNewRole("");
                      }}
                      className="px-4 py-2 rounded-[20px] text-white bg-[#29354a]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddRole}
                      className="bg-[#002864] text-white px-4 py-2 rounded-[20px]"
                    >
                      Add Role
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showOptionsModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                  <h3 className="text-xl font-bold mb-4">
                    {currentTool === FIELD_TYPES.DROPDOWN
                      ? "Dropdown Options"
                      : "Radio Options"}
                  </h3>
                  <input
                    type="text"
                    className="w-full p-2 border rounded mb-4"
                    value={
                      currentTool === FIELD_TYPES.DROPDOWN
                        ? dropdownOptions
                        : radioOptions
                    }
                    onChange={(e) =>
                      currentTool === FIELD_TYPES.DROPDOWN
                        ? setDropdownOptions(e.target.value)
                        : setRadioOptions(e.target.value)
                    }
                    placeholder="Option 1, Option 2, Option 3"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowOptionsModal(false)}
                      className="bg-[#29354a] px-4 py-2 rounded-[20px] text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleOptionsSubmit}
                      className="bg-[#002864] text-white px-4 py-2 rounded-[20px]"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showAssignmentModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96">
                  <h3 className="text-xl font-bold mb-4">Assign Field</h3>
                  {showAddEmailModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-lg w-96">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">Add New Contact</h3>
                          <button
                            onClick={() => setShowAddEmailModal(false)}
                            className="text-black text-lg"
                          >
                            ×
                          </button>
                        </div>
                        <div className="space-y-4">
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-2 border rounded"
                            value={newContact.email}
                            onChange={(e) =>
                              setNewContact({
                                ...newContact,
                                email: e.target.value,
                              })
                            }
                          />
                          <input
                            type="text"
                            placeholder="Name"
                            className="w-full p-2 border rounded"
                            value={newContact.name}
                            onChange={(e) =>
                              setNewContact({
                                ...newContact,
                                name: e.target.value,
                              })
                            }
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            className="w-full p-2 border rounded"
                            value={newContact.phone}
                            onChange={(e) =>
                              setNewContact({
                                ...newContact,
                                phone: e.target.value,
                              })
                            }
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowAddEmailModal(false)}
                              className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddEmail}
                              className="bg-[#002864] text-white px-4 py-2 rounded"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Email</label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={selectedEmail}
                        onChange={(e) => setSelectedEmail(e.target.value)}
                      >
                        <option value="">Select Email</option>
                        {staticEmails.map((email) => (
                          <option key={email} value={email?.email}>
                            {email?.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddEmailModal(true)}
                        className="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Role
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAssignmentModal(false)}
                      className="bg-[#29354a] px-4 py-2 rounded-[20px] text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignmentSubmit}
                      className="bg-[#002864] text-white px-4 py-2 rounded-[20px]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Creating Template
          </h3>
          <p className="text-gray-600">
            Please wait while your template is being created and configured
          </p>
        </div>
      </div> : ''}
    </>
  );
};

export default CreateTemplate;
