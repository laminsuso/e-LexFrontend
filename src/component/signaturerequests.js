import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { toast, ToastContainer } from "react-toastify";

export default function SignatureRequests({ requests, setRequests, loading }) {
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    setCurrentSigners(signers);
    setShowSignersPopup(true);
  };

  const totalPages = Math.ceil(requests?.length / itemsPerPage);
  const paginatedRequests = requests?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <ToastContainer containerId={"signatureRequests"} />
      <div className="py-[8px] px-[16px] bg-white overflow-x-auto rounded-[10px] cursor-pointer min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">
          Recent signature requests
        </h2>

        {loading.needsignLoading == true ? (
          <div class="h-[250px] flex justify-center items-center">
            <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
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

            {paginatedRequests?.length == 0 ? (
              <>
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No signature requests found
                </div>
              </>
            ) : (
              paginatedRequests?.map((request) => (
                <div
                  key={request?.id}
                  className="grid grid-cols-5 min-w-[600px] py-3 px-4 border-b border-gray-100 items-center"
                >
                  <div>
                    <div className="font-bold text-sm">{request?.title}</div>
                
                  </div>

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
                      View ({request.signers?.length || 0})
                    </button>
                  </div>

                  <div>
                    <Link
                      to={`/request-signatures/sign-document/${request._id}`}
                      className="bg-[#002864] w-fit text-white py-1 px-4 rounded-[20px] gap-[10px] text-[14px] flex items-center justify-center"
                    >
                      <i className="fal fa-signature white-light-icon text-white text-[14px]"></i>
                      Sign
                    </Link>
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
    </div>
  );
}
