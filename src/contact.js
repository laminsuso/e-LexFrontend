import axios from "axios";
import Header from "./component/header";
import { useState } from "react";
import { ToastContainer,toast } from "react-toastify";
import { BASE_URL } from "./baseUrl";
export default function Contact() {
    const [state,setState]=useState({
        firstName:'',
        lastName:'',
        email:'',
        message:'',
        phoneNumber:''
    })

const sendMail=async(e)=>{
    e.preventDefault()
    try{
        if(state.firstName.length==0){
toast.error("Please enter first name",{containerId:"contactUs"})
return
        }else if(state.lastName.length==0){
            toast.error("Please enter last name",{containerId:"contactUs"})
            return
        }else if(state.email.length==0){
toast.error("Please enter email",{containerId:"contactUs"})
return
        }else if(state.phoneNumber.length==0){
            toast.error("Please enter phone number",{containerId:"contactUs"})
            return
        }else if(state.message.length==0){
toast.error("Please enter message",{containerId:"contactUs"})
return
        }
let response=await axios.post(`${BASE_URL}/contactus`,state)
toast.success(response.data.message,{containerId:"contactUs"})
setState({
    firstName:'',
    lastName:'',
    email:'',
    message:'',
    phoneNumber:''
})
    }catch(e){
if(e?.response?.data?.error){
    toast.error(e?.response?.data?.error,{containerId:"contactUs"})
}else{
    toast.error("Something went wrong please try again",{containerId:"contactUs"})
}
    }
}

    return (
       <>
       <ToastContainer containerId={"contactUs"}/>
       <div className="lg:px-[64px] lg:pt-[40px] px-[20px] py-[20px] lg:pb-[10px] devbg  bg-[#1C024D] text-white min-h-screen">
            <Header />

            <div className="grid md:grid-cols-2 xl:px-[80px] lg:px-[40px] mt-10 items-center">
                
                <div className="text- h-full xl:pl-[12rem] md:text-left">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Contact Us Today
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300">
                        Discover how our solutions can help you achieve your goals.
                    </p>
                </div>

                
                <form onSubmit={sendMail} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                    value={state.firstName}
                    onChange={(e)=>{
                        setState({
                            ...state,
                            firstName:e.target.value
                        })
                    }}
                        type="text"
                        placeholder="First name*"
                        className="p-3 rounded bg-white text-black outline-none"
                    />
                    <input
                    value={state.lastName}
                    onChange={(e)=>{
                        setState({
                            ...state,
                            lastName:e.target.value
                        })
                    }}
                        type="text"
                        placeholder="Last name*"
                        className="p-3 rounded bg-white text-black outline-none"
                    />
                    <input
                    value={state.email}
                    onChange={(e)=>{
                        setState({
                            ...state,
                           email:e.target.value
                        })
                    }}
                        type="email"
                        placeholder="Email address*"
                        className="p-3 rounded bg-white text-black outline-none"
                    />
                    <input
                    value={state.phoneNumber}
                    onChange={(e)=>{
                        setState({
                            ...state,
                            phoneNumber:e.target.value
                        })
                    }}
                        type="tel"
                        placeholder="Phone number*"
                        className="p-3 rounded bg-white text-black outline-none"
                    />
                    <textarea
                    value={state.message}
                    onChange={(e)=>{
                        setState({
                            ...state,
                            message:e.target.value
                        })
                    }}
                        placeholder="Message*"
                        rows={4}
                        className="p-3 rounded bg-white text-black outline-none sm:col-span-2 resize-none"
                    />
                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            className="bg-white text-black px-8 py-3 rounded hover:bg-gray-200 transition"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
       </>
    );
}
