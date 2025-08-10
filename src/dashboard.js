import { Link } from "react-router-dom";
import SignatureRequests from "./component/signaturerequests";
import SentForSignature from "./component/sentforsignature";
import Draft from "./component/draft";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { useEffect, useState } from "react";
export default function DashboardPage() {
  const [requests, setRequests] = useState([]);
  const [currentEmail,setCurrentEmail]=useState("")
  const [loading,setLoading]=useState({
    needsignLoading:true,
    outforsignature:true,
    draft:true
  })
  const [sentRequests, setSentRequests] = useState([
  
  ]);
  const [draftRequests, setDraftRequests] = useState([]);

  const recentSignatureRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/getNeedSignDocs`, {
        headers: { authorization: `Bearer ${token}` },
      });
      
      setCurrentEmail(response.data.currentEmail)
      const transformedData = response.data.documents.map((doc) => {
        const createdAt = new Date(doc.createdAt);

        const expiryDate = new Date(createdAt);
        expiryDate.setDate(createdAt.getDate() + doc.time_to_complete);

        return {
          id: doc._id,
          title: doc.title,
          fileName: doc.file.split("/").pop(),
          filePath: doc.file,
          owner: doc.owner,
          signers: doc.signers,
          expiryDate: expiryDate.toLocaleDateString(),
          status: doc.status,
        };
      });

      setRequests(transformedData);
      setLoading({
        draft:false,
        outforsignature:false,
        needsignLoading:false
      })
    } catch (error) {
   
    
    }finally{
      setLoading({
        draft:false,
        outforsignature:false,
        needsignLoading:false
      })
    }
  };

  useEffect(() => {
    recentSignatureRequests();
    sentSignatureRequests();
    getTemplates();
  }, []);

  const getTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/getDrafts`, {
        headers: { authorization: `Bearer ${token}` },
      });
    
      setDraftRequests(response.data.drafts);
      setLoading({
        draft:false,
        outforsignature:false,
        needsignLoading:false
      })
    } catch (e) {
      
    }finally{
      setLoading({
        draft:false,
        outforsignature:false,
        needsignLoading:false
      })
    }
  };

  const sentSignatureRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/recentSentRequest`, {
        headers: { authorization: `Bearer ${token}` },
      });
      

      const transformedData = response.data.docs.map((doc) => {
        const createdAt = new Date(doc.createdAt);

        const expiryDate = new Date(createdAt);
        expiryDate.setDate(createdAt.getDate() + doc.time_to_complete);

        return {
          id: doc._id,
          title: doc.title,
          fileName: doc.file.split("/").pop(),
          filePath: doc.file,
          owner: doc.owner,
          signers: doc.signers,
          expiryDate: expiryDate.toLocaleDateString(),
          status: doc.status,
        };
      });
      setLoading({
        ...loading,
        draft:false
      })
      setSentRequests(transformedData);
    } catch (error) {
      
    }finally{
      
      setLoading({
        draft:false,
        outforsignature:false,
        needsignLoading:false
      })
    }
  };

  return (
    <>
      <ToastContainer containerId={"dashboard"} />

      <div className="flex flex-col gap-[20px] bg-transparent">
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-[20px] bg-transparent">
          <Link
            to="/admin/sign-yourself"
            className="py-[8px] px-[16px] flex items-center gap-[20px] bg-white rounded-[10px] cursor-pointer"
          >
            <div className="rounded-full bg-[#d0d0d0] bg-opacity-20 w-[60px] h-[60px] self-start flex justify-center items-center">
              <i className="fal fa-pen-nib text-[25px]"></i>
            </div>
            <div className="flex flex-col gap-[6px] text-[18px] font-bold">
              Sign yourself
              <div className="text-[12px] font-normal">
                Use this option to sign the document yourself without adding
                others
              </div>
            </div>
          </Link>
          <Link
            to="/admin/request-signatures"
            className="py-[8px] px-[16px] flex items-center gap-[20px] bg-white rounded-[10px] cursor-pointer"
          >
            <div className="rounded-full bg-[#d0d0d0] bg-opacity-20 w-[60px] h-[60px] self-start flex justify-center items-center">
              <i className="fal fa-paper-plane text-[25px]"></i>
            </div>
            <div className="flex flex-col gap-[6px] text-[18px] font-bold">
              Request signatures
              <div className="text-[12px] font-normal">
                Use this option to request signatures from others and yourself
                together.
              </div>
            </div>
          </Link>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-[20px] bg-transparent">
          <Link
            to="/admin/sign-yourself"
            className="py-[24px] px-[16px] flex items-center gap-[20px] bg-[#002864] rounded-[10px] cursor-pointer"
          >
            <div className="rounded-full bg-[#3763a5] bg-opacity-20 w-[60px] h-[60px] self-start flex justify-center items-center">
              <i className="fal fa-signature white-light-icon text-white text-[25px]"></i>
            </div>
            <div className="flex flex-col gap-[6px] text-[18px] font-bold text-white">
              Need Your Signature
              <div className="text-[12px] font-normal text-white">
                {requests.length}
              </div>
            </div>
          </Link>
          <Link
            to="/admin/request-signatures"
            className="py-[8px] px-[16px] flex items-center gap-[20px] bg-[#29354a] rounded-[10px] cursor-pointer"
          >
            <div className="rounded-full bg-[#adadad] bg-opacity-20 w-[60px] mt-[20px] h-[60px] self-start flex justify-center items-center">
              <i className="fal fa-sign-out-alt text-[25px] text-white"></i>
            </div>
            <div className="flex flex-col gap-[6px] text-[18px] font-bold text-white">
              Out for Signatures
              <div className="text-[12px] font-normal text-white">
                {sentRequests?.length}
              </div>
            </div>
          </Link>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-[20px] bg-transparent">
          <SignatureRequests currentEmail={currentEmail} loading={loading} requests={requests} setRequests={setRequests} />
          <SentForSignature
          loading={loading}
            requests={sentRequests}
            setRequests={setSentRequests}
          />
        </div>
        <div>
          <Draft loading={loading} requests={draftRequests} setRequests={setDraftRequests} />
        </div>
      </div>
    </>
  );
}
