// // src/component/needsign.jsx 
// import axios from "axios";
// import React, { useState, useEffect } from "react";
// import { Link, useOutletContext } from "react-router-dom";
// import { BASE_URL } from "../baseUrl";
// import { toast, ToastContainer } from "react-toastify";
// import StatusBadge from "./StatusBadge";


// export default function Needsign() {
//   // get filters from DocumentsLayout
//   const { searchText, dateRange, senderFilter } = useOutletContext();

//   const [requests, setRequests] = useState([]);
//   const [showSignersPopup, setShowSignersPopup] = useState(false);
//   const [currentSigners, setCurrentSigners] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

//   const fetchNeedSignRequests = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`${BASE_URL}/getNeedSignDocs`, {
//         headers: { authorization: `Bearer ${token}` },
//       });

//       setLoading(false);

//       const transformedData = response.data.documents.map((doc) => ({
//         id: doc._id,
//         title: doc.title,
//         note: doc.note || "",
//         folder: doc.folder || "General",
//         fileName: doc.file.split("/").pop(),
//         filePath: doc.file,
//         owner: doc?.owner?.name,
//         ownerEmail: doc?.owner?.user?.email || "",
//         signers: doc.signers,
//         createdAt: doc.createdAt,
//         updatedAt: doc.updatedAt,
//         expiryDate: new Date(doc.createdAt).toLocaleDateString(),
//         status: doc.status,
//       }));

//       setRequests(transformedData);
//     } catch (error) {
//       if (error?.response?.data?.error) {
//         toast.error(error?.response?.data?.error, { containerId: "Needsign" });
//       } else {
//         toast.error("Something went wrong please try again", {
//           containerId: "Needsign",
//         });
//       }
//       console.error("Error fetching need sign requests:", error);
//     }
//   };

//   useEffect(() => {
//     fetchNeedSignRequests();
//   }, []);

//   // -------- FILTERS (searchText, dateRange, senderFilter) --------

//   const normalize = (str) => (str || "").toString().toLowerCase().trim();

//   const matchesText = (req) => {
//     if (!searchText) return true;
//     const q = normalize(searchText);

//     const fields = [
//       req.title,
//       req.folder,
//       req.owner,
//       req.ownerEmail,
//       ...(req.signers || []).map((s) => s.email),
//     ]
//       .filter(Boolean)
//       .map(normalize);

//     return fields.some((f) => f.includes(q));
//   };

//   const withinDateRange = (req) => {
//     if (!dateRange || dateRange === "all") return true;
//     if (!req.createdAt) return true;

//     const created = new Date(req.createdAt);
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

//   const matchesSender = (req) => {
//     if (senderFilter === "all") return true;
//     const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
//     const ownerEmail = (req.ownerEmail || "").toLowerCase();
//     const isMe = ownerEmail && ownerEmail === currentUserEmail;

//     if (senderFilter === "me") return isMe;
//     if (senderFilter === "others") return !isMe;
//     return true;
//   };

//   const filteredRequests = requests.filter(
//     (r) => matchesText(r) && withinDateRange(r) && matchesSender(r)
//   );

//   const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
//   const paginatedRequests = filteredRequests.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   // -------- existing handlers for download/signers/delete --------

//   const handleDownload = async (filePath, fileName) => {
//     try {
//       const response = await fetch(filePath);
//       const blob = await response.blob();
//       const blobUrl = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = blobUrl;
//       link.download = fileName || filePath.split("/").pop();
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(blobUrl);
//     } catch (e) {
//       toast.error("Unable to download at the moment", {
//         containerId: "Needsign",
//       });
//     }
//   };

//   const handleViewSigners = (signers) => {
//     let onlyEmails = signers.map((val) => {
//       let prev = { ...val };
//       delete prev.name;
//       delete prev.mobile;
//       delete prev.signed;
//       delete prev.declined;
//       delete prev._id;
//       return prev;
//     });

//     setCurrentSigners(onlyEmails);
//     setShowSignersPopup(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to delete this document?")) {
//       try {
//         const token = localStorage.getItem("token");
//         await axios.delete(`${BASE_URL}/deleteDocument/${id}`, {
//           headers: { authorization: `Bearer ${token}` },
//         });

//         toast.success("Document deleted sucessfully", {
//           containerId: "Needsign",
//         });
//         fetchNeedSignRequests();
//       } catch (err) {
//         if (err?.response?.data?.error) {
//           toast.error(err?.response?.data?.error, {
//             containerId: "Needsign",
//           });
//         } else {
//           toast.error("Something went wrong please try again", {
//             containerId: "Needsign",
//           });
//         }
//       }
//     }
//   };

