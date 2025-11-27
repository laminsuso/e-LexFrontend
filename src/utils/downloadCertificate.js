// utils/downloadCertificate.js
import axios from "axios";

export async function downloadCertificateOrZip(docId, token) {
  if (!docId) throw new Error("Missing docId");
  const headers = { Authorization: `Bearer ${token}` };
  const base = process.env.REACT_APP_API_BASE || "https://e-lex-backend-eight.vercel.app"; // / or your BASE_URL
  // Try the certificate-only endpoint (preferred)
  const certUrl = `${base}/download/${docId}/certificate`;
  const zipUrl  = `${base}/download/${docId}`; // fallback: returns zip (or combine query)

  try {
    const res = await axios.get(certUrl, { headers, responseType: "blob" });
    if (res.status === 200) {
      const blob = res.data;
      const fileName = (res.headers["content-disposition"] || `certificate-${docId}.pdf`).split('filename=')[1]?.replace(/"/g,'') || `certificate-${docId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return { ok: true, type: "certificate" };
    }
  } catch (err) {
    // certificate endpoint may not exist (404) or produce error -> fallback
    console.warn("certificate-only download failed:", err?.message || err);
  }

  // Fallback: download combined file or zip
  try {
    // if backend expects query combine=true -> use `${zipUrl}?combine=true`
    // If your backend returns a zip by default, just call zipUrl
    const res = await axios.get(`${zipUrl}?combine=false`, { headers, responseType: "blob" });
    if (res.status === 200) {
      const blob = res.data;
      const contentType = res.headers["content-type"] || "";
      let ext = ".zip";
      if (contentType.includes("pdf")) ext = ".pdf";
      const fileName = (res.headers["content-disposition"] || `document-${docId}${ext}`).split('filename=')[1]?.replace(/"/g,'') || `document-${docId}${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return { ok: true, type: "zip_or_combined" };
    }
  } catch (err) {
    console.error("fallback zip download failed:", err?.message || err);
    throw new Error("Unable to download certificate or combined file at the moment.");
  }
}
