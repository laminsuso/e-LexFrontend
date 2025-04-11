import { useState } from "react";
import { Link } from "react-router-dom";
import img from "./images/loginimg.svg";
import { ToastContainer,toast } from "react-toastify";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const sendPasswordResetLink=async()=>{
    if(email.length==0){
      toast.error("Please enter email",{containerId:"forget-password"})
      return;
    }
    try{
      let token=localStorage.getItem('token')
      let headers={
        headers:{
          authorization:`Bearer ${token}`
        }
      }
let response=await axios.post(`${BASE_URL}/sendPasswordResetLinks`,{email},headers)
toast.success("Please check your email",{containerId:"forget-password"})
setEmail("")
    }catch(e){
     
      if(e?.response?.data?.error){
        toast.error(e?.response?.data?.error,{containerId:"forget-password"})
      }else{
        toast.error("Something went wrong please try again",{containerId:"forget-password"})
      }
    }
  }
  return (
    <>
    <ToastContainer containerId={"forget-password"}/>
    
    <div className="lg:px-[64px] lg:pt-[40px] px-[20px] py-[20px] lg:pb-[10px] bg-[#e5e7eb]">
      <div className="p-[24px] bg-[#ffffff] rounded-[16px]">
        <a href="/" className="max-w-[250px] flex">
          <img
            src="https://logosbynick.com/wp-content/uploads/2018/03/final-logo-example.png"
            alt="logo"
            className="w-full"
          />
        </a>
        <div className="flex gap-[10px]">
          <div className="w-full flex  lg:w-1/2">
            <div className="flex flex-col w-full">
              <h1 className="text-[30px] mt-[24px]">Welcome back!</h1>
              <div className="flex flex-col my-[4px] px-[24px] py-[16px] bg-white rounded-[16px] border border-[#cbd5e180] shadow-md login-form">
                <div className="mb-4 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="flex gap-[20px]">
                <button onClick={sendPasswordResetLink} className="flex justify-center bg-[#002864] text-white text-[14px] text-center w-1/2 px-[16px] py-[10px] rounded-[20px]">
                  Submit
                </button>
                <Link
                  to="/join"
                  className="flex justify-center bg-[#e10032] text-white text-[14px] text-center w-1/2 px-[16px] py-[10px] rounded-[20px]"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex lg:w-1/2">
            <img src={img} alt="img" className="w-full" />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
