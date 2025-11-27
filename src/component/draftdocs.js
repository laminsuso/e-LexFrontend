// import React, { useEffect, useState } from "react";
// import { Link, useNavigate, useOutletContext } from "react-router-dom";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import { BASE_URL } from "../baseUrl";
// import StatusBadge from "./StatusBadge";

// export default function DraftDocs() {
//   const navigate = useNavigate();

//   // filters from DocumentsLayout (search bar)
//   const { searchText, dateRange, senderFilter } = useOutletContext();

//   const [loading, setLoading] = useState(true);
//   const [requests, setRequests] = useState([]);
//   const [showSignersPopup, setShowSignersPopup] = useState(false);
//   const [currentSigners, setCurrentSigners] = useState([]);

//   const handleDownload = async (fileUrl) => {
//     if (!fileUrl) {
//       console.error("Invalid file URL");
//       return;
//     }

//     try {
//       const response = await fetch(fileUrl);
//       if (!response.ok) {
//         throw new Error("Failed to fetch the file.");
//       }

//       const blob = await response.blob();
//       const fileName = fileUrl.split("/").pop();
//       const downloadUrl = URL.createObjectURL(blob);

//       const link = document.createElement("a");
//       link.href = downloadUrl;
//       link.download = fileName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(downloadUrl);
//     } catch (error) {
//       console.error("Error downloading the file:", error);
//       alert("Failed to download the file.");
//     }
//   };

//   const handleViewSigners = (signers) => {
//     setCurrentSigners(signers || []);
//     setShowSignersPopup(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to delete this draft?")) {
//       try {
//         const res = await axios.delete(`${BASE_URL}/deleteTemplate/${id}`);
//         toast.success(res.data.message, { containerId: "manageTemplate" });
//         setRequests((prev) => prev.filter((u) => u._id !== id));
//       } catch (e) {
//         if (e?.response?.data?.error) {
//           toast.error(e?.response?.data?.error, {
//             containerId: "manageTemplate",
//           });
//         } else {
//           toast.error("Something went wrong please try again", {
//             containerId: "manageTemplate",
//           });
//         }
//       }
//     }
//   };

//   const handleEdit = (id) => {
//     navigate(`/admin/edittemplate/${id}`);
//   };

//   useEffect(() => {
//     fetchTemplates();
//   }, []);

//   const fetchTemplates = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const headers = {
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       };

//       const response = await axios.get(`${BASE_URL}/getAllTemplates`, headers);

//       // normalize structure a bit for filtering
//       const data = (response.data.docs || []).map((doc) => ({
//         ...doc,
//         ownerName: doc?.owner?.name || "",
//         ownerEmail: doc?.owner?.user?.email || "",
//         createdAt: doc.createdAt,
//       }));

//       setRequests(data);
//       setLoading(false);
//     } catch (e) {
//       setLoading(false);
//       if (e?.response?.data?.error) {
//         toast.error(e?.response?.data?.error, {
//           containerId: "manageTemplate",
//         });
//       } else {
//         toast.error("Something went wrong please try again", {
//           containerId: "manageTemplate",
//         });
//       }
//     }
//   };

//   // -------------- FILTER LOGIC (search / date / sender) --------------

//   const normalize = (str) => (str || "").toString().toLowerCase().trim();

//   const matchesText = (tpl) => {
//     if (!searchText) return true;
//     const q = normalize(searchText);

//     const fields = [
//       tpl.title,
//       tpl.ownerName,
//       tpl.ownerEmail,
//       ...(tpl.signers || []).map((s) => s.email),
//     ]
//       .filter(Boolean)
//       .map(normalize);

//     return fields.some((f) => f.includes(q));
//   };

//   const withinDateRange = (tpl) => {
//     if (!dateRange || dateRange === "all") return true;
//     if (!tpl.createdAt) return true;

//     const created = new Date(tpl.createdAt);
//     const now = new Date();
//     const msInDay = 24 * 60 * 60 * 1000;

//     switch (dateRange) {
//       case "7d":
//         return now - created <= 7 * msInDay;
//       case "30d":
//         return now - created <= 30 * msInDay;
//       case "6m":
//         return now - created <= 183 * msInDay; // ~6 months
//       case "1y":
//         return now - created <= 365 * msInDay;
//       default:
//         return true;
//     }
//   };

