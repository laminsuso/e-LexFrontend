import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { useEffect } from "react";
import { ToastContainer,toast } from "react-toastify";
export default function SentForSignature({requests,setRequests,loading}) {
 
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameId, setRenameId] = useState(null);
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shareLink, setShareLink] = useState("");
  const itemsPerPage = 5;
  const sentSignatureRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/recentSentRequest`, {
        headers: { authorization: `Bearer ${token}` },
      });
     
      const transformedData = response.data.docs.map((doc) => ({
        id: doc._id,
        title: doc.title,
        fileName: doc.file.split("/").pop(),  
        filePath: doc.file,
        owner: doc.owner,
        signers: doc.signers,
        expiryDate: new Date(doc.createdAt).toLocaleDateString(),
        status: doc.status,
      }));

      setRequests(transformedData);
    } catch (error) {
      console.error("Error fetching signature requests:", error);
    }
  };


  const handleDownload = async(filePath, fileName) => {
  try{
    const response=await fetch(filePath)
    const blob=await response.blob();
    const blobUrl=URL.createObjectURL(blob)
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || filePath.split("/").pop(); 
    document.body.appendChild(link);
 
    link.click();
 
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }catch(e){
toast.error("Unable to download file at the moment",{containerId:"sentforsignature"})
  }
  };

  const handleViewSigners = (signers) => {
   
   
    setCurrentSigners(signers);
    setShowSignersPopup(true);
  };

  const handleShare = (id) => {
    const fullUrl = `${window.location.origin}/admin/view-pdf/sign-document/${id}`;
    setShareLink(fullUrl);
    setShowSharePopup(true);
  };
  const recentSentRequest = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
     
      let response = await axios.get(`${BASE_URL}/recentSentRequest`, headers);
     
    } catch (e) {
      if(e?.response?.data?.error){
        toast.error(e?.response?.data?.error,{containerId:"sentforsignature"})
      }else{
        toast.error("Something went wrong please try again",{containerId:"sentforsignature"})
      }

    }
  };
  useEffect(() => {
    recentSentRequest();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard",{containerId:"sentforsignature"})
    
  };

  const toggleDropdown = (id) => {
    setShowDropdown(showDropdown === id ? null : id);
  };

  const handleDropdownAction = async (action, id,elements) => {
    setShowDropdown(null);
    
    if (action === "Delete") {
      if (window.confirm("Are you sure you want to delete this document?")) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${BASE_URL}/deleteDocument/${id}`, {
            headers: { authorization: `Bearer ${token}` },
          });
          toast.success("Document deleted successfully",{containerId:"sentforsignature"});
          sentSignatureRequests();
        } catch (err) {
          if(err?.response?.data?.error){
            toast.error(err?.response?.data?.error,{containerId:"sentforsignature"})
          }else{
            toast.error("Something went wrong please try again",{containerId:"sentforsignature"})
          }
         
        }
      }
    }else if(action=="Revoke"){

      if (window.confirm("Are you sure you want to revoke this document?")) {
        try {
          const token = localStorage.getItem("token");
          await axios.delete(`${BASE_URL}/deleteDocument/${id}`, {
            headers: { authorization: `Bearer ${token}` },
          });
          toast.success("Document revoked successfully",{containerId:"sentforsignature"});
          sentSignatureRequests();
        } catch (err) {
          if(err?.response?.data?.error){
            toast.error(err?.response?.data?.error,{containerId:"sentforsignature"})
          }else{
            toast.error("Something went wrong please try again",{containerId:"sentforsignature"})
          }
         
        }
      }
    }else if(action=="Template"){
      try {
        const token = localStorage.getItem("token");
        await axios.patch(`${BASE_URL}/editDocument/${id}`,{template:true}, {
          headers: { authorization: `Bearer ${token}` },
        });
        toast.success("Document saved as template successfully",{containerId:"sentforsignature"});
        sentSignatureRequests();
        
      } catch (err) {
        if(err?.response?.data?.error){
          toast.error(err?.response?.data?.error,{containerId:"sentforsignature"})
        }else{
          toast.error("Something went wrong please try again",{containerId:"sentforsignature"})
        }
       
      }
    }else if(action=="Resend"){
      let recipients=elements.map((val,i)=>{
        return {
          email:val.email
        }
      });
      try {
        const token = localStorage.getItem("token");
        let data={
          documentId:id,
        recipients
        }
        await axios.post(`${BASE_URL}/sendSignRequest`,data, {
          headers: { authorization: `Bearer ${token}` },
        });
        toast.success("Signature request resent sucessfully",{containerId:"sentforsignature"});
        sentSignatureRequests();
        
      } catch (err) {
        if(err?.response?.data?.error){
          toast.error(err?.response?.data?.error,{containerId:"sentforsignature"})
        }else{
          toast.error("Something went wrong please try again",{containerId:"sentforsignature"})
        }
    
      }
    }
  };

  const totalPages = Math.ceil(requests?.length / itemsPerPage);
  const paginatedRequests = requests?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handleRenameSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${BASE_URL}/editDocument/${renameId}`,
        { title: renameTitle },
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

    toast.success("Document renamed successfully",{containerId:"sentforsignature"});
      setShowRenameModal(false);
      setShowDropdown(false)
      sentSignatureRequests();
    } catch (error) {
      if(error?.response?.data?.error){
        toast.error(error?.response?.data?.error,{containerId:"sentforsignature"})
      }else{
        toast.error("Something went wrong please try again",{containerId:"sentforsignature"})
      }
     
    }
  };

  return (
   <div>
  
  <ToastContainer containerId={"sentforsignature"}/>

    <div className="py-[8px] px-[16px] bg-white overflow-x-auto rounded-[10px] cursor-pointer min-h-[430px]">
      <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
        Recently sent for signatures
      </h2>

      {loading?.outforsignature?<div class="h-[250px] flex justify-center items-center">
  <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
</div>:<>
        <div className="grid grid-cols-5 min-w-[600px] border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px]">
        <div>Title</div>
        <div>File</div>
        <div>Owner</div>
        <div>Signers</div>
        <div>Action</div>
      </div>

      {paginatedRequests?.length==0?<>
        <div className="h-[200px] flex items-center justify-center text-gray-500">
    No sent requests found
  </div>
      </>:paginatedRequests?.map((request) => (
        <div
          key={request.id}
          className="grid grid-cols-5 min-w-[600px] py-3 px-4 border-b border-gray-100 items-center"
        >
          <div>
            <div className="font-bold text-sm lg:text-[16px]">{request.title}</div>
           
          </div>

          <div>
            <button
              onClick={() => handleDownload(request.filePath, request.fileName)}
              className="text-blue-600 underline flex items-center text-sm"
            >
              Download
            </button>
          </div>

          <div>{request?.owner?.name}</div>

          <div>
            <button
              onClick={() => handleViewSigners(request.signers)}
              className="text-blue-600 underline flex items-center text-sm"
            >
              View ({request.signers.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare(request.id)}
              className="bg-[#002864] text-white p-2 rounded-full flex items-center justify-center"
              title="Share"
            >
              <i className="fas fa-share-alt text-white text-sm"></i>
            </button>

            <Link
              to={`/admin/view-pdf/sign-document/${request.id}`}
              className="bg-[#29354a] text-white p-2 rounded-full flex items-center justify-center"
              title="View"
            >
              <i className="fas fa-eye text-white text-sm"></i>
            </Link>

            <div className="relative">
              <button
                onClick={() => toggleDropdown(request.id)}
                className="bg-gray-200 text-gray-700 p-2 rounded-full flex items-center justify-center"
                title="More options"
              >
                <i className="fas fa-ellipsis-v text-sm"></i>
              </button>

              {showDropdown === request.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleDropdownAction("Resend", request.id,request.signers)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <i className="fas fa-paper-plane mr-2"></i> Resend
                    </button>
                    <button
                      onClick={() => {
                        setRenameTitle(request.title);
                        setRenameId(request.id);
                        setShowRenameModal(true);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <i className="fas fa-pencil-alt mr-2"></i> Rename
                    </button>
                    <button
                      onClick={() => handleDropdownAction("Revoke", request.id)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <i className="fas fa-ban mr-2"></i> Revoke
                    </button>
                    <button
                      onClick={() => handleDropdownAction("Template", request.id)}
                      className="flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 w-full text-left"
                    >
                      <i className="fas fa-mail-alt mr-2"></i> Save as template
                    </button>
                    <button
                      onClick={() => handleDropdownAction("Delete", request.id)}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                    >
                      <i className="fas fa-trash-alt mr-2"></i> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {showSignersPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Signers</h3>
            <ul className="space-y-2">
              {currentSigners?.map((signer, index) => (
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

      {showSharePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Share Document</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Shareable Link
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 p-2 border rounded-l"
                />
                <button
                  onClick={handleCopyLink}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSharePopup(false)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-[#002864] text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Rename Document</h3>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRenameModal(false)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
   
   </div>
  );
}