//   return (
//     <>
//       <ToastContainer containerId={"Needsign"} />
//       <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto cursor-pointer min-h-[430px]">
//         <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
//           Need Your Signature
//         </h2>

//         {loading ? (
//           <div className="h-[250px] flex justify-center items-center">
//             <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
//           </div>
//         ) : (
//           <>
//             {/* HEADER */}
//           <div className="grid grid-cols-8 border-t border-b min-w-[900px] border-gray-200 py-3 px-4 font-bold text-[14px]">
//             <div>Title</div>
//             <div>Folder</div>
//             <div>File</div>
//             <div>Owner</div>
//             <div>Signers</div>
//             <div>Status</div>
//             <div>Last Change</div>
//             <div>Action</div>
//           </div>

//           {/* ROWS */}
//           {paginatedRequests.length === 0 ? (
//             <div className="h-[200px] flex items-center justify-center text-gray-500">
//               No documents require signature
//             </div>
//           ) : (
//             paginatedRequests.map((request) => (
//               <div
//                 key={request.id}
//                 className="grid grid-cols-8 min-w-[900px] py-3 px-4 border-b border-gray-100 items-center"
//               >
//                 {/* Title */}
//                 <div className="text-sm font-bold">{request.title}</div>

//                 {/* Folder */}
//                 <div className="text-sm text-gray-500">{request.folder}</div>

//                 {/* File */}
//                 <div>
//                   <button
//                     onClick={() => handleDownload(request.filePath, request.fileName)}
//                     className="text-blue-600 underline flex items-center text-sm"
//                   >
//                     Download
//                   </button>
//                 </div>

//                 {/* Owner */}
//                 <div>{request.owner}</div>

//                 {/* Signers */}
//                 <div>
//                   <button
//                     onClick={() => handleViewSigners(request.signers)}
//                     className="text-blue-600 underline flex items-center text-sm"
//                   >
//                     View ({request.signers.length})
//                   </button>
//                 </div>

//                 {/* Status badge — for Need Your Signature, usually “Sent” or “Pending” */}
//                 <div>
//                   <StatusBadge status={request.status || "sent"} />
//                 </div>

//                 {/* Last Change */}
//                 <div className="text-sm text-gray-600">
//                   {request.updatedAt
//                     ? new Date(request.updatedAt).toLocaleString()
//                     : request.createdAt
//                     ? new Date(request.createdAt).toLocaleString()
//                     : "-"}
//                 </div>

//                 {/* Action buttons */}
//                 <div className="flex items-center gap-2">
//                   <Link
//                     to={`/admin/view-pdf/sign-document/${request.id}`}
//                     className="bg-[#29354a] text-white p-2 rounded flex items-center justify-center"
//                     title="View"
//                   >
//                     <i className="fas fa-eye text-white text-sm"></i>
//                   </Link>

//                   <button
//                     onClick={() => handleDelete(request.id)}
//                     className="bg-black text-white p-2 rounded flex items-center justify-center"
//                     title="Delete"
//                   >
//                     <i className="fas fa-trash text-white text-sm"></i>
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}

            

//             {showSignersPopup && (
//               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                 <div className="bg-white p-6 rounded-lg w-96">
//                   <h3 className="text-xl font-bold mb-4">Signers</h3>
//                   <ul className="space-y-2">
//                     {currentSigners.map((signer, index) => (
//                       <li
//                         key={index}
//                         className="border-b pb-2 last:border-b-0"
//                       >
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

//             {totalPages > 1 && (
//               <div className="flex justify-center mt-4">
//                 {Array.from({ length: totalPages }, (_, i) => (
//                   <button
//                     key={i + 1}
//                     onClick={() => setCurrentPage(i + 1)}
//                     className={`mx-1 px-3 py-1 rounded ${
//                       currentPage === i + 1
//                         ? "bg-[#002864] text-white"
//                         : "bg-gray-200"
//                     }`}
//                   >
//                     {i + 1}
//                   </button>
//                 ))}
//               </div>
//             )}

//             <p className="text-sm text-gray-600 mt-4">
//               Showing {paginatedRequests.length} of {requests.length} results
//             </p>

//           </>
//         )}
//       </div>
//     </>
//   );
// }

// src/component/needsign.jsx
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { toast, ToastContainer } from "react-toastify";
import StatusBadge from "./StatusBadge";

