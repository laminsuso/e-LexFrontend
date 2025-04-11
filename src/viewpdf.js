import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "./baseUrl";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ViewPdf() {
  const { documentId } = useParams();
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BASE_URL}/getSpecificDoc/${documentId}`, {
          headers: { authorization: `Bearer ${token}` }
        });
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
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={800}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          ))}
        </Document>
      ) : (
        <p>Loading PDF...</p>
      )}
    </div>
  );
}
