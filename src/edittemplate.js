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

const EditTemplate = () => {
  const params = useParams();
  let id = params.documentId;
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
        className="p-2 bg-gray-100 hover:bg-gray-200 text-sm cursor-move rounded mb-1"
        draggable
        onDragStart={handleToolDragStart(type)}
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
      setRoles([...roles, { id: uuidv4(), name: newRole.trim() }]);
      setNewRole("");
      setShowRoleModal(false);
    }
  };

  const deleteRole = (id) => {
    setRoles(roles.filter((role) => role.id !== id));
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
      <div className="admin-content">
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
              onClick={handleSaveTemplate}
              className="absolute top-4 right-4 z-50 bg-[#002864] text-white px-6 py-2 rounded-[20px] shadow-lg "
            >
              Next
            </button>

            <div className="pdf-container">
              <Document file={file} onLoadSuccess={onLoadSuccess}>
                <Page
                  pageNumber={1}
                  width={800}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
            </div>

            {signatureElements.map((element) => renderFieldPreview(element))}
          </div>

          <div className="w-80 bg-white p-4 shadow-lg overflow-y-auto">
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

export default EditTemplate;
