// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { BASE_URL } from "../baseUrl";
// import { toast, ToastContainer } from "react-toastify";

// export default function SignatureRequests({ currentEmail,requests, setRequests, loading }) {
//   console.log("REQUESt")
//   console.log(requests)
//   const [showSignersPopup, setShowSignersPopup] = useState(false);
//   const [currentSigners, setCurrentSigners] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

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
//       toast.error("Unable to download file at the moment", {
//         containerId: "signatureRequests",
//       });
//     }
//   };

//   const handleViewSigners = (signers) => {
//     setCurrentSigners(signers);
//     setShowSignersPopup(true);
//   };

//   const totalPages = Math.ceil(requests?.length / itemsPerPage);
//   const paginatedRequests = requests?.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   return (
//     <div>
//       <ToastContainer containerId={"signatureRequests"} />
//       <div className="py-[8px] px-[16px] bg-white overflow-x-auto rounded-[10px] cursor-pointer min-h-[430px]">
//         <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
//           Recent signature requests
//         </h2>

//         {loading.needsignLoading === true ? (
//           <div class="h-[250px] flex justify-center items-center">
//             <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-5 border-t border-b min-w-[600px] border-gray-200 py-3 px-4 font-bold text-[14px]">
//               <div>Title</div>
//               <div>File</div>
//               <div>Owner</div>
//               <div>Signers</div>
//               <div>Action</div>
//             </div>

//             {paginatedRequests?.length === 0 ? (
//               <>
//                 <div className="h-[200px] flex items-center justify-center text-gray-500">
//                   No signature requests found
//                 </div>
//               </>
//             ) : (
//               paginatedRequests?.map((request) => (
//                 <div
//                   key={request?.id}
//                   className="grid grid-cols-5 min-w-[600px] py-3 px-4 border-b border-gray-100 items-center"
//                 >
//                   <div>
//                     <div className="font-bold text-sm">{request?.title}</div>
                
//                   </div>

//                   <div>
//                     <button
//                       onClick={() =>
//                         handleDownload(request.filePath, request.fileName)
//                       }
//                       className="text-blue-600 underline flex items-center text-sm"
//                     >
//                       Download
//                     </button>
//                   </div>

//                   <div>{request?.owner?.name}</div>

//                   <div>
//                     <button
//                       onClick={() => {
//                         if (request.signers.length > 0) {
//                           handleViewSigners(request.signers);
//                         }
//                       }}
//                       className="text-blue-600 underline flex items-center text-sm"
//                     >
//                       View ({request.signers?.length || 0})
//                     </button>
//                   </div>

//                   <div>
//                     <Link
//                       to={`/admin/request-signatures/sign-document/${request.id}?email=${currentEmail}`}
//                       className="bg-[#002864] w-fit text-white py-1 px-4 rounded-[20px] gap-[10px] text-[14px] flex items-center justify-center"
//                     >
//                       <i className="fal fa-signature white-light-icon text-white text-[14px]"></i>
//                       Sign
//                     </Link>
//                   </div>
//                 </div>
//               ))
//             )}

//             {showSignersPopup && (
//               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//                 <div className="bg-white p-6 rounded-lg w-96">
//                   <h3 className="text-xl font-bold mb-4">Signers</h3>
//                   <ul className="space-y-2">
//                     {currentSigners.map((signer, index) => (
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
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

//src/component/signaturerequests.js
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { toast, ToastContainer } from "react-toastify";

export default function SignatureRequests({
  currentEmail,
  requests,
  setRequests,
  loading,
  refreshNeedSign, // optional: pass from dashboard to refresh after delegate
}) {
  const navigate = useNavigate();

  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Delegate modal state
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegateDoc, setDelegateDoc] = useState(null);
  const [delegateEmail, setDelegateEmail] = useState("");
  const [delegateName, setDelegateName] = useState("");
  const [delegating, setDelegating] = useState(false);

  const totalPages = Math.ceil((requests?.length || 0) / itemsPerPage);
  const paginatedRequests = requests?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      toast.error("Unable to download file at the moment", {
        containerId: "signatureRequests",
      });
    }
  };

  const handleViewSigners = (signers) => {
    setCurrentSigners(signers || []);
    setShowSignersPopup(true);
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
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
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
          </div>
        )}
      </div>
    );
  };

  // ---------------- Delegate API call ----------------
  const submitDelegate = async () => {
    try {
      if (!delegateDoc?.id) {
        toast.error("No document selected", { containerId: "signatureRequests" });
        return;
      }
      if (!delegateEmail.trim()) {
        toast.error("Delegate email is required", { containerId: "signatureRequests" });
        return;
      }

      setDelegating(true);
      const token = localStorage.getItem("token");

      await axios.patch(
        `${BASE_URL}/delegateSigner`,
        {
          documentId: delegateDoc.id,
          fromEmail: currentEmail, // delegate from the signer currently logged in
          toEmail: delegateEmail.trim(),
          toName: delegateName.trim(),
        },
        { headers: { authorization: `Bearer ${token}` } }
      );

      toast.success("Delegated successfully. The new signer has been invited.", {
        containerId: "signatureRequests",
      });

      setDelegateOpen(false);
      setDelegateDoc(null);
      setDelegateEmail("");
      setDelegateName("");

      // ✅ Refresh list if parent provided a refresh function
      if (typeof refreshNeedSign === "function") {
        refreshNeedSign();
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || "Unable to delegate", {
        containerId: "signatureRequests",
      });
    } finally {
      setDelegating(false);
    }
  };

  return (
    <div>
      <ToastContainer containerId={"signatureRequests"} />

      <div className="py-[8px] px-[16px] bg-white overflow-x-auto rounded-[10px] cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Recent signature requests
        </h2>

        {loading.needsignLoading === true ? (
          <div className="h-[250px] flex justify-center items-center">
            <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 border-t border-b min-w-[600px] border-gray-200 py-3 px-4 font-bold text-[14px]">
              <div>Title</div>
              <div>File</div>
              <div>Owner</div>
              <div>Signers</div>
              <div>Action</div>
            </div>

            {paginatedRequests?.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No signature requests found
              </div>
            ) : (
              paginatedRequests.map((request) => (
                <div
                  key={request?.id}
                  className="grid grid-cols-5 min-w-[600px] py-3 px-4 border-b border-gray-100 items-center"
                >
                  <div className="font-bold text-sm">{request?.title}</div>

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
                      View ({request.signers?.length || 0})
                    </button>
                  </div>

                  <div>
                    <ActionMenu request={request} />
                  </div>
                </div>
              ))
            )}

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
          </>
        )}
      </div>

      {/* Signers popup */}
      {showSignersPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Signers</h3>
            <ul className="space-y-2">
              {(currentSigners || []).map((signer, index) => (
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
    </div>
  );
}
