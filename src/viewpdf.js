import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ViewPdf() {
  const { documentId } = useParams();
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`);
        const docData = response.data.doc;
        setFile(docData.file);
      } catch (error) {
        setLoadingError("Failed to load document");
        console.error("Error loading PDF:", error);
      }
    };

    fetchPdf();
  }, [documentId]);

  return (
    <div className="flex h-screen overflow-y-scroll bg-gray-100 items-center justify-center">
      {loadingError ? (
        <div className="text-red-500">{loadingError}</div>
      ) : file ? (
        <>
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading="Loading PDF..."
        >
          {/* Page Navigation */}
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 mb-4 bg-white p-3 rounded shadow sticky top-0 z-40">
              <button
                onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                disabled={pageNumber <= 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                disabled={pageNumber >= numPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
          
          {/* Single Page Display */}
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
      </>
      ) : (
        <p>Loading PDF...</p>
      )}
    </div>
  );
}
