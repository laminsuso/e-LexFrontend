// src/component/draftdocs.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "../baseUrl";
import StatusBadge from "./StatusBadge";

export default function DraftDocs() {
  const navigate = useNavigate();
  const { searchText, dateRange, senderFilter } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);

  const handleViewSigners = (signers) => {
    setCurrentSigners(signers || []);
    setShowSignersPopup(true);
  };

  const handleDownload = async (fileUrl) => {
    if (!fileUrl) return;
    try {
      const resp = await fetch(fileUrl);
      const blob = await resp.blob();
      const fileName = fileUrl.split("/").pop() || "document.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download file right now", { containerId: "drafts" });
    }
  };

  // ✅ Continue draft → open builder with ?draftId=<docId>
  const handleContinue = (docId) => {
    if (!docId) return;
    navigate(`/admin/request-signatures?draftId=${encodeURIComponent(docId)}`);
  };

  // ✅ Delete draft doc (NOT deleteTemplate)
  const handleDelete = async (docId) => {
    if (!docId) return;
    if (!window.confirm("Delete this draft?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/deleteDraft/${docId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      toast.success("Draft deleted", { containerId: "drafts" });
      setRequests((prev) => prev.filter((d) => d._id !== docId));
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to delete draft", { containerId: "drafts" });
    }
  };

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/getDrafts`, {
        headers: { authorization: `Bearer ${token}` },
      });

      // Your backend returns { drafts }
      const drafts = res.data?.drafts || [];

      // Normalize owner + emails for filtering
      const normalized = drafts.map((doc) => ({
        ...doc,
        ownerName: doc?.owner?.name || "",
        ownerEmail: doc?.owner?.user?.email || "",
        status: "draft",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      setRequests(normalized);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load drafts", { containerId: "drafts" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- FILTERS ----------------
  const normalize = (str) => (str || "").toString().toLowerCase().trim();

  const matchesText = (doc) => {
    if (!searchText) return true;
    const q = normalize(searchText);

    const fields = [
      doc.title,
      doc.folder,
      doc.ownerName,
      doc.ownerEmail,
      ...(doc.signers || []).map((s) => s.email),
      ...(doc.copyholders || []).map((c) => c.email),
    ]
      .filter(Boolean)
      .map(normalize);

    return fields.some((f) => f.includes(q));
  };

  const withinDateRange = (doc) => {
    if (!dateRange || dateRange === "all") return true;
    if (!doc.createdAt) return true;

    const created = new Date(doc.createdAt);
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

  const matchesSender = (doc) => {
    if (senderFilter === "all") return true;
    const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const ownerEmail = (doc.ownerEmail || "").toLowerCase();
    const isMe = ownerEmail && ownerEmail === currentUserEmail;

    if (senderFilter === "me") return isMe;
    if (senderFilter === "others") return !isMe;
    return true;
  };

 const filtered = React.useMemo(() => {
  const normalize = (str) => (str || "").toString().toLowerCase().trim();

  return (requests || []).filter((tpl) => {
    // ----- matchesText -----
    if (searchText) {
      const q = normalize(searchText);
      const fields = [
        tpl.title,
        tpl.ownerName,
        tpl.ownerEmail,
        ...(tpl.signers || []).map((s) => s.email),
      ]
        .filter(Boolean)
        .map(normalize);

      if (!fields.some((f) => f.includes(q))) return false;
    }

    // ----- withinDateRange -----
    if (dateRange && dateRange !== "all" && tpl.createdAt) {
      const created = new Date(tpl.createdAt);
      const now = new Date();
      const msInDay = 24 * 60 * 60 * 1000;

      const ok =
        dateRange === "7d"
          ? now - created <= 7 * msInDay
          : dateRange === "30d"
          ? now - created <= 30 * msInDay
          : dateRange === "6m"
          ? now - created <= 183 * msInDay
          : dateRange === "1y"
          ? now - created <= 365 * msInDay
          : true;

      if (!ok) return false;
    }

    // ----- matchesSender -----
    if (senderFilter && senderFilter !== "all") {
      const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
      const ownerEmail = (tpl.ownerEmail || "").toLowerCase();
      const isMe = ownerEmail && ownerEmail === currentUserEmail;

      if (senderFilter === "me" && !isMe) return false;
      if (senderFilter === "others" && isMe) return false;
    }

    return true;
  });
}, [requests, searchText, dateRange, senderFilter]);


  return (
    <>
      <ToastContainer containerId={"drafts"} />

      <div className="py-[8px] px-[16px] bg-white rounded-[10px] cursor-pointer min-h-[430px] overflow-x-auto">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">Draft Documents</h2>

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
              <div>Actions</div>
            </div>

            {/* ROWS */}
            {filtered.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">No draft documents found</div>
            ) : (
              filtered.map((doc) => (
                <div
                  key={doc._id}
                  className="grid grid-cols-8 min-w-[900px] py-3 px-4 border-b border-gray-100 items-center"
                >
                  <div className="text-sm font-bold">{doc.title}</div>

                  <div className="text-sm text-gray-500">{doc.folder || "General"}</div>

                  <div>
                    <button
                      onClick={() => handleDownload(doc.file)}
                      className="text-blue-600 underline text-sm"
                      disabled={!doc.file}
                    >
                      Download
                    </button>
                  </div>

                  <div>{doc?.owner?.name || doc.ownerName || "—"}</div>

                  <div>
                    <button
                      onClick={() => handleViewSigners(doc.signers || [])}
                      className="text-blue-600 underline text-sm"
                    >
                      View ({(doc.signers || []).length})
                    </button>
                  </div>

                  <div>
                    <StatusBadge status="draft" />
                  </div>

                  <div className="text-sm text-gray-600">
                    {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : "-"}
                  </div>

                  {/* Actions: Continue + Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleContinue(doc._id)}
                      className="bg-[#002864] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                      title="Continue editing"
                    >
                      Continue
                    </button>

                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="bg-[#29354a] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                      title="Delete draft"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}

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
                {currentSigners?.map((s, i) => (
                  <li key={i} className="border-b pb-2 last:border-b-0">
                    {s?.email}
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
      </div>
    </>
  );
}
