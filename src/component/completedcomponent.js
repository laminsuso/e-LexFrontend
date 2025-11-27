// import axios from "axios";
// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import { BASE_URL } from "../baseUrl";
// import { useEffect } from "react";
// import { toast, ToastContainer } from "react-toastify";

// export default function CompletedComponent() {
//   const [requests, setRequests] = useState([]);
//   const [loading,setLoading]=useState(true)
//   const [showSignersPopup, setShowSignersPopup] = useState(false);
//   const [currentSigners, setCurrentSigners] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

//   const fetchCompletedRequests = async () => {
//     try {
      
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`${BASE_URL}/getCompletedDocs`, {
//         headers: { authorization: `Bearer ${token}` },
//       });
//     setLoading(false)
   
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
//         toast.error(error?.response?.data?.error,{containerId:'completed'})
//       }else{
//         toast.error("Something went wrong please try again",{containerId:"completed"})
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
// toast.error("Unable to download at the moment",{containerId:"completed"})
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

//        toast.success("Document deleted sucessfully",{containerId:"completed"})
//         fetchCompletedRequests();
//       } catch (err) {
//         if(err?.response?.data?.error){
//           toast.error(err?.response?.data?.error,{containerId:"completed"})
//         }else{
//           toast.error("Something went wrong please try again",{containerId:"completed"})
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
//     <ToastContainer containerId={"completed"}/>
//     <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto cursor-pointer min-h-[430px]">
//       <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
//         Completed Documents
//       </h2>

//       {loading?<div class="h-[250px] flex justify-center items-center"> <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div> </div>:<>
//         <div className="grid grid-cols-7 border-t border-b min-w-[600px] border-gray-200 py-3 px-4 font-bold text-[14px]">
//         <div>Title</div>
       
//         <div>Folder</div>
//         <div>File</div>
//         <div>Owner</div>
//         <div>Signers</div>
//         <div>Action</div>
//       </div>

//       {paginatedRequests?.length==0?  <div className="h-[200px] flex items-center justify-center text-gray-500">
//     No completed documents found
//   </div>:paginatedRequests?.map((request) => (
//         <div
//           key={request.id}
//           className="grid grid-cols-7 min-w-[600px] py-3 px-4 border-b border-gray-100 items-center"
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

import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { toast, ToastContainer } from "react-toastify";
import { downloadCertificateOrZip } from "../utils/downloadCertificate";

const handleDownloadFromModal = async (docId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("Not authenticated");
    await downloadCertificateOrZip(docId, token);
    toast.success("Download started", { containerId: "completed" });
  } catch (err) {
    toast.error(err.message || "Download failed. Try again later.", { containerId: "completed" });
  }
};

