import { useState,useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import img from "./images/loginimg.svg";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "./baseUrl";
import { gapi } from 'gapi-script';

export default function Login() {
  const [region, setRegion] = useState("global");
  const [login, setLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmailError, setLoginEmailError] = useState(false);
  const [loginPasswordError, setLoginPasswordError] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => {
    
    const phonePattern = /^(?:\+?\d{1,3}[-\s]?)?(\(?\d{2,4}\)?[-\s]?)?\d{7,10}$/;
    return phonePattern.test(phone);
  };
  const navigate = useNavigate();
  const checkLoginValidation = async () => {
    if (email.length === 0) {
      setLoginEmailError(true);
    } else if (email.length > 0) {
      setLoginEmailError(false);
    }
    if (password.length === 0) {
      setLoginPasswordError(true);
    } else if (password.length > 0) {
      setLoginPasswordError(false);
    }
    try {
   
      let response = await axios.post(`${BASE_URL}/login`, { email, password });
     
      toast.success("User logged in sucessfully", {
        containerId: "loginContainer",
      });
      localStorage.setItem("token", response.data.token);
      let token = localStorage.getItem("token");
      let headers = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      navigate("/admin");
    } catch (e) {
      
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, {
          containerId: "loginContainer",
        });
      } else {
        toast.error("Something went wrong please try again", {
          containerId: "loginContainer",
        });
      }
    }
  };
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    company: "",
    jobTitle: "",
    regPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({
    email: false,
    password: false,
    name: false,
    phone: false,
    company: false,
    jobTitle: false,
    regPassword: false,
    agreeTerms: false,
  });

  const checkRegisterValidation = async() => {
    const newErrors = {
      name: formData.name === "",
      email: formData.email === "" || !validateEmail(formData.email),
      phone: formData.phone === "" || !validatePhone(formData.phone),
      company: formData.company === "",
      jobTitle: formData.jobTitle === "",
      regPassword: formData.regPassword === "",
      agreeTerms: !formData.agreeTerms,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some((v) => v)) {
      return !Object.values(newErrors).some((v) => v);
    }

    try{
      let data={
        ...formData,
        password:formData.regPassword,
        job_title:formData.jobTitle
      }
let response=await axios.post(`${BASE_URL}/register`,data)
toast.success(response.data.message,{containerId:"loginContainer"})
setFormData({
  email: "",
  password: "",
  name: "",
  phone: "",
  company: "",
  jobTitle: "",
  regPassword: "",
  agreeTerms: false,
})
   }catch(e){
    if(e?.response?.data?.error){
     toast.error(e?.response?.data?.error,{containerId:"loginContainer"}) 
    }else{
      toast.error("Something went wrong please try again",{containerId:"loginContainer"})
    }
   }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  useEffect(() => {
    const initGoogleAPI = () => {
      gapi.load('auth2', function () {
        gapi.auth2.init({
          client_id: '281111470474-feflu0k26oo5etu6m8vjn334vh1rfds2.apps.googleusercontent.com', 
        });
      });
    };
    initGoogleAPI();
  }, []);

  const loginWithGoogle=async()=>{
try{

  const auth2 = gapi.auth2.getAuthInstance();
  auth2.signIn().then(async(googleUser) => {
    const profile = googleUser.getBasicProfile();


   
   
    let response = await axios.post(`${BASE_URL}/googleLogin`,{email:profile.getEmail()});
    toast.success("User logged in sucessfully", {
      containerId: "loginContainer",
    });
    localStorage.setItem("token", response.data.token);
    let token = localStorage.getItem("token");
    let headers = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    navigate("/admin"); 
  
  }).catch(error => {
   
  });

 

}catch(e){
if(e?.response?.data?.error){
  toast.error(e?.response?.data?.error,{containerId:"loginContainer"})
}else{
  toast.error("Something went wrong please try again",{containerId:"loginContainer"})
}
}
  }
  return (
    <>
      <ToastContainer containerId={"loginContainer"} />
      <div className="lg:px-[64px] lg:pt-[40px] px-[20px] py-[20px] lg:pb-[10px] bg-[#e5e7eb]">
        <div className="p-[24px] bg-[#ffffff] rounded-[16px]">
          <a href="/" className="max-w-[250px] flex justify-center items-center gap-1">
            <img
             
              alt="logo"
              className="h-8" src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
            />
            E-Lex Signature
          </a>
          <div className="flex gap-[10px]">
            <div className="w-full flex  lg:w-1/2">
              {login ? (
                <div className="flex flex-col w-full">
                  <h1 className="text-[30px] mt-[24px]">Welcome back!</h1>
                  <p className="mb-[10px] text-[12px] text-[#878787]">
                    Login to your account
                  </p>
                  <div className="shadow-lg bg-base-100 outline outline-1 w-fit mx-auto outline-slate-300/50 flex justify-center items-center rounded-full my-2">
                    <div
                      onClick={() => {
                        setRegion("global");
                      }}
                      className={`op-bg-secondary  ${
                        region == "global"
                          ? "bg-[#29354a] text-white "
                          : "bg-white text-black"
                      } rounded-full  capitalize px-10 py-2 my-2 first:ml-2 last:mr-2 cursor-pointer`}
                    >
                      Global
                    </div>
                    <div
                      onClick={() => {
                        setRegion("europe");
                      }}
                      className={`op-bg-secondary flex items-center gap-[10px]  ${
                        region == "europe"
                          ? "bg-[#29354a] text-white "
                          : "bg-white text-black"
                      } rounded-full  capitalize px-10 py-2 my-2 first:ml-2 last:mr-2 cursor-pointer`}
                    >
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAsQAAALEBxi1JjQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAP4SURBVEiJtZV9aFVlHMc/z7lv272bm3cv7u4t26ZFmwjJFuFqTSIVkoqQisJpZVD9EY1AkuoPB5UYwiCRiJyGppVYkURG3aWmZTpthDhsd5vb7nHz7r5t93rvds95nv7Ympu0l7J+f51zft+X3+/3POd54H8OMVMirHfdr+BpUMsFuIEBgTohTPZmlVR0/muDaF+fW2pj+xA8PAMnJVA7sjzlbwkhzH9kEO7uzsYhTwF3TXw6reCohgpKIcqEEutBlU3k9md7yjYIIdR8uyF0tetQWPepkO5LRPydT9ycV+qcLeTv3BHWfSqs+1RE73p+/uIDvmVh3SfDuk+Fr3ZunA0b1js/njDRlWq1zobV/noQUqwHhICO7ILyfbORpFRbAQl4IgPFtfMyAFUJoIT6fq655hQv6Qc6AJS0VM3TQLjHyxPB2QhTCgoACE3lzIayAhSuaK3t7R0sstuMWCBqqy6sbn1wLvne3kDhBL6moNpbOXB21cW/wwkAz4rWbgSLbVaBwy6IXZe4szSsFsG1kInDLsh3WxgYMkkZCk+elURSEhmR4yKKvXpb/aYZOwBYlGNh1xt5GKZi18Eoa2pd5GZbCEZMvvTG2PKcG6UULzUF2P1mHpERydHjcQ5/F5u108k1qFmWxufHYry4LUA8Mb7G23aHKPWM1+A9cx3vmQTL73AQGZFsbQ6y6p70uSZ5w8BqgbGUor7GSX2NcxJgTBwGj6xyseQ2GyfPJynItbCnKZ8PDw8DoJRhm9NgOC4pK7ERjJrYJgbncgpc6eOnyVfeOK9uHyI5KglFTfRrBslRiZIJjFTgbvNCxcuqvaJ4RoPjZxNYNFhX5+KjI8N09Y3x2saF7P40SnRE0T9oTJIuXBply84ga1ZqaMYVtjd87QHel5ITqq18xVSDabtI0yRS3vg1bn4XQqGURKaGybTrPL7yd15Y28bi/MhUTRM4MBY1fkx/oKdlkl3kDrH9mf2svPMSNqtJ/oIorz92hHXVZ0m3J1iQNsimui/YVPcZCxx93L5oiLcbfpgm3v6HhaY96RZpqA2puHwXpmzTbGeMp+47yULXMD9dLEKkhWmo99LRn8vR0xlgM9i8+jQAh45X0d5TgD+YSYYjhj+gkTLgvQPpNDfGGQ0ZaFbt28kR5VW2JDPSYo7yghAAv3UXIISiZqkf09Q411kIQM1SPwC/Xi4CoPHRn9m8+hSv7HQB0NwYJ0MajEZSym51ljjXXfaPG1R9clDJ2JMw/7sDIM1u0PrOXrKdEZRUOFMpjBETW6a1xfVQz7OTHdxKqLbyimTEPD8WNTKVApvT8otr7ZV7b1V3Wox6Sytj35T2x4+VfvCfCs8n/gTaZ7pyyNqI1wAAAABJRU5ErkJggg==" alt="gdpr" />
                    West Africa
                    </div>
                  </div>

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
                      {loginEmailError ? (
                        <p className="text-[12px] text-red-600">
                          * Email is required
                        </p>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="mb-6 w-full relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {loginPasswordError ? (
                        <p className="text-[12px] text-red-600">
                          * Password is required
                        </p>
                      ) : (
                        ""
                      )}
                    </div>
                    <Link className="text-[12px] text-blue underline" to="/forgetpassword">Forget Password?</Link>
                  </div>
                  <div className="flex items-center gap-[20px] mt-[10px] flex-col lg:flex-row">
                    <button
                      onClick={checkLoginValidation}
                      className="flex justify-center bg-[#002864] text-white text-[14px] text-center w-1/2 px-[16px] py-[10px] rounded-[20px]"
                    >
                      Login
                    </button>
                    <button
                      className="flex justify-center bg-[#e10032] text-white text-[14px] text-center w-1/2 px-[16px] py-[10px] rounded-[20px]"
                      onClick={() => {
                        setLogin(false);
                      }}
                    >
                      Create Account
                    </button>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center my-6">
                      <div className="flex-grow border-t border-[#cbd5e180]"></div>
                      <span className="mx-4 text-sm text-gray-500">or</span>
                      <div className="flex-grow border-t border-[#cbd5e180]"></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 mt-[20px]">
                    <button onClick={loginWithGoogle} className="flex items-center justify-center gap-2 w-full bg-white text-gray-700 text-[14px] text-center px-[16px] py-[10px] rounded-[8px] border border-[#cbd5e180] hover:bg-gray-50 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                      >
                        <path
                          fill="#4285F4"
                          d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.1.9-.7 1.7-1.5 2.3v2h2.4c1.4-1.3 2.2-3.2 2.2-5.4z"
                        />
                        <path
                          fill="#34A853"
                          d="M9 18c2.4 0 4.4-.8 5.8-2.2l-2.4-1.8c-.7.5-1.6.8-3.4.8-2.6 0-4.8-1.8-5.6-4.1H.9v2.3C2.3 15.6 5.4 18 9 18z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M3.4 10.7c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V4.4H.9C.3 5.7 0 7.3 0 9s.3 3.3.9 4.6l2.5-1.9z"
                        />
                        <path
                          fill="#EA4335"
                          d="M9 3.6c1.5 0 2.8.5 3.8 1.4l2.9-2.9C13.4.6 11.4 0 9 0 5.4 0 2.3 2.4.9 5.4l2.5 2.3c.8-2.3 3-4.1 5.6-4.1z"
                        />
                      </svg>
                      Sign in with Google
                    </button>
                 
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <h1 className="text-[30px] mt-[24px]">Create account!</h1>
                  <div className="flex flex-col my-[4px] px-[24px] py-[16px] bg-white rounded-[16px] border border-[#cbd5e180] shadow-md register-form">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                        />
                        {errors.name && (
                          <p className="text-[12px] text-red-600">
                            * Name is required
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your email"
                        />
                        {errors.email && (
                          <p className="text-[12px] text-red-600">
                            * Valid email is required
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your phone number"
                        />
                        {errors.phone && (
                          <p className="text-[12px] text-red-600">
                            * Valid phone number is required
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company *
                        </label>
                        <input
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your company name"
                        />
                        {errors.company && (
                          <p className="text-[12px] text-red-600">
                            * Company name is required
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job title *
                        </label>
                        <input
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your job title"
                        />
                        {errors.jobTitle && (
                          <p className="text-[12px] text-red-600">
                            * Job title is required
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            name="regPassword"
                            type={showRegPassword ? "text" : "password"}
                            value={formData.regPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                            placeholder="Create a password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          ></button>
                        </div>
                        {errors.regPassword && (
                          <p className="text-[12px] text-red-600">
                            * Password is required
                          </p>
                        )}
                      </div>

                      <div className="flex items-center mt-4">
                        <input
                          name="agreeTerms"
                          type="checkbox"
                          checked={formData.agreeTerms}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-600">
                          I agree to the{" "}
                          <a href="#" className="text-blue-600 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      {errors.agreeTerms && (
                        <p className="text-[12px] text-red-600">
                          * You must agree to the terms
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-[20px] mt-[10px] flex-col lg:flex-row">
                    <button
                      onClick={checkRegisterValidation}
                      className="flex justify-center bg-[#002864] text-white text-[14px] text-center w-1/2 px-[16px] py-[10px] rounded-[20px]"
                    >
                      Register
                    </button>
                    <button
                      className="flex justify-center bg-[#29354a] text-white text-[14px] text-center w-1/2 px-[16px] py-[10px] rounded-[20px]"
                      onClick={() => {
                        setLogin(true);
                      }}
                    >
                      Login
                    </button>
                  </div>
                </div>
              )}
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
