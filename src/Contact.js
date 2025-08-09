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
       <div style={{background: '#ffffff', minHeight: '100vh'}} className="text-gray-900">
            <div className="lg:px-16 lg:pt-16 px-6 py-12">
                <Header />
                
                <div className="max-w-7xl mx-auto mt-20">
                    <div className="grid lg:grid-cols-5 gap-16 items-start">
                        
                        {/* Left Content - Takes 2 columns */}
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <div className="inline-block px-4 py-2 bg-blue-100 rounded-full text-sm font-medium mb-6 text-blue-700">
                                    ✨ Get In Touch
                                </div>
                                <h1 className="text-6xl lg:text-7xl font-black mb-8 leading-tight text-gray-900">
                                    Let's Build
                                    <br />
                                    Something
                                    <br />
                                    Amazing
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed mb-12">
                                    Ready to turn your vision into reality? Let's discuss your project and create something extraordinary together.
                                </p>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">⚡</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">Quick Response</h3>
                                            <p className="text-gray-600">We'll get back to you within 24 hours</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">🔒</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">Secure & Private</h3>
                                            <p className="text-gray-600">Your information is completely safe with us</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">🎯</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">Tailored Solutions</h3>
                                            <p className="text-gray-600">Custom approaches for your unique needs</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Form - Takes 3 columns */}
                        <div className="lg:col-span-3">
                            <div style={{
                                background: 'rgba(249, 250, 251, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(229, 231, 235, 0.8)',
                                borderRadius: '24px',
                                padding: '48px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold mb-2 text-gray-900">Send us a message</h2>
                                    <p className="text-gray-600">Fill out the form below and we'll get back to you soon.</p>
                                </div>
                                
                                <form onSubmit={sendMail} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700">First Name *</label>
                                            <input
                                                value={state.firstName}
                                                onChange={(e)=>{
                                                    setState({
                                                        ...state,
                                                        firstName:e.target.value
                                                    })
                                                }}
                                                type="text"
                                                placeholder="Enter your first name"
                                                style={{
                                                    background: '#ffffff',
                                                    border: '2px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    width: '100%',
                                                    fontSize: '16px',
                                                    color: '#1f2937',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => e.target.style.border = '2px solid #3b82f6'}
                                                onBlur={(e) => e.target.style.border = '2px solid #e5e7eb'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Last Name *</label>
                                            <input
                                                value={state.lastName}
                                                onChange={(e)=>{
                                                    setState({
                                                        ...state,
                                                        lastName:e.target.value
                                                    })
                                                }}
                                                type="text"
                                                placeholder="Enter your last name"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.95)',
                                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    width: '100%',
                                                    fontSize: '16px',
                                                    color: '#1f2937',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => e.target.style.border = '2px solid #3b82f6'}
                                                onBlur={(e) => e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)'}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email Address *</label>
                                            <input
                                                value={state.email}
                                                onChange={(e)=>{
                                                    setState({
                                                        ...state,
                                                        email:e.target.value
                                                    })
                                                }}
                                                type="email"
                                                placeholder="Enter your email"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.95)',
                                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    width: '100%',
                                                    fontSize: '16px',
                                                    color: '#1f2937',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => e.target.style.border = '2px solid #3b82f6'}
                                                onBlur={(e) => e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Phone Number *</label>
                                            <input
                                                value={state.phoneNumber}
                                                onChange={(e)=>{
                                                    setState({
                                                        ...state,
                                                        phoneNumber:e.target.value
                                                    })
                                                }}
                                                type="tel"
                                                placeholder="Enter your phone number"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.95)',
                                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    width: '100%',
                                                    fontSize: '16px',
                                                    color: '#1f2937',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => e.target.style.border = '2px solid #3b82f6'}
                                                onBlur={(e) => e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)'}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Project Details *</label>
                                        <textarea
                                            value={state.message}
                                            onChange={(e)=>{
                                                setState({
                                                    ...state,
                                                    message:e.target.value
                                                })
                                            }}
                                            placeholder="Tell us about your project, goals, timeline, and any specific requirements..."
                                            rows={5}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                width: '100%',
                                                fontSize: '16px',
                                                color: '#1f2937',
                                                transition: 'all 0.3s ease',
                                                resize: 'none'
                                            }}
                                            onFocus={(e) => e.target.style.border = '2px solid #3b82f6'}
                                            onBlur={(e) => e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)'}
                                        />
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        style={{
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '18px 32px',
                                            width: '100%',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
                                        }}
                                    >
                                        Send Message →
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
       </>
    );
}