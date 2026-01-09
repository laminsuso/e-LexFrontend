// src/component/inprogresscomponent.js
import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { BASE_URL } from "../baseUrl";
import { toast, ToastContainer } from "react-toastify";
import StatusBadge from "./StatusBadge";

export default function InprogressComponent() {
  const navigate = useNavigate();
  const { searchText, dateRange, senderFilter } = useOutletContext();

  const [requests, setRequests] = useState([]);
  const [showSignersPopup, setShowSignersPopup] = useState(false);
  const [currentSigners, setCurrentSigners] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 5;

  const fetchInProgressRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${BASE_URL}/getInProgressDocs`, {
        headers: { authorization: `Bearer ${token}` },
      });

      const transformedData = (response.data.documents || []).map((doc) => ({
        id: doc._id,
        title: doc.title,
        note: doc.note || "",
        folder: doc.folder || "General",
        fileName: (doc.file || "").split("/").pop() || "document.pdf",
        filePath: doc.file,
        owner: doc?.owner?.name || "",
        ownerEmail: doc?.owner?.user?.email || "",
        signers: doc.signers || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        status: doc.status,
      }));

      setRequests(transformedData);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Something went wrong please try again", {
        containerId: "inprogress",
      });
      console.error("Error fetching inprogress:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInProgressRequests();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, dateRange, senderFilter]);

  // ---------------- FILTERS ----------------
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

    // owner-only list; but keep senderFilter working if you use it elsewhere
    const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
    const ownerEmail = (req.ownerEmail || "").toLowerCase();
    const isMe = ownerEmail && ownerEmail === currentUserEmail;

    if (senderFilter === "me") return isMe;
    if (senderFilter === "others") return !isMe;
    return true;
  };

  const filteredRequests = React.useMemo(() => {
  const normalize = (str) => (str || "").toString().toLowerCase().trim();

  return (requests || []).filter((req) => {
    // matchesText
    if (searchText) {
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

      if (!fields.some((f) => f.includes(q))) return false;
    }

    // withinDateRange
    if (dateRange && dateRange !== "all" && req.createdAt) {
      const created = new Date(req.createdAt);
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

    // matchesSender
    if (senderFilter && senderFilter !== "all") {
      const currentUserEmail = (localStorage.getItem("userEmail") || "").toLowerCase();
      const ownerEmail = (req.ownerEmail || "").toLowerCase();
      const isMe = ownerEmail && ownerEmail === currentUserEmail;

      if (senderFilter === "me" && !isMe) return false;
      if (senderFilter === "others" && isMe) return false;
    }

    return true;
  });
}, [requests, searchText, dateRange, senderFilter]);


  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------------- Handlers ----------------
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
    } catch {
      toast.error("Unable to download at the moment", { containerId: "inprogress" });
    }
  };

  const handleViewSigners = (signers) => {
    const onlyEmails = (signers || []).map((s) => ({ email: s?.email }));
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
      toast.success("Document deleted", { containerId: "inprogress" });
      fetchInProgressRequests();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong", { containerId: "inprogress" });
    }
  };

  // ✅ Copy in-progress → create a new draft and open editor/builder
  const handleCopy = async (docId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/duplicateEnvelope`,
        { sourceDocId: docId },
        { headers: { authorization: `Bearer ${token}` } }
      );

      const newDocId = res?.data?.doc?._id;
      if (!newDocId) {
        toast.error("Copied, but could not open the new draft", { containerId: "inprogress" });
        return;
      }

      toast.success("Copied. You can edit the new draft before sending.", { containerId: "inprogress" });

      // ✅ Jump into builder with this draft
      navigate(`/admin/request-signatures?draftId=${encodeURIComponent(newDocId)}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Unable to copy document", { containerId: "inprogress" });
    }
  };

  // ---------------- Action dropdown ----------------
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
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
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
              onClick={() => {
                setOpen(false);
                handleCopy(request.id);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              📄 Copy to Draft
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleDownload(request.filePath, request.fileName);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              ⬇️ Download
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

  return (
    <>
      <ToastContainer containerId={"inprogress"} />

      <div className="py-[8px] px-[16px] bg-white rounded-[10px] overflow-x-auto min-h-[430px]">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px] mb-4">In Progress Documents</h2>

        {loading ? (
          <div className="h-[250px] flex justify-center items-center">
            <div className="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
          </div>
        ) : (
          <>
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

            {paginatedRequests.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                No in progress documents found
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
                      className="text-blue-600 underline text-sm"
                    >
                      Download
                    </button>
                  </div>

                  <div>{request.owner}</div>

                  <div>
                    <button
                      onClick={() => handleViewSigners(request.signers)}
                      className="text-blue-600 underline text-sm"
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

                  <div className="flex items-center">
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

            <p className="text-sm text-gray-600 mt-4">
              Showing {paginatedRequests.length} of {filteredRequests.length} results
            </p>
          </>
        )}
      </div>

      {/* Signers popup */}
      {showSignersPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Signers</h3>
            <ul className="space-y-2">
              {currentSigners.map((s, i) => (
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
    </>
  );
}
