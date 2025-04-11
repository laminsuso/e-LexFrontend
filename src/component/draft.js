import React, { useEffect, useState ,useRef} from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "../baseUrl";
export default function Draft({ requests, setRequests, loading }) {
  const navigate = useNavigate();
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);



  const handleSaveAsTemplate = async (id) => {
   
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${BASE_URL}/handleSaveAsTemplate/${id}`,
        {},
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success("Draft saved as template successfully!", {
        containerId: "manageDrafts",
      });
      setRequests((prev)=>{
        let old=[...prev]
        let newold=old.filter(u=>u._id!=id)
        return newold
      })
      setActiveMenu(null);
    } catch (e) {
      
      setActiveMenu(null);
     if(e?.response?.data?.error){
      toast.error(e.response?.data?.error || "Failed to save template", {
        containerId: "manageDrafts",
      });
     }else{
      toast.error("Something went wrong" || "Failed to save template", {
        containerId: "manageDrafts",
      });
     }
    }
  };

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
        let res = await axios.delete(`${BASE_URL}/deleteDraft/${id}`);
        toast.success(res.data.message, { containerId: "manageDrafts" });
        setRequests((prev) => {
          let old = [...prev];
          return old.filter((u) => u._id != id);
        });
      } catch (e) {
        if (e?.response?.data?.error) {
          toast.error(e?.response?.data?.error, {
            containerId: "manageDrafts",
          });
        } else {
          toast.error("Something went wrong please try again", {
            containerId: "manageDrafts",
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

      let response = await axios.get(`${BASE_URL}/getDrafts`, headers);

      setRequests(response.data.drafts);
    
    } catch (e) {
    
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, {
          containerId: "manageDrafts",
        });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "manageDrafts",
        });
      }
    }
  };

  return (
    <>
      <ToastContainer containerId={"manageDrafts"} />

      <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Draft Documents
        </h2>

        {loading?.draft ? (
          <>
            <div class="h-[250px] flex justify-center items-center">
              <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-7 min-w-[600px] border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px]">
              <div>Title</div>

              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div>Actions</div>
            </div>

            {requests?.length == 0 ? (
              <>
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No draft documents found
                </div>
              </>
            ) : (
              requests?.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-7 py-3 min-w-[600px] px-4 border-b border-gray-100 items-center"
                >
                  <div className="font-medium lg:text-[16px] text-sm">{request.title}</div>

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
                      onClick={() => handleViewSigners(request.signers)}
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
              <div  className="relative">
              <div className="relative" ref={menuRef}>
          <button
            onClick={() => setActiveMenu(activeMenu === request._id ? null : request._id)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
            </button>
            </div>
                    {activeMenu === request._id && (
            <div className="absolute left-[2%] mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => handleSaveAsTemplate(request._id)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg
                  className="w-4 h-4 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Save as Template
              </button>
            </div>
          )}
              </div>
                  </div>
                </div>
              ))
            )}

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
          </>
        )}
      </div>
    </>
  );
}