//   const matchesSender = (tpl) => {
//     if (senderFilter === "all") return true;
//     const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
//     const ownerEmail = (tpl.ownerEmail || "").toLowerCase();
//     const isMe = ownerEmail && ownerEmail === currentUserEmail;

//     if (senderFilter === "me") return isMe;
//     if (senderFilter === "others") return !isMe;
//     return true;
//   };

//   const filtered = requests.filter(
//     (tpl) => matchesText(tpl) && withinDateRange(tpl) && matchesSender(tpl)
//   );

//   // no pagination here currently (you can add it similar to others if needed)

//   return (
//     <>
//       <ToastContainer containerId={"manageTemplate"} />

//       <div className="py-[8px] px-[16px] bg-white rounded-[10px] cursor-pointer min-h-[430px]">
//         <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
//           Draft Documents
//         </h2>

//         {loading ? (
//           <div className="h-[250px] flex justify-center items-center">
//             <div className="op-loading op-loading-infinity w-[4rem] text-neutral" />
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-7 border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px]">
//               <div>Title</div>
//               <div>File</div>
//               <div>Owner</div>
//               <div>Signers</div>
//               <div>Status</div>
//               <div>Last Change</div>
//               <div className="col-span-3">Actions</div>
//             </div>

//             {filtered.length === 0 ? (
//               <div className="h-[200px] flex items-center justify-center text-gray-500">
//                 No draft documents found
//               </div>
//             ) : (
//               filtered.map((request) => (
//                 <div
//                   key={request._id}
//                   className="grid grid-cols-7 py-3 px-4 border-b border-gray-100 items-center"
//                 >
//                   <div className="text-sm font-bold">{request.title}</div>

//                   <div>
//                     <button
//                       onClick={() => handleDownload(request.file)}
//                       className="text-blue-600 underline flex items-center text-sm"
//                     >
//                       Download
//                     </button>
//                   </div>

//                   <div>{request?.owner?.name}</div>

//                   <div>
//                     <button
//                       onClick={() => {
//                         if (request.signers && request.signers.length > 0) {
//                           handleViewSigners(request.signers);
//                         }
//                       }}
//                       className="text-blue-600 underline flex items-center text-sm"
//                     >
//                       View ({(request.signers || []).length})
//                     </button>
//                   </div>

//                   <div className="flex items-center gap-3 col-span-3">
//                     <button
//                       onClick={() => handleEdit(request._id)}
//                       className="bg-[#002864] p-2 rounded-[20px] hover:opacity-90 transition-opacity"
//                       title="Edit"
//                     >
//                       <svg
//                         className="w-5 h-5 text-white"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth="2"
//                           d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
//                         />
//                       </svg>
//                     </button>

//                     <button
//                       onClick={() => handleDelete(request._id)}
//                       className="bg-[#29354a] p-2 rounded-[20px] hover:opacity-90 transition-opacity"
//                       title="Delete"
//                     >
//                       <svg
//                         className="w-5 h-5 text-white"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth="2"
//                           d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                         />
//                       </svg>
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}

//             {showSignersPopup && (
//               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                 <div className="bg-white p-6 rounded-lg w-96">
//                   <h3 className="text-xl font-bold mb-4">Signers</h3>
//                   <ul className="space-y-2">
//                     {currentSigners?.map((signer, index) => (
//                       <li key={index} className="border-b pb-2 last:border-b-0">
//                         {signer?.email}
//                       </li>
//                     ))}
//                   </ul>
//                   <div className="mt-4 flex justify-end">
//                     <button
//                       onClick={() => setShowSignersPopup(false)}
//                       className="bg-gray-200 px-4 py-2 rounded"
//                     >
//                       Close
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </>
//   );
// }

// src/draftdocs.js
import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "../baseUrl";
import StatusBadge from "./StatusBadge"; // adjust path if needed

