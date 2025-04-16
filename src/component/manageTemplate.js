import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "../baseUrl";

export default function ManageTemplates({ requests, setRequests }) {
  const navigate = useNavigate();
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [bulkLength,setBulkLength]=useState(0)
  const [currentTemplateId,setCurrentTemplateId]=useState("")
  const [loading,setLoading]=useState(false)
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [recipients, setRecipients] = useState([{ role: "", email: "" }]);
  const [showMenuId, setShowMenuId] = useState(null);
  const [showRename, setShowRename] = useState(false);
  const handleDownload = async (fileUrl) => {
    if (!fileUrl) {
      console.error("Invalid file URL");
      return;
    }

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch the file.");
      const blob = await response.blob();
      const fileName = fileUrl.split("/").pop();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading the file:", error);
      toast.error("Failed to download the file.", {
        containerId: "manageTemplate",
      });
    }
  };

  const handleViewSigners = (signers) => {
    setCurrentSigners(signers);
    setShowSignersPopup(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      try {
        let res = await axios.delete(`${BASE_URL}/deleteTemplate/${id}`);
        toast.success(res.data.message, { containerId: "manageTemplate" });
        setRequests((prev) => prev.filter((u) => u._id != id));
      } catch (e) {
        if (e?.response?.data?.error) {
          toast.error(e?.response?.data?.error, {
            containerId: "manageTemplate",
          });
        } else {
          toast.error("Something went wrong please try again", {
            containerId: "manageTemplate",
          });
        }
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edittemplate/${id}`);
  };
  const handleUse = (id) => {
    navigate(`/admin/usetemplate/${id}`);
  };

  const handleBulkSend = (template) => {
    setCurrentTemplate(template);
    console.log('current template')
    console.log(template)
    console.log(template?.elements?.filter(u => u?.recipientEmail && u?.recipientEmail.trim() !== '').length > 0)
    let recipients = template.elements
    .map((val, i) => ({
      email: val.recipientEmail,
      role: val.recipientRole,
      alreadyCreated: val.recipientEmail ? true : false 
    }))
    
    .filter((value, index, self) => 
      index === self.findIndex((t) => (
        t.email === value.email && t.role === value.role
      ))
    );
  
  
  
 
  
    setRecipients(recipients);
    setShowBulkSendModal(true);
  };

  const handleAddRecipient = () => {
   
    let elementsRecipients = currentTemplate.elements
  .map((val, i) => ({
    email: val.recipientEmail,
    role: val.recipientRole,
    alreadyCreated: val.recipientEmail ? true : false 
  }))

  .filter((value, index, self) => 
    index === self.findIndex((t) => (
      t.email === value.email && t.role === value.role
    ))
  );


   if(recipients?.length==elementsRecipients?.length){
toast.error("No more roles avaiable",{containerId:"manageTemplate"})
return
   }else{
    let availableRole = elementsRecipients.find(
      (element) => !recipients.some((recipient) => recipient.role === element.recipientRole)
    );
  
     setRecipients([...recipients, { role: availableRole.role, email: "" }]);
   }
  };

  const handleRecipientChange = (index, field, value) => {
    const updatedRecipients = [...recipients];
    updatedRecipients[index][field] = value;
    
    setRecipients(updatedRecipients);
  };

  const handleRemoveRecipient = (index) => {
    if (recipients.length > 1) {
      const updatedRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(updatedRecipients);
    }
  };

  const handleBulkSendSubmit = async () => {
    try {
  
      const seenEmails = new Set();
      const seenEmailsForRoles = new Map();
  
      
      for (let recipient of recipients) {
        const { email, role } = recipient;
  
        
        if (email) {
          if (seenEmails.has(email)) {
           
            if (seenEmailsForRoles.has(email) && seenEmailsForRoles.get(email) !== role) {
              toast.error("Please assign a unique email to each role", {
                containerId: "manageTemplate",
              });
              return; 
            }
          } else {
            
            seenEmailsForRoles.set(email, role);
            seenEmails.add(email);
          }
        }
      }
  
      
    let missing=recipients.find(u=>u.role.length==0 || u.email.length==0)
    if(missing){
      setLoading(false)
      toast.error("Please fill each role and email", {
        containerId: "manageTemplate",
      });
      return;
    }

    setLoading(true)
    let token=localStorage.getItem('token')
    let headers={
      headers:{
        authorization:`Bearer ${token}`
      }
    }
    let data={
      documentId:currentTemplate._id,
      recipients
    }

let toSendTemplate=currentTemplate;
let elements = toSendTemplate.elements;
elements.forEach(element => {
  
  if (!element.recipientEmail) {
   
    const matchingRecipient = recipients.find(recipient => recipient.role === element.recipientRole);
    
   
    if (matchingRecipient) {
      element.recipientEmail = matchingRecipient.email;
    }
  }
});

  
//
let form=new FormData();
form.append("document", currentTemplate.file);
form.append("elements", JSON.stringify(elements));
form.append('documentId',currentTemplate._id)

const embedResponse = await axios.post(
  `${BASE_URL}/embedElementsInPDF`,
  form,
  headers
);

const blob = new Blob([embedResponse.data], { type: "application/pdf" });
const newfile = new File([blob], `signedDocument-${currentTemplate._id}`, {
  type: "application/pdf",
});
const dataForm = new FormData();
dataForm.append("document", newfile);

let signers=recipients.map((val,i)=>{
  return {
    email:val.email
  }
})

let newData={
...currentTemplate,
elements,
copyId:currentTemplate._id,
signTemplate:true,

}



let res=await axios.post(`${BASE_URL}/createSignTemplate`,newData)


let edited=await axios.patch(`${BASE_URL}/editDocument/${res.data.doc._id}`,dataForm,headers)



//

data={
  ...data,
  documentId:res.data.doc._id
}



     let response=await axios.post(`${BASE_URL}/sendSignRequest`,{documentId:res.data.doc._id,recipients:recipients},headers)
     toast.success("Documents sent successfully!", {
      containerId: "manageTemplate",
    });
    
    setTimeout(()=>{
window.location.reload(true)
    },500)

    } catch (error) {
      
      if(error?.response?.data?.error){
        toast.error(error?.response?.data?.error, {
          containerId: "manageTemplate",
        });
      }else{
        toast.error("Failed to send documents", {
          containerId: "manageTemplate",
        });
      }
      setLoading(false)
    }
  };

  const toggleMenu = (id) => {
    setShowMenuId(showMenuId === id ? null : id);
  };

  const handleMenuAction = (action, template) => {
    setShowMenuId(null);
    switch (action) {
      case "edit":
        handleEdit(template._id);
        break;
      case "share":
       
        break;
      case "rename":
        setShowRename(true);
        break;
      case "copyId":
        navigator.clipboard.writeText(template._id);
        toast.success("Template ID copied!", { containerId: "manageTemplate" });
        break;
      case "embed":
       
        break;
      case "copyUrl":
        navigator.clipboard.writeText(
          `${window.location.origin}/template/${template._id}`
        );
        toast.success("Public URL copied!", { containerId: "manageTemplate" });
        break;
      case "duplicate":
        
        handleDuplicate(template)

        break;
      case "delete":
        handleDelete(template._id);
        break;
      default:
        break;
    }
  };

  const handleDuplicate=async(template)=>{
    try{
      let token=localStorage.getItem('token')
      let headers={
        headers:{
          authorization:`Bearer ${token}`
        }
      }
  let response=await axios.post(`${BASE_URL}/duplicateTemplate`,template,headers)
      setShowRename(false);
      
      toast.success("Document duplicated sucessfully",{containerId:"manageTemplate"})
      fetchTemplates();
     }catch(e){
  if(e?.response?.data?.error){
    toast.error(e?.response?.data?.error,{containerId:"manageTemplate"})
  }else{
    toast.error("Something went wrong please try again",{containerId:"manageTemplate"})
  }
     }
  }


  

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = { headers: { authorization: `Bearer ${token}` } };
      let response = await axios.get(`${BASE_URL}/getAllTemplates`, headers);
      setRequests(response.data.docs);
    } catch (e) {
    
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, {
          containerId: "manageTemplate",
        });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "manageTemplate",
        });
      }
    }
  };
  const [renameInput, setRenameInput] = useState("");
  const handleRename = async() => {
   try{
    let token=localStorage.getItem('token')
    let headers={
      headers:{
        authorization:`Bearer ${token}`
      }
    }
let response=await axios.patch(`${BASE_URL}/editDocument/${currentTemplateId}`,{title:renameInput},headers)
    setShowRename(false);
    setCurrentTemplateId("")
    toast.success("Document renamed sucessfully",{containerId:"manageTemplate"})
    setRequests((prev)=>{
      let old=[...prev]
      let docIndex=old.findIndex(u=>u._id==currentTemplateId)
      old[docIndex]={
        ...old[docIndex],
        title:renameInput
      }
return old;
    })
   }catch(e){
if(e?.response?.data?.error){
  toast.error(e?.response?.data?.error,{containerId:"manageTemplate"})
}else{
  toast.error("Something went wrong please try again",{containerId:"manageTemplate"})
}
   }
  };
  return (
    <>
      <ToastContainer containerId={"manageTemplate"} />

      <div className="py-[8px] px-[16px] bg-white rounded-[10px] cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Templates
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[800px] min-h-[500px]">
            <div className="grid grid-cols-8 border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px]">
              <div>Title</div>
              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div className="col-span-2">Actions</div>
            </div>

            {requests?.length==0?<>
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No templates found
                </div>
            </>:requests?.map((request) => (
              <div
                key={request._id}
                className="grid grid-cols-8 py-3 px-4 border-b border-gray-100 items-center"
              >
                <div className="text-sm font-bold">{request.title}</div>

                <div>
                  <button
                    onClick={() => handleDownload(request.file)}
                    className="text-blue-600 underline flex items-center text-sm"
                  >
                    Download
                  </button>
                </div>

                <div>{request?.owner?.name}</div>

                <div>
                  <button
                    onClick={() => {
                      if(request.signers.length>0){
                        handleViewSigners(request.signers)
                      } 
                    }}
                    className="text-blue-600 underline flex items-center text-sm"
                  >
                    View ({request.signers.length})
                  </button>
                </div>

                <div className="flex items-center min-w-[300px] gap-2">
                  <button
                    onClick={() => handleUse(request._id)}
                    className="bg-[#002864] text-white px-3 py-1 rounded text-sm"
                  >
                    Use
                  </button>
                  <button
                  
                    onClick={() => handleBulkSend(request)}
                    className="bg-[#29354a] text-white px-3 py-1 rounded text-sm"
                  >
                    Bulk Send
                  </button>
                </div>

                <div className="relative flex justify-end">
                  <button
                    onClick={() => toggleMenu(request._id)}
                    className="text-gray-600 hover:text-gray-800 p-1"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {showMenuId === request._id && (
                    <div className="absolute right-0 mt-6 w-48 bg-white rounded-md shadow-lg z-50 py-1">
                      <button
                        onClick={() => handleMenuAction("edit", request)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTemplateId(request._id)
                          handleMenuAction("rename", request)
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={() => handleMenuAction("copyId", request)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                        Copy Template ID
                      </button>
                   
                    
                      <button
                        onClick={() => handleMenuAction("duplicate", request)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleMenuAction("delete", request)}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {showSignersPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Signers</h3>
              <ul className="space-y-2">
                {currentSigners.map((signer, index) => (
                  <li key={index} className="border-b pb-2 last:border-b-0">
                    {signer?.email}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowSignersPopup(false)}
                  className="bg-gray-200 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showBulkSendModal && loading==false && currentTemplate && currentTemplate?.elements?.filter(u=>u?.recipientEmail?.length==0)?.length>0 ?(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold mb-4">Bulk Send</h3>
                <button
                  onClick={() => setShowBulkSendModal(false)}
                  className="text-black text-[18px]"
                >
                  X
                </button>
              </div>
              <div className="bg-[#a6adbb] p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">
                  Sending: {currentTemplate.title}
                </h4>
                {recipients.map((recipient, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Role
                      </label>
                      <select
                      disabled={true}
                        className="w-full p-2 border rounded bg-white"
                        value={recipient.role}
                        onChange={(e) =>
                          handleRecipientChange(index, "role", e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select Role
                        </option>
                        {currentTemplate?.elements
  .filter((value, index, self) => 
    index === self.findIndex((t) => (
      t.recipientRole === value.recipientRole  
    ))
  )
  .map((val, i) => (
    <option key={i.toString()} value={val?.recipientRole}>
      {val?.recipientRole}
    </option>
  ))
}

                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <div className="flex">
                        <input
                          type="email"
                          disabled={recipient?.alreadyCreated}
                          className="flex-1 p-2 border rounded"
                          value={recipient.email}
                          onChange={(e) =>
                            handleRecipientChange(
                              index,
                              "email",
                              e.target.value
                            )
                          }
                          placeholder="Enter email"
                        />
                       
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-[20px]">
                <button
                  onClick={handleAddRecipient}
                  className="bg-[#002864] text-white px-4 py-2 rounded"
                >
                  Add New
                </button>

                <button
                disabled={loading}
                  onClick={handleBulkSendSubmit}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ):showBulkSendModal && loading==false && currentTemplate && currentTemplate?.elements?.filter(u=>u?.recipientEmail?.length>0)?.length>0?(
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold mb-4">Bulk Send</h3>
            <button
              onClick={() => setShowBulkSendModal(false)}
              className="text-black text-[18px]"
            >
              X
            </button>
          </div>
          <div className="bg-[#a6adbb] p-4 rounded-lg mb-4">
          <h4 className="font-medium mb-2">
             Bulk send
            </h4>

            <p>

              All roles in this document are currently linked to contacts. To quick send copies of this template to multiple signers, please ensure that at least one role is not linked to any contact
            </p>
          </div>
         
        </div>
      </div>
        ):loading==true?(
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
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Bulk Send Requirements
              </h4>
              <div className="text-blue-700 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Currently all template roles are assigned to specific contacts</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>To enable bulk sending, please ensure at least one role remains unassigned</span>
                </p>
              </div>
            </div>
        
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                </svg>
                <span>
                  Note: Bulk sending allows simultaneous distribution to multiple signers. 
                  Unassigned roles will create unique links for individual recipient assignment.
                </span>
              </p>
            </div>
        
            <div className="mt-6 flex justify-end">
             
            </div>
          </div>
        </div>
        ):''
        }
        {showRename && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold mb-4">Rename</h3>
                <button
                  onClick={() => {
                    setCurrentTemplateId("")
                    setShowRename(false)
                  }}
                  className="text-black text-[18px]"
                >
                  X
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="w-full p-2 border rounded bg-white"
                  placeholder="Enter new name"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                />
                <button
                  onClick={handleRename}
                  className="bg-[#002864] text-white px-4 py-2 rounded hover:bg-[#001a42] transition-colors whitespace-nowrap"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