export default function Needsign() {
  const navigate = useNavigate();

  // get filters from DocumentsLayout
  const { searchText, dateRange, senderFilter } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [currentEmail, setCurrentEmail] = useState(""); // ✅ NEW (from API)
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Delegate modal state
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegateDoc, setDelegateDoc] = useState(null);
  const [delegateEmail, setDelegateEmail] = useState("");
  const [delegateName, setDelegateName] = useState("");
  const [delegating, setDelegating] = useState(false);

  const fetchNeedSignRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${BASE_URL}/getNeedSignDocs`, {
        headers: { authorization: `Bearer ${token}` },
      });

      // ✅ capture signer email from backend
      setCurrentEmail(response.data.currentEmail || "");

      const transformedData = (response.data.documents || []).map((doc) => ({
        id: doc._id,
        title: doc.title,
        note: doc.note || "",
        folder: doc.folder || "General",
        fileName: doc.file.split("/").pop(),
        filePath: doc.file,
        owner: doc?.owner?.name,
        ownerEmail: doc?.owner?.user?.email || "",
        signers: doc.signers || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        expiryDate: new Date(doc.createdAt).toLocaleDateString(),
        status: doc.status,
      }));

      setRequests(transformedData);
    } catch (error) {
      if (error?.response?.data?.error) {
        toast.error(error?.response?.data?.error, { containerId: "Needsign" });
      } else {
        toast.error("Something went wrong please try again", { containerId: "Needsign" });
      }
      console.error("Error fetching need sign requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeedSignRequests();
  }, []);

  // -------- FILTERS --------
  const normalize = (str) => (str || "").toString().toLowerCase().trim();

  const matchesText = (req) => {
    if (!searchText) return true;
    const q = normalize(searchText);

    const fields = [
      req.title,
      req.folder,
      req.owner,
      req.ownerEmail,
      ...(req.signers || []).map((s) => s.email),
    ]
      .filter(Boolean)
      .map(normalize);

    return fields.some((f) => f.includes(q));
  };

  const withinDateRange = (req) => {
    if (!dateRange || dateRange === "all") return true;
    if (!req.createdAt) return true;

    const created = new Date(req.createdAt);
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case "7d":
        return now - created <= 7 * msInDay;
      case "30d":
        return now - created <= 30 * msInDay;
      case "6m":
        return now - created <= 183 * msInDay;
      case "1y":
        return now - created <= 365 * msInDay;
      default:
        return true;
    }
  };

  const matchesSender = (req) => {
    if (senderFilter === "all") return true;
    const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const ownerEmail = (req.ownerEmail || "").toLowerCase();
    const isMe = ownerEmail && ownerEmail === currentUserEmail;

    if (senderFilter === "me") return isMe;
    if (senderFilter === "others") return !isMe;
    return true;
  };

  const filteredRequests = requests.filter(
    (r) => matchesText(r) && withinDateRange(r) && matchesSender(r)
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // -------- existing handlers --------
  const handleDownload = async (filePath, fileName) => {
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || filePath.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      toast.error("Unable to download at the moment", { containerId: "Needsign" });
    }
  };

  const handleViewSigners = (signers) => {
    const onlyEmails = (signers || []).map((val) => {
      let prev = { ...val };
      delete prev.name;
      delete prev.mobile;
      delete prev.signed;
      delete prev.declined;
      delete prev._id;
      return prev;
    });

    setCurrentSigners(onlyEmails);
    setShowSignersPopup(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/deleteDocument/${id}`, {
        headers: { authorization: `Bearer ${token}` },
      });

      toast.success("Document deleted sucessfully", { containerId: "Needsign" });
      fetchNeedSignRequests();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong please try again", {
        containerId: "Needsign",
      });
    }
  };

  // ---------------- Actions dropdown (per row) ----------------
  const ActionMenu = ({ request }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const onDocClick = (e) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const openDelegate = () => {
      setDelegateDoc(request);
      setDelegateEmail("");
      setDelegateName("");
      setDelegateOpen(true);
      setOpen(false);
    };

    const goSign = () => {
      setOpen(false);
      // ✅ Sign route (same style as dashboard table)
      navigate(`/admin/request-signatures/sign-document/${request.id}?email=${currentEmail}`);
    };

    return (
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="bg-[#29354a] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-2"
        >
          Action <span className="text-xs">▾</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/admin/view-pdf/sign-document/${request.id}`);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              👁️ View PDF
            </button>

            <button
              type="button"
              onClick={goSign}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              ✍️ Sign
            </button>

            <button
              type="button"
              onClick={openDelegate}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              👤 Delegate
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleDelete(request.id);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  // ---------------- Delegate API call ----------------
  const submitDelegate = async () => {
    try {
      if (!delegateDoc?.id) {
        toast.error("No document selected", { containerId: "Needsign" });
        return;
      }
      if (!delegateEmail.trim()) {
        toast.error("Delegate email is required", { containerId: "Needsign" });
        return;
      }

      if (!currentEmail) {
        toast.error("Could not determine current signer email. Refresh and try again.", {
          containerId: "Needsign",
        });
        return;
      }

      setDelegating(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${BASE_URL}/delegateSigner`,
        {
          documentId: delegateDoc.id,
          fromEmail: currentEmail,
          toEmail: delegateEmail.trim(),
          toName: delegateName.trim(),
        },
        { headers: { authorization: `Bearer ${token}` } }
      );

      toast.success("Delegated successfully. The new signer has been invited.", {
        containerId: "Needsign",
      });

      setDelegateOpen(false);
      setDelegateDoc(null);
      setDelegateEmail("");
      setDelegateName("");

      fetchNeedSignRequests(); // refresh list
    } catch (e) {
      toast.error(e?.response?.data?.error || "Unable to delegate", {
        containerId: "Needsign",
      });
    } finally {
      setDelegating(false);
    }
  };

  return (
    <>
      <ToastContainer containerId={"Needsign"} />
      <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Need Your Signature
        </h2>

        {loading ? (
          <div className="h-[250px] flex justify-center items-center">
            <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="grid grid-cols-8 border-t border-b min-w-[900px] border-gray-200 py-3 px-4 font-bold text-[14px]">
              <div>Title</div>
              <div>Folder</div>
              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div>Status</div>
              <div>Last Change</div>
              <div>Action</div>
            </div>

            {/* ROWS */}
            {paginatedRequests.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No documents require signature
              </div>
            ) : (
              paginatedRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-8 min-w-[900px] py-3 px-4 border-b border-gray-100 items-center"
                >
                  <div className="text-sm font-bold">{request.title}</div>

                  <div className="text-sm text-gray-500">{request.folder}</div>

                  <div>
                    <button
                      onClick={() => handleDownload(request.filePath, request.fileName)}
                      className="text-blue-600 underline flex items-center text-sm"
                    >
                      Download
                    </button>
                  </div>

                  <div>{request.owner}</div>

                  <div>
                    <button
                      onClick={() => handleViewSigners(request.signers)}
                      className="text-blue-600 underline flex items-center text-sm"
                    >
                      View ({request.signers.length})
                    </button>
                  </div>

                  <div>
                    <StatusBadge status={request.status || "sent"} />
                  </div>

                  <div className="text-sm text-gray-600">
                    {request.updatedAt
                      ? new Date(request.updatedAt).toLocaleString()
                      : request.createdAt
                      ? new Date(request.createdAt).toLocaleString()
                      : "-"}
                  </div>

                  {/* ✅ Action dropdown */}
                  <div className="flex items-center">
                    <ActionMenu request={request} />
                  </div>
                </div>
              ))
            )}

            {/* Signers popup */}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === i + 1 ? "bg-[#002864] text-white" : "bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-600 mt-4">
              Showing {paginatedRequests.length} of {filteredRequests.length} results
            </p>
          </>
        )}
      </div>

      {/* Delegate modal */}
      {delegateOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-xl w-[520px] max-w-[95vw] p-6">
            <h3 className="text-xl font-bold mb-2">Delegate signing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Delegate <b>{delegateDoc?.title}</b> to another signer.
            </p>

            <label className="text-sm font-semibold">Delegate email *</label>
            <input
              className="w-full border rounded-lg p-3 mt-1 mb-4"
              placeholder="assistant@company.com"
              value={delegateEmail}
              onChange={(e) => setDelegateEmail(e.target.value)}
            />

            <label className="text-sm font-semibold">Delegate name (optional)</label>
            <input
              className="w-full border rounded-lg p-3 mt-1 mb-6"
              placeholder="Assistant Name"
              value={delegateName}
              onChange={(e) => setDelegateName(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDelegateOpen(false);
                  setDelegateDoc(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200"
                disabled={delegating}
              >
                Cancel
              </button>
              <button
                onClick={submitDelegate}
                className={`px-4 py-2 rounded-lg text-white ${
                  delegating ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
                }`}
                disabled={delegating || !delegateEmail.trim()}
              >
                {delegating ? "Delegating..." : "Delegate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