export default function DraftDocs() {
  const navigate = useNavigate();
  // filters from DocumentsLayout (search bar)
  const { searchText, dateRange, senderFilter } = useOutletContext();

  const [loading, setLoading] = useState(true);
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
      alert("Failed to download the file.");
    }
  };

  const handleViewSigners = (signers) => {
    setCurrentSigners(signers || []);
    setShowSignersPopup(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      try {
        const res = await axios.delete(`${BASE_URL}/deleteTemplate/${id}`);
        toast.success(res.data.message, { containerId: "manageTemplate" });
        setRequests((prev) => prev.filter((u) => u._id !== id));
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
      const token = localStorage.getItem("token");
      const headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${BASE_URL}/getAllTemplates`, headers);

      const data = (response.data.docs || []).map((doc) => ({
        ...doc,
        ownerName: doc?.owner?.name || "",
        ownerEmail: doc?.owner?.user?.email || "",
        status: doc.status || "pending", // treat drafts as pending
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      setRequests(data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
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

  // ---------------- FILTER LOGIC (search, date, sender) ----------------

  const normalize = (str) => (str || "").toString().toLowerCase().trim();

  const matchesText = (tpl) => {
    if (!searchText) return true;
    const q = normalize(searchText);

    const fields = [
      tpl.title,
      tpl.ownerName,
      tpl.ownerEmail,
      ...(tpl.signers || []).map((s) => s.email),
    ]
      .filter(Boolean)
      .map(normalize);

    return fields.some((f) => f.includes(q));
  };

  const withinDateRange = (tpl) => {
    if (!dateRange || dateRange === "all") return true;
    if (!tpl.createdAt) return true;

    const created = new Date(tpl.createdAt);
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "7d":
        return now - created <= 7 * msInDay;
      case "30d":
        return now - created <= 30 * msInDay;
      case "6m":
        return now - created <= 183 * msInDay; // ~6 months
      case "1y":
        return now - created <= 365 * msInDay;
      default:
        return true;
    }
  };

  const matchesSender = (tpl) => {
    if (senderFilter === "all") return true;
    const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const ownerEmail = (tpl.ownerEmail || "").toLowerCase();
    const isMe = ownerEmail && ownerEmail === currentUserEmail;

    if (senderFilter === "me") return isMe;
    if (senderFilter === "others") return !isMe;
    return true;
  };

  const filtered = requests.filter(
    (tpl) => matchesText(tpl) && withinDateRange(tpl) && matchesSender(tpl)
  );

  // ---------------- RENDER ----------------

  return (
    <>
      <ToastContainer containerId={"manageTemplate"} />

      <div className="py-[8px] px-[16px] bg-white rounded-[10px] cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Draft Documents
        </h2>

        {loading ? (
          <div className="h-[250px] flex justify-center items-center">
            <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
          </div>
        ) : (
          <>
            {/* HEADER: 7 columns */}
            <div className="grid grid-cols-7 border-t border-b min-w-[900px] border-gray-200 py-3 px-4 font-bold text-[14px]">
              <div>Title</div>
              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div>Status</div>
              <div>Last Change</div>
              <div>Actions</div>
            </div>

            {/* ROWS */}
            {filtered.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No draft documents found
              </div>
            ) : (
              filtered.map((request) => (
                <div
                  key={request._id}
                  className="grid grid-cols-7 min-w-[900px] py-3 px-4 border-b border-gray-100 items-center"
                >
                  {/* Title */}
                  <div className="text-sm font-bold">{request.title}</div>

                  {/* File */}
                  <div>
                    <button
                      onClick={() => handleDownload(request.file)}
                      className="text-blue-600 underline flex items-center text-sm"
                    >
                      Download
                    </button>
                  </div>

                  {/* Owner */}
                  <div>{request?.owner?.name || request.ownerName}</div>

                  {/* Signers */}
                  <div>
                    <button
                      onClick={() => {
                        if (request.signers && request.signers.length > 0) {
                          handleViewSigners(request.signers);
                        }
                      }}
                      className="text-blue-600 underline flex items-center text-sm"
                    >
                      View ({(request.signers || []).length})
                    </button>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={request.status || "pending"} />
                  </div>

                  {/* Last Change */}
                  <div className="text-sm text-gray-600">
                    {request.updatedAt
                      ? new Date(request.updatedAt).toLocaleString()
                      : request.createdAt
                      ? new Date(request.createdAt).toLocaleString()
                      : "-"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(request._id)}
                      className="bg-[#002864] p-2 rounded-[20px] hover:opacity-90 transition-opacity"
                      title="Edit"
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
                      onClick={() => handleDelete(request._id)}
                      className="bg-[#29354a] p-2 rounded-[20px] hover:opacity-90 transition-opacity"
                      title="Delete"
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
              ))
            )}

            {/* Results label */}
            <p className="text-sm text-gray-600 mt-4">
              Showing {filtered.length} of {requests.length} results
            </p>
          </>
        )}

        {/* Signers popup */}
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
      </div>
    </>
  );
}
