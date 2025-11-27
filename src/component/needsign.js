// import axios from "axios";
// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import { BASE_URL } from "../baseUrl";
// import { useEffect } from "react";
// import { toast, ToastContainer } from "react-toastify";

// export default function Needsign() {
//   const [requests, setRequests] = useState([]);
//   const [showSignersPopup, setShowSignersPopup] = useState(false);
//   const [currentSigners, setCurrentSigners] = useState([]);
//   const [loading,setLoading]=useState(true)
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

//   const fetchCompletedRequests = async () => {
//     try {
      
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`${BASE_URL}/getNeedSignDocs`, {
//         headers: { authorization: `Bearer ${token}` },
//       });
    
   
//       setLoading(false)
     
   
//       const transformedData = response.data.documents.map((doc) => ({
//         id: doc._id,
//         title: doc.title,
//         note: doc.note || "",
//         folder: doc.folder || "General",
//         fileName: doc.file.split("/").pop(),
//         filePath: doc.file,
//         owner: doc?.owner?.name,
//         signers: doc.signers,
//         expiryDate: new Date(doc.createdAt).toLocaleDateString(),
//         status: doc.status,
//       }));

//       setRequests(transformedData);
//     } catch (error) {
//       if(error?.response?.data?.error){
//         toast.error(error?.response?.data?.error,{containerId:'Needsign'})
//       }else{
//         toast.error("Something went wrong please try again",{containerId:"Needsign"})
//       }
//       console.error("Error fetching completed requests:", error);
//     }
//   };

//   useEffect(() => {
//     fetchCompletedRequests();
//   }, []);

//   const handleDownload = async(filePath, fileName) => {
//   try{
//     const response=await fetch(filePath)
//     const blob=await response.blob();
//     const blobUrl=URL.createObjectURL(blob)
//     const link = document.createElement("a");
//     link.href = blobUrl;
//     link.download = fileName || filePath.split("/").pop(); 
//     document.body.appendChild(link);
 
//     link.click();
 
//     document.body.removeChild(link);
//     URL.revokeObjectURL(blobUrl);
//   }catch(e){
// toast.error("Unable to download at the moment",{containerId:"Needsign"})
//   }
//   };

//   const handleViewSigners = (signers) => {
//     let onlyEmails=signers.map((val,i)=>{
//       let prev={...val}
//       delete prev.name
//       delete prev.mobile
//       delete prev.signed
//       delete prev.declined
//       delete prev._id
//       return prev
//     })
   
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

//        toast.success("Document deleted sucessfully",{containerId:"Needsign"})
//         fetchCompletedRequests();
//       } catch (err) {
//         if(err?.response?.data?.error){
//           toast.error(err?.response?.data?.error,{containerId:"Needsign"})
//         }else{
//           toast.error("Something went wrong please try again",{containerId:"Needsign"})
//         }

//       }
//     }
//   };

//   const totalPages = Math.ceil(requests.length / itemsPerPage);
//   const paginatedRequests = requests.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   return (
//     <>
//     <ToastContainer containerId={"Needsign"}/>
//     <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto cursor-pointer min-h-[430px]">
//       <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
//         Need sign Documents
//       </h2>

//       {loading?<div class="h-[250px] flex justify-center items-center"> <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div> </div>:<>
//         <div className="grid grid-cols-7 border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px] min-w-[600px]">
//         <div>Title</div>
       
//         <div>Folder</div>
//         <div>File</div>
//         <div>Owner</div>
//         <div>Signers</div>
//         <div>Action</div>
//       </div>

//       {paginatedRequests?.length==0?<>
//         <div className="h-[200px] flex items-center justify-center text-gray-500">
//     No documents require signature
//   </div>
//       </>:paginatedRequests?.map((request) => (
//         <div
//           key={request.id}
//           className="grid grid-cols-7 py-3 px-4 border-b min-w-[600px] border-gray-100 items-center"
//         >
//           <div className="text-sm font-bold">{request.title}</div>
          
//           <div className="text-sm text-gray-500">{request.folder}</div>
//           <div>
//             <button
//               onClick={() => handleDownload(request.filePath, request.fileName)}
//               className="text-blue-600 underline flex items-center text-sm"
//             >
//               Download
//             </button>
//           </div>
//           <div>{request.owner}</div>
//           <div>
//             <button
//               onClick={() => handleViewSigners(request.signers)}
//               className="text-blue-600 underline flex items-center text-sm"
//             >
//               View ({request.signers.length})
//             </button>
//           </div>
//           <div className="flex items-center gap-2">
//             <Link
//               to={`/admin/view-pdf/sign-document/${request.id}`}
//               className="bg-[#29354a] text-white p-2 rounded flex items-center justify-center"
//               title="View"
//             >
//               <i className="fas fa-eye text-white text-sm"></i>
//             </Link>

//             <button
//               onClick={() => handleDelete(request.id)}
//               className="bg-black text-white p-2 rounded flex items-center justify-center"
//               title="Delete"
//             >
//               <i className="fas fa-trash text-white text-sm"></i>
//             </button>
//           </div>
//         </div>
//       ))}

//       {showSignersPopup && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg w-96">
//             <h3 className="text-xl font-bold mb-4">Signers</h3>
//             <ul className="space-y-2">
//               {currentSigners.map((signer, index) => (
//                 <li key={index} className="border-b pb-2 last:border-b-0">
//                   {signer?.email}
//                 </li>
//               ))}
//             </ul>
//             <div className="mt-4 flex justify-end">
//               <button
//                 onClick={() => setShowSignersPopup(false)}
//                 className="bg-gray-200 px-4 py-2 rounded"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {totalPages > 1 && (
//         <div className="flex justify-center mt-4">
//           {Array.from({ length: totalPages }, (_, i) => (
//             <button
//               key={i + 1}
//               onClick={() => setCurrentPage(i + 1)}
//               className={`mx-1 px-3 py-1 rounded ${
//                 currentPage === i + 1
//                   ? "bg-[#002864] text-white"
//                   : "bg-gray-200"
//               }`}
//             >
//               {i + 1}
//             </button>
//           ))}
//         </div>
//       )}
//       </>}
//     </div>
//     </>
//   );
// }

// src/needyoursign.jsx (or wherever this lives)
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { toast, ToastContainer } from "react-toastify";

export default function Needsign() {
  // get filters from DocumentsLayout
  const { searchText, dateRange, senderFilter } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchNeedSignRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/getNeedSignDocs`, {
        headers: { authorization: `Bearer ${token}` },
      });

      setLoading(false);

      const transformedData = response.data.documents.map((doc) => ({
        id: doc._id,
        title: doc.title,
        note: doc.note || "",
        folder: doc.folder || "General",
        fileName: doc.file.split("/").pop(),
        filePath: doc.file,
        owner: doc?.owner?.name,
        ownerEmail: doc?.owner?.user?.email || "",
        signers: doc.signers,
        createdAt: doc.createdAt,
        expiryDate: new Date(doc.createdAt).toLocaleDateString(),
        status: doc.status,
      }));

      setRequests(transformedData);
    } catch (error) {
      if (error?.response?.data?.error) {
        toast.error(error?.response?.data?.error, { containerId: "Needsign" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "Needsign",
        });
      }
      console.error("Error fetching need sign requests:", error);
    }
  };

  useEffect(() => {
    fetchNeedSignRequests();
  }, []);

  // -------- FILTERS (searchText, dateRange, senderFilter) --------

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
        return now - created <= 183 * msInDay; // ~6 months
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

  // -------- existing handlers for download/signers/delete --------

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
      toast.error("Unable to download at the moment", {
        containerId: "Needsign",
      });
    }
  };

  const handleViewSigners = (signers) => {
    let onlyEmails = signers.map((val) => {
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
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${BASE_URL}/deleteDocument/${id}`, {
          headers: { authorization: `Bearer ${token}` },
        });

        toast.success("Document deleted sucessfully", {
          containerId: "Needsign",
        });
        fetchNeedSignRequests();
      } catch (err) {
        if (err?.response?.data?.error) {
          toast.error(err?.response?.data?.error, {
            containerId: "Needsign",
          });
        } else {
          toast.error("Something went wrong please try again", {
            containerId: "Needsign",
          });
        }
      }
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
            <div className="grid grid-cols-7 border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px] min-w-[600px]">
              <div>Title</div>
              <div>Folder</div>
              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div>Action</div>
            </div>

            {paginatedRequests.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No documents require signature
              </div>
            ) : (
              paginatedRequests.map((request) => (
                <div
                  key={request.id}
                  className="grid grid-cols-7 py-3 px-4 border-b min-w-[600px] border-gray-100 items-center"
                >
                  <div className="text-sm font-bold">{request.title}</div>
                  <div className="text-sm text-gray-500">{request.folder}</div>
                  <div>
                    <button
                      onClick={() =>
                        handleDownload(request.filePath, request.fileName)
                      }
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
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/view-pdf/sign-document/${request.id}`}
                      className="bg-[#29354a] text-white p-2 rounded flex items-center justify-center"
                      title="View"
                    >
                      <i className="fas fa-eye text-white text-sm"></i>
                    </Link>

                    <button
                      onClick={() => handleDelete(request.id)}
                      className="bg-black text-white p-2 rounded flex items-center justify-center"
                      title="Delete"
                    >
                      <i className="fas fa-trash text-white text-sm"></i>
                    </button>
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
                      <li
                        key={index}
                        className="border-b pb-2 last:border-b-0"
                      >
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
          </>
        )}
      </div>
    </>
  );
}
