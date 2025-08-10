import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer, toast } from "react-toastify";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading,setLoading]=useState(true)
  const [profileImage, setProfileImage] = useState(null);
  const [otp,setOtp]=useState("")
  const [passwordState, setPasswordState] = useState({
    current_password: "",
    password: "",
    confirm_password: "",
  });
  const [documentIdDisabled, setDocumentIdDisabled] = useState("no");
  const [verified, setVerified] = useState(false);
  const [verificationModal, setVerificationModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [tempData, setTempData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    is_email_verified: "",
    job_title: "",
    tagline: "",
    language: "",
    verifyPhone:false
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      console.log(file);
      if (file) {
        try {
          let avatarForm = new FormData();
          avatarForm.append("avatar", file);
          let token = localStorage.getItem("token");
          let headers = {
            headers: {
              authorization: `Bearer ${token}`,
            },
          };
          let response = await axios.patch(
            `${BASE_URL}/updateProfile`,
            avatarForm,
            headers
          );
          const reader = new FileReader();
          reader.onload = () => {
            setProfileImage(reader.result);
          };
          reader.readAsDataURL(file);
          window.location.reload(true)
        } catch (e) {
          if (e?.response?.data?.error) {
            toast.error(e?.response?.data?.error, { containerId: "profile" });
          } else {
            toast.error("Something went wrong please try again", {
              containerId: "profile",
            });
          }
        }
      }
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let response = await axios.get(`${BASE_URL}/getProfile`, headers);
      console.log("RES");
      console.log(response);
      setLoading(false)
      setTempData({
        is_email_verified: response.data.profile.is_email_verified,
        language: response.data.profile.language,
        email: response.data.profile.user.email,
        company: response.data.profile.company,
        name: response.data.profile.name,
        phone: response.data.profile.phone,
        job_title: response.data.profile.job_title,
        tagline: response.data.profile.tagline,
        verifyPhone:response?.data?.profile?.verifyPhone?response?.data?.profile?.verifyPhone:false
      });
      setProfileImage(response.data.profile.avatar);
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "profile" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "profile",
        });
      }
    }
  };


  useEffect(() => {
    console.log("Current verifyPhone:", tempData.verifyPhone);
    console.log("Current verifyPhonr:", tempData.verifyPhonr);
  }, [tempData]);



  useEffect(() => {
    if ("verifyPhonr" in tempData) {
      setTempData(prev => ({
        ...prev,
        verifyPhone: prev.verifyPhonr,
        verifyPhone: undefined
      }));
    }
  }, []);


  const saveChanges = async () => {
    try {
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      let response = await axios.patch(
        `${BASE_URL}/updateProfile`,
        tempData,
        headers
      );
      toast.success(response.data.message, { containerId: "profile" });
      setIsEditing(false);
      setTempData((prev) => {
        let data = { ...prev };
        delete data.avatar;
        return data;
      });
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "profile" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "profile",
        });
      }
    }
  };

  const savePassword = async () => {
    try {
      toast.dismiss();
      if (passwordState.current_password.length == 0) {
        toast.error("Please enter current password", {
          containerId: "profile",
        });
        return;
      } else if (passwordState.password.length == 0) {
        toast.error("Please enter new password", { containerId: "profile" });
        return;
      } else if (passwordState.confirm_password.length == 0) {
        toast.error("Please enter confirm password", {
          containerId: "profile",
        });
        return;
      } else if (passwordState.confirm_password != passwordState.password) {
        toast.error("Password and confirm password don't match", {
          containerId: "profile",
        });
        return;
      }
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let response = await axios.patch(
        `${BASE_URL}/updatePassword`,
        passwordState,
        headers
      );
      toast.success("Password updated sucessfully", { containerId: "profile" });
      setIsChangingPassword(false);
    } catch (e) {
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "profile" });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "profile",
        });
      }
    }
  };
  const verifyotp = async() => {
  try{
    let token=localStorage.getItem('token')
    let headers={
      headers:{
        authorization:`Bearer ${token}`
      }
    }
let res=await axios.post(`${BASE_URL}/verifyEmail`,{otpSubmitted:otp},headers)
setOtp("")
setVerificationModal(false);
setTempData((prev)=>{
  let old={
    ...prev
  }
old={
  ...old,
  is_email_verified:true
}
return old
})
  }catch(e){
if(e?.response?.data?.error){
toast.error(e?.response?.data?.error,{containerId:"profile"})
}else{
  toast.error("Something went wrong please try again",{containerId:"profile"})
}
  }
   
  };


  const sendOTP=async()=>{
    try{
      let token=localStorage.getItem('token')
      let headers={
        headers:{
          authorization:`Bearer ${token}`
        }
      }
      let res=await axios.post(`${BASE_URL}/sendEmailVerificationLink`,{},headers)
      setVerificationModal(true);
      toast.success("OTP sent",{containerId:"profile"})
    }catch(e){
if(e?.response?.data?.error){
  toast.error(e?.response?.data?.error,{containerId:"profile"})
}else{
  toast.error("Something went wrong please try again",{containerId:"profile"})
}
    }
  }
  return (
    <>
      <ToastContainer containerId={"profile"} />
      <div className="w-full md:w-[70%] mx-auto bg-white rounded-[20px] p-6">
        {loading?<div class="h-[250px] flex justify-center items-center"> <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div> </div>:<>
          <div className="text-center flex flex-col mb-8">
          <div className="relative inline-block" {...getRootProps()}>
            <input {...getInputProps()} />
            <div
              className={`cursor-pointer w-32 h-32 mx-auto mb-4 rounded-full border-4 ${
                isDragActive ? "border-blue-400" : "border-gray-100"
              }`}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-sm">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
          <div className="w-fit text-[16px] mx-auto  px-4 py-1 rounded-full inline-block mb-2">
            Admin
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Name:</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempData.name}
                  onChange={(e) =>
                    setTempData({ ...tempData, name: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="font-medium">{tempData?.name}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Phone:</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempData.phone}
                  onChange={(e) =>
                    setTempData({ ...tempData, phone: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="font-medium">{tempData?.phone}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Email:</div>
            <div className="md:col-span-2 flex items-center justify-between">
              {isEditing ? (
                <input
                  type="email"
                  value={tempData.email}
                  onChange={(e) =>
                    setTempData({ ...tempData, email: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                <>
                  <div>{tempData?.email}</div>
                  {tempData?.is_email_verified && (
                    <div className="flex items-center text-green-600">
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Verified
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Company:</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempData.company}
                  onChange={(e) =>
                    setTempData({ ...tempData, company: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="font-medium">{tempData?.company}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Job title:</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempData.job_title}
                  onChange={(e) =>
                    setTempData({ ...tempData, job_title: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                <div className="font-medium">{tempData?.job_title}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Is email verified:</div>
            <div className="md:col-span-2">
              {tempData.is_email_verified ? (
                <span>Verified</span>
              ) : (
                <span
                  className="flex items-center gap-[5px]"
                  onClick={sendOTP}
                >
                  Not verified{" "}
                  <p className="cursor-pointer  blur-none">
                    (<span className="text-blue-500 underline">verify</span>)
                  </p>
                </span>
              )}
            </div>
          </div>
         

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Tagline:</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={tempData.tagline}
                  onChange={(e) =>
                    setTempData({ ...tempData, tagline: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ) : tempData?.tagline ? (
                tempData?.tagline
              ) : (
                "Tagline"
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b">
            <div className="text-gray-600 font-medium">Language:</div>
            <div className="md:col-span-2">
              {isEditing ? (
                <select
                  value={tempData.language}
                  onChange={(e) =>
                    setTempData({ ...tempData, language: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                </select>
              ) : (
                <div className="font-medium capitalize">
                  {tempData.language}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="verifyPhoneCheckbox"
    checked={Boolean(tempData?.verifyPhone)}
    onChange={(e) => {
      setTempData({
        ...tempData,
        verifyPhone: e.target.checked
      });
    }}
    disabled={!isEditing}
    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
  />
  <label htmlFor="verifyPhoneCheckbox" className="text-sm text-gray-700">
    Send code via mobile
  </label>
</div>


          </div>

          <div className="flex gap-4 justify-end">
            {isEditing ? (
              <>
                <button
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#002864] text-white hover:bg-[#002864] rounded-[20px]"
                  onClick={saveChanges}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-4 py-2 bg-[#002864] text-white hover:bg-[#002864] rounded-[20px]"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
                <button
                  className="px-4 py-2 bg-[#29354a] text-[#c8d1e0] hover:bg-[#29354a] rounded-[20px]"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change Password
                </button>
              </>
            )}
          </div>
        </div>

        {isChangingPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Change Password</h3>
              <div className="space-y-4">
                <input
                  value={passwordState.current_password}
                  onChange={(e) => {
                    setPasswordState({
                      ...passwordState,
                      current_password: e.target.value,
                    });
                  }}
                  type="password"
                  placeholder="Current Password"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="password"
                  value={passwordState.password}
                  onChange={(e) => {
                    setPasswordState({
                      ...passwordState,
                      password: e.target.value,
                    });
                  }}
                  placeholder="New Password"
                  className="w-full p-2 border rounded-[20px]"
                />
                <input
                  type="password"
                  value={passwordState.confirm_password}
                  onChange={(e) => {
                    setPasswordState({
                      ...passwordState,
                      confirm_password: e.target.value,
                    });
                  }}
                  placeholder="Confirm New Password"
                  className="w-full p-2 border rounded-[20px]"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  className="px-4 py-2 bg-[#29354a] text-[#c8d1e0] hover:bg-[#29354a] rounded-[20px]"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={savePassword}
                  className="px-4 py-2 bg-[#002864] text-white hover:bg-[#002864] rounded-[20px]"
                >
                  Save Password
                </button>
              </div>
            </div>
          </div>
        )}
        {verificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <div className="flex justify-between">
                <h3 className="text-xl font-bold mb-4">OTP verification</h3>
                <div
                  className="text-[14px] cursor-pointer"
                  onClick={() => {
                    setVerificationModal(false);
                  }}
                >
                  X
                </div>
              </div>
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e)=>{
                  setOtp(e.target.value)
                }}
                placeholder="Enter verification code recieved over email"
                className="w-full p-2 border rounded mb-[20px]"
              />
              <div className="flex items-center gap-[20px]">
                <button
                  onClick={verifyotp}
                  className="px-4 py-2 bg-[#002864] text-white hover:bg-[#002864] rounded-[20px]"
                >
                  Verify
                </button>
                <button onClick={sendOTP} className="px-4 py-2 bg-[#29354a] text-[#c8d1e0] hover:bg-[#29354a] rounded-[20px]">
                  Resend
                </button>
              </div>
            </div>
          </div>
        )}
        </>}
      </div>
    </>
  );
}
