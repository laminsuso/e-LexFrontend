import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "../baseUrl";
export default function DraftDocs() {
  const navigate = useNavigate();
  const [loading,setLoading]=useState(true)
  const [requests, setRequests] = useState([]);
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);

  const handleDownload = async (fileUrl) => {
    if (!fileUrl) {
      console.error("Invalid file URL");
      return;
    }

    try {
    
      const response = await fetch(fileUrl);

     
      if (!response.ok) {
        throw new Error("Failed to fetch the file.");
      }

      
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
      alert("Failed to download the file.");
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
        setRequests((prev) => {
          let old = [...prev];
          return old.filter((u) => u._id != id);
        });
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

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      let response = await axios.get(`${BASE_URL}/getAllTemplates`, headers);

      setRequests(response.data.docs);
      setLoading(false)
    
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

  return (
    <>
      <ToastContainer containerId={"manageTemplate"} />

      <div className="py-[8px] px-[16px] bg-white rounded-[10px] cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Draft Documents
        </h2>

        {loading?<div class="h-[250px] flex justify-center items-center"> <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div> </div>:<>
          <div className="grid grid-cols-7 border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px]">
          <div>Title</div>

          <div>File</div>
          <div>Owner</div>
          <div>Signers</div>
          <div>Actions</div>
        </div>

        {requests?.length==0?  <div className="h-[200px] flex items-center justify-center text-gray-500">
    No draft documents found
  </div>:requests?.map((request) => (
          <div
            key={request.id}
            className="grid grid-cols-7 py-3 px-4 border-b border-gray-100 items-center"
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
                  if (request.signers.length > 0) {
                    handleViewSigners(request.signers);
                  }
                }}
                className="text-blue-600 underline flex items-center text-sm"
              >
                View ({request.signers.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(request._id)}
                className="bg-[#002864] p-2 rounded-[20px] hover:opacity-90 transition-opacity"
              >
                <svg
                  className="w-5 h-5 text-white"
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
              </button>

              <button
                onClick={() => handleDelete(request?._id)}
                className="bg-[#29354a] p-2 rounded-[20px] hover:opacity-90 transition-opacity"
              >
                <svg
                  className="w-5 h-5 text-white"
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
              </button>
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
        </>}
      </div>
    </>
  );
}
