// // e-LexFrontend/src/viewpdf.js
// import React, { useState, useEffect } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import { BASE_URL } from "./baseUrl";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// export default function ViewPdf() {
//   const { documentId } = useParams();
//   const [pageNumber, setPageNumber] = useState(1);
//   const [file, setFile] = useState(null);
//   const [numPages, setNumPages] = useState(null);
//   const [loadingError, setLoadingError] = useState(null);

//   useEffect(() => {
//     const fetchPdf = async () => {
//       try {
//         setLoadingError(null);

//         const token = localStorage.getItem("token") || "";
//         const response = await axios.get(
//           `${BASE_URL}/getSpecificDoc/${documentId}`,
//           {
//             headers: token ? { authorization: `Bearer ${token}` } : {},
//           }
//         );

//         const docData = response.data.doc;
//         setFile(docData.file);
//       } catch (error) {
//         const msg =
//           error?.response?.data?.error ||
//           error?.message ||
//           "Failed to load document";
//         setLoadingError(msg);
//         console.error("Error loading PDF:", error);
//       }
//     };

//     if (documentId) fetchPdf();
//   }, [documentId]);

//   return (
//     <div className="flex h-screen overflow-y-scroll bg-gray-100 items-center justify-center">
//       {loadingError ? (
//         <div className="text-red-500">{loadingError}</div>
//       ) : file ? (
//         <Document
//           file={file}
//           onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//           loading="Loading PDF..."
//         >
//           {numPages > 1 && (
//             <div className="flex items-center justify-center gap-4 mb-4 bg-white p-3 rounded shadow sticky top-0 z-40">
//               <button
//                 onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
//                 disabled={pageNumber <= 1}
//                 className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
//               >
//                 Previous
//               </button>

//               <span className="text-sm font-medium">
//                 Page {pageNumber} of {numPages}
//               </span>

//               <button
//                 onClick={() =>
//                   setPageNumber((prev) => Math.min(prev + 1, numPages))
//                 }
//                 disabled={pageNumber >= numPages}
//                 className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
//               >
//                 Next
//               </button>
//             </div>
//           )}

//           <Page
//             pageNumber={pageNumber}
//             width={550}
//             renderAnnotationLayer={false}
//             renderTextLayer={false}
//             loading={
//               <div className="flex items-center justify-center h-96">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               </div>
//             }
//             error={
//               <div className="flex items-center justify-center h-96 bg-gray-100">
//                 <p className="text-gray-600">Failed to load page</p>
//               </div>
//             }
//           />
//         </Document>
//       ) : (
//         <p>Loading PDF...</p>
//       )}
//     </div>
//   );
// }

// e-LexFrontend/src/viewpdf.js
import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "./api"; // ✅ use axios instance with token interceptor

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ViewPdf() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoadingError(null);

        // ✅ Auth is handled automatically by api interceptor
        const response = await api.get(`/getSpecificDoc/${documentId}`);

        const docData = response.data?.doc;
        if (!docData?.file) throw new Error("Document file missing");
        setFile(docData.file);
      } catch (error) {
        const msg =
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load document";
        setLoadingError(msg);
        console.error("Error loading PDF:", error);
      }
    };

    if (documentId) fetchPdf();
  }, [documentId]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ✅ Back Button */}
      <div className="sticky top-0 z-50 bg-gray-100/80 backdrop-blur border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-[#29354a] text-white px-4 py-2 rounded-[12px] shadow hover:opacity-90"
          >
            ← Back
          </button>

          {/* Optional: show page indicator even when nav buttons are hidden */}
          {numPages ? (
            <div className="text-sm text-gray-700 font-medium">
              Page {pageNumber} of {numPages}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>

      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-[900px]">
          {loadingError ? (
            <div className="bg-white border border-red-200 rounded-lg p-4 text-red-600">
              {loadingError}
            </div>
          ) : file ? (
            <div className="bg-white rounded-lg shadow p-4">
              {/* Page Navigation */}
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                    disabled={pageNumber <= 1}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() =>
                      setPageNumber((prev) => Math.min(prev + 1, numPages))
                    }
                    disabled={pageNumber >= numPages}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="flex justify-center">
                <Document
                  file={file}
                  onLoadSuccess={({ numPages }) => {
                    setNumPages(numPages);
                    setPageNumber(1);
                  }}
                  loading="Loading PDF..."
                >
                  <Page
                    pageNumber={pageNumber}
                    width={550}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={
                      <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center h-96 bg-gray-100">
                        <p className="text-gray-600">Failed to load page</p>
                      </div>
                    }
                  />
                </Document>
              </div>
            </div>
          ) : (
            <div className="text-gray-700">Loading PDF...</div>
          )}
        </div>
      </div>
    </div>
  );
}