export default function CompletedComponent() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Download modal state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadDocId, setDownloadDocId] = useState(null);
  const [downloadDocFilePath, setDownloadDocFilePath] = useState(null);
  const [downloadDocFileName, setDownloadDocFileName] = useState(null);
  const [includeDocument, setIncludeDocument] = useState(true);
  const [includeCertificate, setIncludeCertificate] = useState(true);
  const [combineFiles, setCombineFiles] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchCompletedRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/getCompletedDocs`, {
        headers: { authorization: `Bearer ${token}` },
      });
      setLoading(false);

      const transformedData = response.data.documents.map((doc) => ({
        id: doc._id,
        title: doc.title,
        note: doc.note || "",
        folder: doc.folder || "General",
        fileName: doc.file ? doc.file.split("/").pop() : "document.pdf",
        filePath: doc.file,
        owner: doc?.owner?.name || (doc.owner && doc.owner.user && doc.owner.user.email) || "Unknown",
        signers: doc.signers || [],
        expiryDate: new Date(doc.createdAt).toLocaleDateString(),
        status: doc.status,
      }));

      setRequests(transformedData);
    } catch (error) {
      setLoading(false);
      if (error?.response?.data?.error) {
        toast.error(error?.response?.data?.error, { containerId: "completed" });
      } else {
        toast.error("Something went wrong please try again", { containerId: "completed" });
      }
      console.error("Error fetching completed requests:", error);
    }
  };

  useEffect(() => {
    fetchCompletedRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Old direct-download, still used for "Document only"
  const downloadBlob = (blob, fileName) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleDirectFileDownload = async (filePath, fileName) => {
    // If filePath is a URL (cloudinary), just download it via axios to honor CORS and cookies
    try {
      setDownloading(true);
      const resp = await axios.get(filePath, { responseType: "blob" });
      downloadBlob(resp.data, fileName || (filePath.split("/").pop() || "document.pdf"));
      setDownloading(false);
    } catch (err) {
      setDownloading(false);
      toast.error("Unable to download document right now", { containerId: "completed" });
      console.error("Direct file download error:", err);
    }
  };

  const openDownloadModal = (doc) => {
    setDownloadDocId(doc.id);
    setDownloadDocFilePath(doc.filePath);
    setDownloadDocFileName(doc.fileName);
    // default options
    setIncludeDocument(true);
    setIncludeCertificate(true);
    setCombineFiles(false);
    setDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    setDownloadModalOpen(false);
    setDownloadDocId(null);
    setDownloadDocFilePath(null);
    setDownloadDocFileName(null);
    setIncludeDocument(true);
    setIncludeCertificate(true);
    setCombineFiles(false);
  };

  /**
   * handleDownloadFromModal
   * - Document only => downloads doc.file directly
   * - Certificate only => calls /download/:docId?only=certificate (expects PDF blob)
   * - Both + combine => /download/:docId?combine=true (PDF)
   * - Both (not combine) => /download/:docId  (ZIP)
   *
   * NOTE: backend must support ?only=certificate to return certificate PDF.
   * The backend we provided earlier supports combine=true and returns a zip for the "both" case.
   */
  const handleDownloadFromModal = async () => {
    if (!includeDocument && !includeCertificate) {
      toast.error("Select at least one item to download", { containerId: "completed" });
      return;
    }
    if (!downloadDocId) {
      toast.error("No document selected", { containerId: "completed" });
      return;
    }

    try {
      setDownloading(true);
      const token = localStorage.getItem("token");

      // Case 1: Document only -> fetch original file directly (cloud URL or path)
      if (includeDocument && !includeCertificate) {
        await handleDirectFileDownload(downloadDocFilePath, downloadDocFileName);
        setDownloading(false);
        closeDownloadModal();
        return;
      }

      // Case 2: Certificate only -> special backend route (expects PDF)
      if (!includeDocument && includeCertificate) {
        try {
          const url = `${BASE_URL}/download/${downloadDocId}?only=certificate`;
          const resp = await axios.get(url, {
            responseType: "blob",
            headers: { authorization: `Bearer ${token}` },
          });
          // name it clearly
          const name = `${(downloadDocFileName || "document").replace(/\.[^/.]+$/, "")}-certificate.pdf`;
          downloadBlob(resp.data, name);
        } catch (err) {
          console.error("certificate-only download error:", err);
          // fallback: try to download both as zip (backend supports that)
          try {
            const url2 = `${BASE_URL}/download/${downloadDocId}`;
            const resp2 = await axios.get(url2, {
              responseType: "blob",
              headers: { authorization: `Bearer ${token}` },
            });
            downloadBlob(resp2.data, `${(downloadDocFileName || "document")}.zip`);
            toast.info("Certificate-only endpoint not available; downloaded both as ZIP", { containerId: "completed" });
          } catch (err2) {
            toast.error("Unable to download certificate at the moment", { containerId: "completed" });
            console.error("fallback zip download failed:", err2);
          }
        } finally {
          setDownloading(false);
          closeDownloadModal();
        }
        return;
      }

      // Case 3: Both files
      // combine -> single merged PDF
      if (includeDocument && includeCertificate && combineFiles) {
        const url = `${BASE_URL}/download/${downloadDocId}?combine=true`;
        const resp = await axios.get(url, {
          responseType: "blob",
          headers: { authorization: `Bearer ${token}` },
        });
        const name = `${(downloadDocFileName || "document").replace(/\.[^/.]+$/, "")}-combined.pdf`;
        downloadBlob(resp.data, name);
        setDownloading(false);
        closeDownloadModal();
        return;
      }

      // Case 4: Both files but not combined -> zip
      if (includeDocument && includeCertificate && !combineFiles) {
        const url = `${BASE_URL}/download/${downloadDocId}`; // returns zip by default
        const resp = await axios.get(url, {
          responseType: "blob",
          headers: { authorization: `Bearer ${token}` },
        });
        const name = `${(downloadDocFileName || "document")}.zip`;
        downloadBlob(resp.data, name);
        setDownloading(false);
        closeDownloadModal();
        return;
      }
    } catch (err) {
      setDownloading(false);
      toast.error("Download failed. Try again later.", { containerId: "completed" });
      console.error("handleDownloadFromModal error:", err);
    }
  };

  const handleViewSigners = (signers) => {
    const onlyEmails = signers.map((val) => {
      const { email } = val || {};
      return { email };
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

        toast.success("Document deleted sucessfully", { containerId: "completed" });
        fetchCompletedRequests();
      } catch (err) {
        if (err?.response?.data?.error) {
          toast.error(err?.response?.data?.error, { containerId: "completed" });
        } else {
          toast.error("Something went wrong please try again", { containerId: "completed" });
        }
      }
    }
  };

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const paginatedRequests = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <ToastContainer containerId={"completed"} />
      <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">Completed Documents</h2>

        {loading ? (
          <div className="h-[250px] flex justify-center items-center">
            <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-t border-b min-w-[600px] border-gray-200 py-3 px-4 font-bold text-[14px]">
              <div>Title</div>
              <div>Folder</div>
              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div>Action</div>
            </div>

            {paginatedRequests?.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">No completed documents found</div>
            ) : (
              paginatedRequests.map((request) => (
                <div key={request.id} className="grid grid-cols-7 min-w-[600px] py-3 px-4 border-b border-gray-100 items-center">
                  <div className="text-sm font-bold">{request.title}</div>
                  <div className="text-sm text-gray-500">{request.folder}</div>
                  <div>
                    <button
                      onClick={() => openDownloadModal(request)}
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
                    <Link to={`/admin/view-pdf/sign-document/${request.id}`} className="bg-[#29354a] text-white p-2 rounded flex items-center justify-center" title="View">
                      <i className="fas fa-eye text-white text-sm"></i>
                    </Link>

                    <button onClick={() => handleDelete(request.id)} className="bg-black text-white p-2 rounded flex items-center justify-center" title="Delete">
                      <i className="fas fa-trash text-white text-sm"></i>
                    </button>
                  </div>
                </div>
              ))
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? "bg-[#002864] text-white" : "bg-gray-200"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
              <button onClick={() => setShowSignersPopup(false)} className="bg-gray-200 px-4 py-2 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[540px]">
            <h3 className="text-2xl font-semibold mb-2">Download files</h3>
            <p className="text-sm text-gray-600 mb-4">Select which files you want to download:</p>

            <div className="space-y-3 mb-3">
              <label className="flex items-center space-x-3">
                <input type="checkbox" checked={includeDocument} onChange={(e) => setIncludeDocument(e.target.checked)} />
                <div>
                  <div className="font-medium">Document</div>
                  <div className="text-sm text-gray-500">1 PDF — {downloadDocFileName}</div>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input type="checkbox" checked={includeCertificate} onChange={(e) => setIncludeCertificate(e.target.checked)} />
                <div>
                  <div className="font-medium">Certificate of Completion</div>
                  <div className="text-sm text-gray-500">1 PDF</div>
                </div>
              </label>
            </div>

            <hr className="my-3" />

            <label className="flex items-center space-x-3">
              <input type="checkbox" checked={combineFiles} onChange={(e) => setCombineFiles(e.target.checked)} disabled={!(includeDocument && includeCertificate)} />
              <div className="text-sm">Combine all PDFs into a single file</div>
            </label>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={closeDownloadModal} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              <button
                onClick={handleDownloadFromModal}
                className={`px-4 py-2 rounded ${downloading ? "bg-gray-400" : "bg-[#3f3b8f] text-white"}`}
                disabled={downloading}
              >
                {downloading ? "Downloading..." : "Download"}
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500">Tip: If the certificate-only endpoint isn't enabled on the backend, the UI will fallback to downloading both files as a ZIP.</div>
          </div>
        </div>
      )}
    </>
  );
}
