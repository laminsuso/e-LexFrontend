import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Document, Page } from "react-pdf";
import { v4 as uuidv4 } from "uuid";
import SignedDocument from "./documents/SignedDocument.pdf";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "./baseUrl";

const FIELD_TYPES = {
  SIGNATURE: "signature",
  STAMP: "stamp",
  INITIALS: "initials",
  NAME: "name",
  JOB_TITLE: "jobTitle",
  COMPANY: "company",
  DATE: "date",
  CHECKBOX: "checkbox",
  IMAGE: "image",
  EMAIL: "email",
};

const recipientColors = [
  "bg-blue-100 border-blue-300",
  "bg-green-100 border-green-300",
  "bg-yellow-100 border-yellow-300",
  "bg-purple-100 border-purple-300",
  "bg-pink-100 border-pink-300",
  "bg-indigo-100 border-indigo-300",
];

const UseTemplate = () => {
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [isDraggingTool, setIsDraggingTool] = useState(false);
  const [draggedToolType, setDraggedToolType] = useState(null);
  const params = useParams();
  let id = params.documentId;
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [showAddSignerModal, setShowAddSignerModal] = useState(true);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState();
  const [selectRoles, setSelectRoles] = useState([]);
  const [viewTemplateId, setViewTemplateId] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [dummyEmails, setDummyEmails] = useState([
    "admin@example.com",
    "signer1@example.com",
    "signer2@example.com",
    "reviewer@example.com",
  ]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState(null);
  const [newContact, setNewContact] = useState({
    email: "",
    name: "",
    phone: "",
  });
  const [selectedSignerEmail, setSelectedSignerEmail] = useState("");
  const [file, setFile] = useState(SignedDocument);
  const [formData, setFormData] = useState({
    title: "",
    sendInOrder: "yes",
    timeToComplete: "",
    redirectUrl: "",
    isTemplate: true,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [signatureElements, setSignatureElements] = useState([]);
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
  const [staticEmails, setstaticEmails] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const defaultElements = [
      {
        id: uuidv4(),
        type: FIELD_TYPES.SIGNATURE,
        x: 100,
        y: 100,
        value: "",
        placeholderText: "Signature",
        isPlaceholder: true,
      },
      {
        id: uuidv4(),
        type: FIELD_TYPES.DATE,
        x: 100,
        y: 150,
        value: "",
        placeholderText: "Date",
        isPlaceholder: true,
      },
    ];
    setSignatureElements(defaultElements);
  }, []);
  useEffect(() => {
    if (draggedElement) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      const container = containerRef.current;
      if (container) {
        container.style.overflow = "hidden";
        container.style.touchAction = "none";
      }
    } else {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
      const container = containerRef.current;
      if (container) {
        container.style.overflow = "auto";
        container.style.touchAction = "auto";
      }
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
      const container = containerRef.current;
      if (container) {
        container.style.overflow = "auto";
        container.style.touchAction = "auto";
      }
    };
  }, [draggedElement]);
  const handleToolTouchStart = (type) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setTouchStartPos({
      x: touch.clientX,
      y: touch.clientY,
    });
    setDraggedToolType(type);
    setIsDraggingTool(true);

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  };

  const handleToolTouchMove = (e) => {
    if (!isDraggingTool || !draggedToolType) return;
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);

    if (deltaX > 10 || deltaY > 10) {
    }
  };

  const handleToolTouchEnd = (e) => {
    if (!isDraggingTool || !draggedToolType) return;
    e.preventDefault();
    e.stopPropagation();

    const touch = e.changedTouches[0];
    const { x, y } = getContainerPosition(touch.clientX, touch.clientY);

    const pdfContainer = document.querySelector(".pdf-container");
    const rect = pdfContainer?.getBoundingClientRect();

    if (
      rect &&
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      if (
        draggedToolType === FIELD_TYPES.DROPDOWN ||
        draggedToolType === FIELD_TYPES.RADIO
      ) {
        setCurrentTool(draggedToolType);
        setShowOptionsModal(true);
        setDropPosition({ x, y });
      } else {
        createPlaceholder(draggedToolType, x, y, {});
      }
    }

    setIsDraggingTool(false);
    setDraggedToolType(null);
    document.body.style.overflow = "auto";
    document.body.style.touchAction = "auto";
  };
  const handleAssignmentSubmit = () => {
    setSignatureElements((prev) =>
      prev.map((el) =>
        el.id === selectedElementId
          ? {
              ...el,
              recipientEmail: selectedEmail,
              recipientRole: selectedRole,
            }
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

  const createPlaceholder = (type, x = 50, y = 50, options = {}) => {
    const newElement = {
      id: uuidv4(),
      type,
      x,
      y,
      value: "",
      placeholderText: getPlaceholderText(type, options),
      isPlaceholder: true,
      pageNumber: pageNumber, // Add this line
      recipientEmail:
        selectedRecipientIndex !== null
          ? recipients[selectedRecipientIndex].email
          : "",
      ...options,
    };
    setSignatureElements((prev) => [...prev, newElement]);
  };
  const getPlaceholderText = (type, options) => {
    const texts = {
      [FIELD_TYPES.SIGNATURE]: "Signature",
      [FIELD_TYPES.STAMP]: "Stamp",
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

  useEffect(() => {
    fetchTemplate();
    fetchContactBook();
  }, []);

  const fetchContactBook = async () => {
    try {
      let token = localStorage.getItem("token");
      let res = await axios.get(`${BASE_URL}/fetchContactBooks`, {
        headers: { authorization: `Bearer ${token}` },
      });
      setstaticEmails(res.data.contactBooks);
      setDummyEmails(res.data.contactBooks);
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "editTemplate" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "editTemplate",
        });
      }
    }
  };
  const handleElementTouchStart = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const { x, y } = getContainerPosition(touch.clientX, touch.clientY);
    const element = signatureElements.find((el) => el.id === id);
    setPositionOffset({
      x: x - element.x,
      y: y - element.y,
    });
    setDraggedElement(id);
  };

  const handleElementTouchMove = (e) => {
    if (!draggedElement) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const { x: cursorX, y: cursorY } = getContainerPosition(
      touch.clientX,
      touch.clientY
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

  const handleElementTouchEnd = () => {
    setDraggedElement(null);
  };
  const convertPDFToScreenCoordinates = (elements, containerWidth) => {
    const pdfWidth = 800;
    const scaleFactor = containerWidth / pdfWidth;
    return elements.map((el) => ({
      ...el,
      x: el.x * scaleFactor,
      y: el.y * scaleFactor,
      width: el.width ? el.width * scaleFactor : undefined,
      height: el.height ? el.height * scaleFactor : undefined,
    }));
  };

  const fetchTemplate = async () => {
    try {
      let token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/getSpecificDoc/${id}`);

      setCurrentTemplate(res.data.doc);
      console.log("DOCS");
      console.log(res);
      setCurrentTemplate(res.data.doc)
      console.log("DOCS")
      console.log(res)

      const containerWidth = containerRef.current?.offsetWidth || 800;
      setFile(res.data.doc.file);
      let transformedRecipients = res.data.doc.elements.map((val, i) => {
        let data = {
          email: val.recipientEmail,
          role: val.recipientRole,
        };
        return data;
      });
      let transformedRoles = transformedRecipients.map((val, i) => {
        return {
          roleName: val.role,
          roleValue: val.role,
        };
      });

      setSelectRoles(transformedRoles);
      setRecipients(transformedRecipients);
      const elementsWithPlaceholders = convertPDFToScreenCoordinates(
        res.data.doc.elements,
        containerWidth
      ).map((element) => ({
        ...element,
        id: element.id || uuidv4(),
        isPlaceholder: true,
        placeholderText:
          element.placeholderText || getPlaceholderText(element.type, element),
      }));
      setSignatureElements(elementsWithPlaceholders);
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "editTemplate" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "editTemplate",
        });
      }
    }
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
      const containerWidth = containerRef.current?.offsetWidth || 800;
      const elementsToSave = convertPositionsToPDFCoordinates(
        signatureElements,
        containerWidth
      ).map((element) => ({
        ...element,

        recipientEmail: element.recipientEmail || "",

        recipientRole: element.recipientRole || "",
      }));

      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let response = await axios.patch(
        `${BASE_URL}/editDocument/${id}`,
        { elements: elementsToSave },
        headers
      );
      toast.success("Template edited successfully", {
        containerId: "editTemplate",
      });
      setTimeout(() => {
        navigate("/admin/template/manage");
      }, 100);
    } catch (error) {
      if (error?.response?.data?.error) {
        toast.error(error?.response?.data?.error, {
          containerId: "editTemplate",
        });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "editTemplate",
        });
      }
    }
  };

  const renderFieldPreview = (element) => {
    const recipientIndex = recipients.findIndex(
      (r) => r.email === element.recipientEmail
    );
    const recipientColor =
      recipientIndex !== -1
        ? recipientColors[recipientIndex % recipientColors.length]
        : "bg-gray-100 border-gray-300";

    return (
      <div
        className={`border-2 p-2 cursor-move ${recipientColor}`}
        style={{
          position: "absolute",
          left: `${element.x}px`,
          top: `${element.y}px`,
          zIndex: draggedElement === element.id ? 1000 : 1,
          minWidth: "100px",
          minHeight: "40px",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, element.id);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          handleElementTouchStart(e, element.id);
        }}
      >
        <div className="text-xs text-gray-500">{element.placeholderText}</div>
        {element.value && <div className="text-sm mt-1">{element.value}</div>}
        {element.recipientEmail && (
          <div className="text-xs mt-1">
            {element.recipientEmail && <div>{element.recipientEmail}</div>}
            {element.recipientRole && <div>({element.recipientRole})</div>}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            deleteElement(element.id);
          }}
          className="absolute -right-3 -top-3 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      </div>
    );
  };

  const renderToolItem = (type) => {
    const toolLabels = {
      [FIELD_TYPES.SIGNATURE]: "Signature",
      [FIELD_TYPES.STAMP]: "Stamp",
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
        key={type}
        className={`p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded mb-1 select-none ${
          isDraggingTool && draggedToolType === type ? 'opacity-50' : ''
        }`}
        
        // Always enable draggable for desktop
        draggable={true} 
        onDragStart={handleToolDragStart(type)}
        
        // Only add touch events on mobile
        onTouchStart={isMobile ? handleToolTouchStart(type) : undefined}
        onTouchMove={isMobile ? handleToolTouchMove : undefined}
        onTouchEnd={isMobile ? handleToolTouchEnd : undefined}
        
        style={{
          touchAction: isMobile ? 'none' : 'auto', 
          userSelect: 'none',
        }}
      >
        {toolLabels[type]}
        {isMobile && (
          <span className="text-xs text-gray-500 block">
            Tap and drag to PDF
          </span>
        )}
      </div>
    );
  };

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleAddRole = () => {
    if (newRole.trim()) {
      setRoles([...roles, { id: uuidv4(), name: newRole.trim() }]);
      setNewRole("");
      setShowRoleModal(false);
    }
  };

  const deleteRole = (id) => {
    setRoles(roles.filter((role) => role.id !== id));
  };

  const handleAddContact = async () => {
    try {
      const phoneRegex = /^(?:\+?[1-9]\d{9,14}|0\d{9,14})$/;
      console.log(newContact.phone);
      if (newContact.email.length == 0) {
        toast.error("Please enter email", { containerId: "editTemplate" });
        return;
      } else if (newContact.name.length == 0) {
        toast.error("Please enter name", { containerId: "editTemplate" });
        return;
      } else if (newContact.phone.length == 0) {
        toast.error("Please enter phone", { containerId: "editTemplate" });
        return;
      } else if (!phoneRegex.test(newContact.phone)) {
        toast.error("Please enter a valid phone number", {
          containerId: "editTemplate",
        });
        return;
      }
      if (newContact.email) {
        setstaticEmails((prev) => [...prev, newContact]);
        setShowAddContactModal(false);
        setNewContact({ email: "", name: "", phone: "" });

        setRecipients((prev) => {
          let old = [...prev];
          let findIndex = old.findIndex(
            (u) => u.role == currentRole && u.email.length == 0
          );

          if (findIndex >= 0) {
            old[findIndex] = {
              ...old[findIndex],
              email: newContact.email,
            };
          } else {
            old = [
              ...old,
              {
                email: newContact.email,
                role: currentRole,
              },
            ];
          }

          return old;
        });

        setSignatureElements((prev) => {
          let old = [...prev];
          let findIndex = old.findIndex(
            (u) =>
              u.recipientRole == currentRole && u.recipientEmail.length == 0
          );

          if (findIndex >= 0) {
            old[findIndex] = {
              ...old[findIndex],
              recipientEmail: newContact.email,
            };
          }

          return old;
        });

        setCurrentRole("");
      }
    } catch (e) {
      console.log(e.message);
    }
  };
  const [containerDimensions, setContainerDimensions] = useState({
    width: 800,
    height: 0,
  });
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
  });
  const handleSendDocument = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let isEmpty = recipients.find((u) => u.email.length == 0);
      if (isEmpty) {
        toast.error("Please assign email to all roles", {
          containerId: "editTemplate",
        });
        return;
      }

      setLoading(true);

      let form = new FormData();
      form.append("document", currentTemplate.file);
      form.append("elements", JSON.stringify(signatureElements));
      form.append("documentId", currentTemplate._id);

      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        form,
        headers
      );

      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const newfile = new File(
        [blob],
        `signedDocument-${currentTemplate._id}`,
        {
          type: "application/pdf",
        }
      );
      const dataForm = new FormData();
      dataForm.append("document", newfile);

      let newData = {
        ...currentTemplate,
        elements: signatureElements,
        copyId: currentTemplate._id,
        signTemplate: true,
      };

      let res = await axios.post(`${BASE_URL}/createSignTemplate`, newData);

      let edited = await axios.patch(
        `${BASE_URL}/editDocument/${res.data.doc._id}`,
        dataForm,
        headers
      );

      let restwo = await axios.post(
        `${BASE_URL}/sendSignRequest`,
        { documentId: res.data.doc._id, recipients: recipients },
        headers
      );
      toast.success("Document sent successfully!", {
        containerId: "editTemplate",
      });
      setShowAddSignerModal(false);
      setLoading(false);
      window.location.href = "/admin/template/create";
      setShowSendConfirmation(false);
    } catch (e) {
      setLoading(false);
      console.log(e.message);
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "editTemplate" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "editTemplate",
        });
      }
    }
  };

  const createTemplateView = async () => {
    let isEmpty = recipients.find((u) => u.email.length == 0);
    if (isEmpty) {
      toast.error("Please assign email to all roles", {
        containerId: "editTemplate",
      });
      return;
    }

    try {
      setCurrentTemplate((prev) => {
        let old = { ...prev };
        old = {
          ...old,
          elements: signatureElements,
        };
        return old;
      });

      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      let form = new FormData();
      form.append("document", currentTemplate.file);
      form.append("elements", JSON.stringify(signatureElements));
      form.append("documentId", currentTemplate._id);

      const embedResponse = await axios.post(
        `${BASE_URL}/embedElementsInPDF`,
        form,
        headers
      );

      const blob = new Blob([embedResponse.data], { type: "application/pdf" });
      const newfile = new File(
        [blob],
        `signedDocument-${currentTemplate._id}`,
        {
          type: "application/pdf",
        }
      );
      const dataForm = new FormData();
      dataForm.append("document", newfile);

      let signers = signatureElements.map((val, i) => {
        return { email: val.recipientEmail, role: val.recipientRole };
      });

      signers = signers.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.email === value.email)
      );
      console.log("signers");
      console.log(signers);
      console.log(signatureElements);

      let newData = {
        ...currentTemplate,
        elements: signatureElements,
        copyId: currentTemplate._id,
        signTemplate: true,
        signers,
      };

      let res = await axios.post(`${BASE_URL}/createSignTemplate`, newData);

      let edited = await axios.patch(
        `${BASE_URL}/editDocument/${res.data.doc._id}`,
        dataForm,
        headers
      );

      setViewTemplateId(res.data.doc._id);
      setShowSendConfirmation(true);
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "editTemplate" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "editTemplate",
        });
      }
    }
  };

  const copyDocumentLink = (email) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/admin/request-signatures/sign-document/${viewTemplateId}?email=${email}`
    );
    toast.success("Link copied to clipboard", { containerId: "editTemplate" });
  };
  const shareLink = (email) => {
    const link = `${window.location.origin}/admin/request-signatures/sign-document/${viewTemplateId}?email=${email}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Sign Document",
          text: "Please sign the document",
          url: link,
        })
        .then(() => {
          toast.success("Link shared successfully", {
            containerId: "editTemplate",
          });
        })
        .catch((error) => {
          toast.error("Failed to share the link", {
            containerId: "editTemplate",
          });
        });
    } else {
      navigator.clipboard
        .writeText(link)
        .then(() => {
          toast.success("Link copied to clipboard", {
            containerId: "editTemplate",
          });
        })
        .catch((error) => {
          toast.error("Failed to copy the link", {
            containerId: "editTemplate",
          });
        });
    }
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
    if (selectedRecipientIndex === index) {
      setSelectedRecipientIndex(null);
    } else if (selectedRecipientIndex > index) {
      setSelectedRecipientIndex(selectedRecipientIndex - 1);
    }
  };

  return (
    <>
      <ToastContainer containerId={"editTemplate"} />
      <div className="admin-content h-full">
        <div
          className="flex min-h-screen lg:flex-row flex-col gap-[10px] bg-gray-100"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleElementTouchMove}
          onTouchEnd={handleElementTouchEnd}
          onDrop={handleDocumentDrop}
          onDragOver={(e) => e.preventDefault()}
          ref={containerRef}
        >
          <div className="flex-1 p-4 overflow-auto relative">
            <button
              onClick={() => {
                setShowAddSignerModal(true);
              }}
              className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg "
            >
              Next
            </button>

            <div className="pdf-container">
            <Document file={file} onLoadSuccess={onLoadSuccess}>
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
    width={
      isMobile
        ? window.innerWidth - 32
        : Math.min(containerDimensions.width, 800)
    }
    renderAnnotationLayer={false}
    renderTextLayer={false}
  />
</Document>
            </div>

            {signatureElements?.filter(element => 
  element.pageNumber === pageNumber || !element.pageNumber // Show elements without pageNumber for backward compatibility
)?.map((element) => renderFieldPreview(element))}
          </div>

          <div className="lg:w-80 w-full bg-white p-4 shadow-lg overflow-y-auto lg:max-h-screen max-h-[300px]">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Recipients</h3>
              {recipients.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded border ${
                        recipientColors[index % recipientColors.length]
                      } ${
                        selectedRecipientIndex === index
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedRecipientIndex(index)}
                    >
                      <span className="text-sm">{recipient.email}</span>
                      <div className="flex items-center">
                        <span className="text-xs bg-white text-gray-800 px-2 py-1 rounded mr-2">
                          {recipient.role || "Signer"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecipient(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  No recipients added yet
                </p>
              )}
              <button
                onClick={() => setShowAddRecipientModal(true)}
                className="w-full border border-red-600 text-red-600 rounded-[20px] py-2 hover:bg-red-600 hover:text-white transition-colors"
              >
                + Add Recipient
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

          {showAddSignerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <div className="flex justify-between">
                  <h3 className="text-xl font-bold mb-4">Add Signer</h3>
                  <div
                    className="cursor-pointer text-[14px]"
                    onClick={() => {
                      setShowAddSignerModal(false);
                    }}
                  >
                    X
                  </div>
                </div>
                <div className="flex flex-col bg-[#dedede] px-[20px] py-[30px] border border-gray-400 rounded-[20px] gap-2 my-[40px]">
                  {selectRoles?.map((role, index) => (
                    <div key={index}>
                      <label className="text-[12px]">{role.roleName}</label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2 border rounded"
                          value={selectedSignerEmail}
                          onChange={(e) => {
                            const email = e.target.value;

                            const recipientExists = recipients.some(
                              (recipient) => recipient.email === email
                            );

                            if (recipientExists) {
                              toast.error(
                                "This email is already assigned a different role.",
                                { containerId: "editTemplate" }
                              );
                            } else {
                              setRecipients((prev) => {
                                let old = [...prev];

                                const findIndex = old.findIndex(
                                  (u) =>
                                    u.role === role.roleValue &&
                                    u.email.length === 0
                                );

                                if (findIndex >= 0) {
                                  old[findIndex] = {
                                    ...old[findIndex],
                                    email,
                                  };
                                } else {
                                  old.push({
                                    email: email,
                                    role: role.roleValue,
                                  });
                                }

                                return old;
                              });

                              setSignatureElements((prev) => {
                                let old = [...prev];

                                const findIndex = old.findIndex(
                                  (u) =>
                                    u.recipientRole === role.roleValue &&
                                    u.recipientEmail.length === 0
                                );

                                if (findIndex >= 0) {
                                  old[findIndex] = {
                                    ...old[findIndex],
                                    recipientEmail: email,
                                  };
                                }

                                return old;
                              });
                            }
                          }}
                        >
                          <option value="">Select Email</option>
                          {staticEmails.map((contact) => (
                            <option key={contact.email} value={contact.email}>
                              {contact.email}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setCurrentRole(role.roleName);
                            setShowAddContactModal(true);
                          }}
                          className="text-red-600 border-red-600 border px-3 py-1 rounded hover:bg-red-600 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 ">
                  <button
                    onClick={createTemplateView}
                    className="bg-[#002864] text-white px-4 py-2 rounded-[20px] flex items-center gap-2 hover:bg-[#001a42] transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Next
                  </button>
                  <button
                    onClick={() => setShowAddSignerModal(false)}
                    className="bg-[#29354a] text-white px-4 py-2 rounded-[20px] flex items-center gap-2 hover:bg-[#1e2735] transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddContactModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <h3 className="text-xl font-bold mb-4">Add New Contact</h3>
                <div className="space-y-4">
                  <input
                    type="email"
                    className="w-full p-2 border rounded"
                    placeholder="Email"
                    value={newContact.email}
                    onChange={(e) => {
                      setNewContact({ ...newContact, email: e.target.value });
                    }}
                  />

                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                  />
                  <input
                    type="tel"
                    className="w-full p-2 border rounded"
                    placeholder="Phone Number"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowAddContactModal(false)}
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContact}
                    className="bg-[#002864] text-white px-4 py-2 rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSendConfirmation && loading == false ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96 text-left">
                <div className="flex justify-between">
                  <h3 className="text-xl font-bold mb-4">Send Mail</h3>
                  <div
                    className="text-[18px] cursor-pointer"
                    onClick={() => {
                      setShowSendConfirmation(false);
                      setShowAddSignerModal(true);
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
                    className="bg-[#002864] w-full text-white px-4 py-2 rounded"
                    onClick={handleSendDocument}
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

                {recipients?.map((val, i) => {
                  return (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-600">{val?.email}</p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => copyDocumentLink(val?.email)}
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
                          Copy link
                        </button>
                        <button
                          onClick={() => shareLink(val?.email)}
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
                  );
                })}
              </div>
            </div>
          ) : showSendConfirmation && loading == true ? (
            <>
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-4">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Processing Email Delivery
                      <span className="block text-sm font-normal text-gray-500 mt-1">
                        Please wait while we send documents to all recipients
                      </span>
                    </h3>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-6">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      Bulk Send Requirements
                    </h4>
                    <div className="text-blue-700 space-y-2">
                      <p className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>
                          Currently all template roles are assigned to specific
                          contacts
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>
                          To enable bulk sending, please ensure at least one
                          role remains unassigned
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 flex items-start gap-2">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                      </svg>
                      <span>
                        Note: Bulk sending allows simultaneous distribution to
                        multiple signers. Unassigned roles will create unique
                        links for individual recipient assignment.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            ""
          )}

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
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRole}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
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
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOptionsSubmit}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
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
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                  >
                    <option value="">Select Email</option>
                    {staticEmails.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Role</label>
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
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignmentSubmit}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddRecipientModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Add Recipient</h3>
                  <button
                    onClick={() => setShowAddRecipientModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Select Email
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                  >
                    <option value="">Select an email</option>
                    {dummyEmails.map((email) => (
                      <option key={email?.email} value={email?.email}>
                        {email?.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddRecipientModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedRecipient) {
                        const recipientExists = recipients.some(
                          (recipient) => recipient.email === selectedRecipient
                        );

                        if (recipientExists) {
                          toast.error(
                            "This recipient has already been selected.",
                            { containerId: "editTemplate" }
                          );
                        } else {
                          setRecipients([
                            ...recipients,
                            {
                              email: selectedRecipient,
                              role: "Signer",
                            },
                          ]);
                          setSelectedRecipientIndex(recipients.length);
                          setShowAddRecipientModal(false);
                          setSelectedRecipient("");
                        }
                      }
                    }}
                    className="px-6 py-2 bg-[#002864] text-white rounded-lg hover:bg-[#001a42]"
                    disabled={!selectedRecipient}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UseTemplate;
