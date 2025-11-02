
// // src/login.jsx
// import React, { useMemo, useState, useEffect } from "react";
// import axios from "axios";
// import { BASE_URL } from "./baseUrl";
// import { Link, useNavigate, useLocation } from "react-router-dom";

// const REGION_KEY = "elex_region"; // 'global' | 'wa'
// const REGISTER_ENDPOINT_PRIMARY = "/register";
// const REGISTER_ENDPOINT_FALLBACK = "/registerAndLogin";

// export default function Login() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // deep-link: /join?mode=signup
//   const initialMode = useMemo(() => {
//     const m = new URLSearchParams(location.search).get("mode");
//     return m === "signup" ? "signup" : "login";
//   }, [location.search]);

//   const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
//   const [region, setRegion] = useState(localStorage.getItem(REGION_KEY) || "global");

//   // login fields
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPwd, setShowPwd] = useState(false);

//   // signup fields
//   const [fullName, setFullName] = useState("");
//   const [newEmail, setNewEmail] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [agree, setAgree] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");

//   useEffect(() => {
//     localStorage.setItem(REGION_KEY, region);
//   }, [region]);

//   /* -----------------------------------------------------------------------
//    * SOCIAL BUTTON SIZE / LOOK CONTROL
//    * - Both Google and Microsoft share this exact class string.
//    * - Width: `w-full` makes each button fill its grid cell.
//    * - Height / padding: controlled by `py-2.5` and `h-[44px]`.
//    * - Font size: inherit (you can add `text-sm` if you want smaller text).
//    * - Icon size: see <img className="h-5 w-5" /> inside each button.
//    * --------------------------------------------------------------------- */
//   const socialBtnClass =
//     "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 " +
//     "bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 w-full h-[44px]";

//   // Google OAuth (server-side redirect flow; matches routes/auth.js rewrite)
//   const handleOAuthGoogle = () => {
//     window.location.href = `${BASE_URL}/auth/google`; // change if your start path differs
//   };

//   // Microsoft OAuth (same visual style, placeholder route)
//   const handleOAuthMicrosoft = () => {
//     window.location.href = `${BASE_URL}/auth/microsoft`; // update if you use a different route
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setErr("");
//     setLoading(true);
//     try {
//       const { data } = await axios.post(`${BASE_URL}/login`, { email, password, region });
//       if (data?.token) {
//         localStorage.setItem("token", data.token);
//         if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
//       }
//       navigate("/admin");
//     } catch (e) {
//       const msg =
//         e?.response?.data?.error ||
//         e?.response?.data?.message ||
//         "Could not sign in. Please check your email and password.";
//       setErr(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSignup = async (e) => {
//     e.preventDefault();
//     setErr("");

//     if (!agree) {
//       setErr("Please accept the Terms and Privacy Policy to continue.");
//       return;
//     }
//     if (!newPassword || newPassword.length < 8) {
//       setErr("Password must be at least 8 characters.");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       setErr("Passwords do not match.");
//       return;
//     }

//     setLoading(true);
//     try {
//       let data;
//       try {
//         const res = await axios.post(`${BASE_URL}${REGISTER_ENDPOINT_PRIMARY}`, {
//           name: fullName,
//           email: newEmail,
//           password: newPassword,
//           region,
//         });
//         data = res.data;
//       } catch {
//         const res = await axios.post(`${BASE_URL}${REGISTER_ENDPOINT_FALLBACK}`, {
//           email: newEmail,
//           name: fullName,
//         });
//         data = res.data;
//       }

//       if (data?.token) {
//         localStorage.setItem("token", data.token);
//         if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
//       }
//       navigate("/admin");
//     } catch (e) {
//       const msg =
//         e?.response?.data?.error ||
//         e?.response?.data?.message ||
//         "Could not create account. Please try again.";
//       setErr(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-b from-white to-slate-50">
//       {/* Left: form */}
//       <div className="flex items-center justify-center px-6 py-10">
//         <div className="w-full max-w-md">
//           {/* Brand */}
//           <div className="flex items-center gap-3 mb-6">
//             <img
//               src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
//               alt="E‑Lex Signature"
//               className="h-9 w-9 -rotate-6"
//             />
//             <span className="text-2xl font-bold text-slate-900">E‑Lex Signature</span>
//           </div>

//           {/* Header */}
//           <h1 className="text-3xl font-bold text-slate-900">
//             {mode === "login" ? "Welcome back" : "Create your account"}
//           </h1>
//           <p className="mt-1 text-slate-600">
//             {mode === "login"
//               ? "Sign in to manage and send agreements."
//               : "Start sending and signing secure, legally‑binding documents."}
//           </p>

//           {/* Region toggle */}
//           <div className="mt-6 inline-flex rounded-full bg-slate-100 p-1">
//             <button
//               type="button"
//               onClick={() => setRegion("global")}
//               className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                 region === "global"
//                   ? "bg-slate-900 text-white shadow"
//                   : "text-slate-700 hover:text-slate-900"
//               }`}
//             >
//               🌐 Global
//             </button>
//             <button
//               type="button"
//               onClick={() => setRegion("wa")}
//               className={`px-4 py-2 rounded-full text-sm font-medium transition ${
//                 region === "wa"
//                   ? "bg-slate-900 text-white shadow"
//                   : "text-slate-700 hover:text-slate-900"
//               }`}
//             >
//               🛡️ West Africa
//             </button>
//           </div>
//           {region === "wa" ? (
//             <p className="mt-2 text-xs text-slate-500">
//               AU/ECOWAS‑aligned controls. Local date formats apply (e.g. DD/MM/YYYY).
//             </p>
//           ) : (
//             <p className="mt-2 text-xs text-slate-500">ESIGN/UETA and eIDAS‑ready workflows.</p>
//           )}

//           {/* Card */}
//           <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
//             {/* Tabs */}
//             <div className="flex items-center gap-2 mb-4">
//               <button
//                 type="button"
//                 onClick={() => setMode("login")}
//                 className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
//                   mode === "login"
//                     ? "bg-slate-900 text-white"
//                     : "text-slate-600 hover:text-slate-900"
//                 }`}
//               >
//                 Login
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setMode("signup")}
//                 className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
//                   mode === "signup"
//                     ? "bg-slate-900 text-white"
//                     : "text-slate-600 hover:text-slate-900"
//                 }`}
//               >
//                 Create Account
//               </button>
//             </div>

//             {err && (
//               <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
//                 {err}
//               </div>
//             )}

//             {mode === "login" ? (
//               <form onSubmit={handleLogin} className="space-y-4">
//                 <div>
//                   <label htmlFor="email" className="block text-sm font-medium text-slate-700">
//                     Email
//                   </label>
//                   <input
//                     id="email"
//                     type="email"
//                     autoComplete="email"
//                     required
//                     className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
//                     placeholder="you@company.com"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value.trim())}
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="password" className="block text-sm font-medium text-slate-700">
//                     Password
//                   </label>
//                   <div className="mt-1 relative">
//                     <input
//                       id="password"
//                       type={showPwd ? "text" : "password"}
//                       autoComplete="current-password"
//                       required
//                       className="block w-full rounded-lg border-slate-300 pr-12 focus:border-purple-600 focus:ring-purple-600"
//                       placeholder="Enter your password"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                     />
//                     <button
//                       type="button"
//                       aria-label={showPwd ? "Hide password" : "Show password"}
//                       onClick={() => setShowPwd((v) => !v)}
//                       className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-2"
//                     >
//                       {showPwd ? "🙈" : "👁️"}
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <label className="inline-flex items-center gap-2 text-sm text-slate-600">
//                     <input type="checkbox" className="rounded border-slate-300" />
//                     Remember me
//                   </label>
//                   <Link to="/forgetpassword" className="text-sm text-purple-700 hover:text-purple-800">
//                     Forgot password?
//                   </Link>
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
//                 >
//                   {loading ? "Signing in…" : "Login"}
//                 </button>

//                 <div className="flex items-center gap-3">
//                   <div className="h-px flex-1 bg-slate-200" />
//                   <span className="text-xs text-slate-500">or</span>
//                   <div className="h-px flex-1 bg-slate-200" />
//                 </div>

//                 {/* Social row (identical look) */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   <button type="button" onClick={handleOAuthGoogle} className={socialBtnClass}>
//                     <img
//                       alt="Google"
//                       src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
//                       className="h-5 w-5"
//                     />
//                     Continue with Google
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleOAuthMicrosoft}
//                     className={socialBtnClass}
//                   >
//                     <img
//                       alt="Microsoft"
//                       src="https://static-00.iconduck.com/assets.00/microsoft-azure-icon-2048x2048-1p4mxwrt.png"
//                       className="h-5 w-5"
//                     />
//                     Continue with Microsoft
//                   </button>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() => setMode("signup")}
//                   className="block w-full text-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50"
//                 >
//                   Create Account
//                 </button>

//                 <p className="text-[11px] text-slate-500 leading-relaxed">
//                   By continuing you agree to our{" "}
//                   <Link to="/legal/terms" className="text-slate-700 underline decoration-slate-300 hover:text-slate-900">
//                     Terms
//                   </Link>{" "}
//                   and{" "}
//                   <Link to="/legal/privacy" className="text-slate-700 underline decoration-slate-300 hover:text-slate-900">
//                     Privacy Policy
//                   </Link>
//                   . {region === "wa" ? "AU/ECOWAS‑aligned practices apply." : "ESIGN/UETA applies."}
//                 </p>
//               </form>
//             ) : (
//               <form onSubmit={handleSignup} className="space-y-4">
//                 <div>
//                   <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
//                     Full name
//                   </label>
//                   <input
//                     id="fullName"
//                     type="text"
//                     required
//                     className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
//                     placeholder="Jane Doe"
//                     value={fullName}
//                     onChange={(e) => setFullName(e.target.value)}
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="newEmail" className="block text-sm font-medium text-slate-700">
//                     Work email
//                   </label>
//                   <input
//                     id="newEmail"
//                     type="email"
//                     autoComplete="email"
//                     required
//                     className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
//                     placeholder="you@company.com"
//                     value={newEmail}
//                     onChange={(e) => setNewEmail(e.target.value.trim())}
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
//                     Password
//                   </label>
//                   <input
//                     id="newPassword"
//                     type="password"
//                     autoComplete="new-password"
//                     required
//                     minLength={8}
//                     className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
//                     placeholder="At least 8 characters"
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
//                     Confirm password
//                   </label>
//                   <input
//                     id="confirmPassword"
//                     type="password"
//                     autoComplete="new-password"
//                     required
//                     minLength={8}
//                     className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                   />
//                 </div>

//                 <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
//                   <input
//                     type="checkbox"
//                     checked={agree}
//                     onChange={(e) => setAgree(e.target.checked)}
//                     className="rounded border-slate-300"
//                   />
//                   I agree to the{" "}
//                   <Link to="/legal/terms" className="underline decoration-slate-300 hover:text-slate-900">
//                     Terms
//                   </Link>{" "}
//                   and{" "}
//                   <Link to="/legal/privacy" className="underline decoration-slate-300 hover:text-slate-900">
//                     Privacy Policy
//                   </Link>
//                   .
//                 </label>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
//                 >
//                   {loading ? "Creating account…" : "Create Account"}
//                 </button>

//                 <div className="flex items-center gap-3">
//                   <div className="h-px flex-1 bg-slate-200" />
//                   <span className="text-xs text-slate-500">or</span>
//                   <div className="h-px flex-1 bg-slate-200" />
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   <button type="button" onClick={handleOAuthGoogle} className={socialBtnClass}>
//                     <img
//                       alt="Google"
//                       src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
//                       className="h-5 w-5"
//                     />
//                     Continue with Google
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleOAuthMicrosoft}
//                     className={socialBtnClass}
//                   >
//                     <img
//                       alt="Microsoft"
//                       src="https://static-00.iconduck.com/assets.00/microsoft-azure-icon-2048x2048-1p4mxwrt.png"
//                       className="h-5 w-5"
//                     />
//                     Continue with Microsoft
//                   </button>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={() => setMode("login")}
//                   className="block w-full text-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50"
//                 >
//                   Back to Login
//                 </button>
//               </form>
//             )}
//           </div>

//           {/* Trust markers */}
//           <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
//             <span className="inline-flex items-center gap-2">🔒 AES‑256 at rest</span>
//             <span className="inline-flex items-center gap-2">✅ ESIGN/UETA</span>
//             <span className="inline-flex items-center gap-2">🇪🇺 eIDAS ready</span>
//             <span className="inline-flex items-center gap-2">🌍 AU/ECOWAS aligned</span>
//           </div>
//         </div>
//       </div>

//       {/* Right: brand panel */}
//       <div className="hidden lg:block relative">
//         <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600" />
//         <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,white,transparent_30%),radial-gradient(circle_at_80%_30%,white,transparent_25%),radial-gradient(circle_at_10%_80%,white,transparent_25%)]" />
//         <div className="relative h-full flex items-center justify-center p-16 text-white">
//           <div className="max-w-lg">
//             <div className="text-4xl font-semibold leading-tight">
//               Securely sign & automate agreements
//             </div>
//             <p className="mt-4 text-indigo-100">
//               Faster workflows, tamper‑proof audit trails, and global compliance—built in.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// src/login.jsx
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { Link, useNavigate, useLocation } from "react-router-dom";

const REGION_KEY = "elex_region"; // 'global' | 'wa'
const REGISTER_ENDPOINT_PRIMARY = "/register";
const REGISTER_ENDPOINT_FALLBACK = "/registerAndLogin";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // deep-link: /join?mode=signup
  const initialMode = useMemo(() => {
    const m = new URLSearchParams(location.search).get("mode");
    return m === "signup" ? "signup" : "login";
  }, [location.search]);

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [region, setRegion] = useState(localStorage.getItem(REGION_KEY) || "global");

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // signup fields
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    localStorage.setItem(REGION_KEY, region);
  }, [region]);

  // Normalize the backend origin for postMessage origin checks
  const BACKEND_ORIGIN = useMemo(() => {
    try {
      return new URL(BASE_URL).origin;
    } catch {
      // If BASE_URL is already an origin
      return BASE_URL;
    }
  }, []);

  /* -----------------------------------------------------------------------
   * SOCIAL BUTTON SIZE / LOOK CONTROL
   * - Both Google and Microsoft share this exact class string.
   * - Width: `w-full` makes each button fill its grid cell.
   * - Height / padding: controlled by `py-2.5` and `h-[44px]`.
   * - Icon size: see <img className="h-5 w-5" /> inside each button.
   * --------------------------------------------------------------------- */
  const socialBtnClass =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 " +
    "bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50 w-full h-[44px]";

  /* -----------------------------------------------------------------------
   * GOOGLE OAUTH — STEP 2: CAPTURE THE ID TOKEN & EXCHANGE IT
   * --------------------------------------------------------------------- */

  // 2b. Exchange a Google ID token for your app's JWT
  const exchangeGoogleCredential = async (credential) => {
    if (!credential) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/google`, {
        credential,
        // optional: include region so the backend can set regional prefs
        region,
      });

      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      }
      navigate("/admin");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Google sign‑in failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2a(i). Listen for a postMessage from the popup (recommended path)
  useEffect(() => {
    const onMsg = (ev) => {
      // Only accept messages from your backend origin
      if (!ev?.data || ev.origin !== BACKEND_ORIGIN) return;
      if (ev.data.type !== "elex:google") return;

      const credential = ev.data.credential || ev.data.id_token;
      if (credential) {
        exchangeGoogleCredential(credential);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [BACKEND_ORIGIN, region]);

  // 2a(ii). Hash fallback: if backend redirected current tab with #credential=...
  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("credential=") || hash.includes("id_token=")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const cred = params.get("credential") || params.get("id_token");
      if (cred) {
        // Clean the URL before exchanging
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch {}
        exchangeGoogleCredential(cred);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  // Start Google OAuth in a popup (better UX; if blocked, fall back to full redirect)
  const handleOAuthGoogle = () => {
    const w = 480;
    const h = 640;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const features = `popup=yes,width=${w},height=${h},left=${left},top=${top}`;
    const url = `${BASE_URL}/auth/google`;

    const popup = window.open(url, "elex-google", features);
    if (popup) {
      popup.focus();
    } else {
      // if the browser blocked the popup, just redirect the full tab
      window.location.href = url;
    }
  };

  // Microsoft OAuth (placeholder; style & size match Google)
  const handleOAuthMicrosoft = () => {
    window.location.href = `${BASE_URL}/auth/microsoft`; // update when you wire MS
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/login`, { email, password, region });
      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      }
      navigate("/admin");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Could not sign in. Please check your email and password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr("");

    if (!agree) {
      setErr("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      let data;
      try {
        const res = await axios.post(`${BASE_URL}${REGISTER_ENDPOINT_PRIMARY}`, {
          name: fullName,
          email: newEmail,
          password: newPassword,
          region,
        });
        data = res.data;
      } catch {
        const res = await axios.post(`${BASE_URL}${REGISTER_ENDPOINT_FALLBACK}`, {
          email: newEmail,
          name: fullName,
        });
        data = res.data;
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      }
      navigate("/admin");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Could not create account. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-b from-white to-slate-50">
      {/* Left: form */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-6">
            <img
              src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
              alt="E‑Lex Signature"
              className="h-9 w-9 -rotate-6"
            />
            <span className="text-2xl font-bold text-slate-900">E‑Lex Signature</span>
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-slate-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-slate-600">
            {mode === "login"
              ? "Sign in to manage and send agreements."
              : "Start sending and signing secure, legally‑binding documents."}
          </p>

          {/* Region toggle */}
          <div className="mt-6 inline-flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setRegion("global")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                region === "global"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              🌐 Global
            </button>
            <button
              type="button"
              onClick={() => setRegion("wa")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                region === "wa"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              🛡️ West Africa
            </button>
          </div>
          {region === "wa" ? (
            <p className="mt-2 text-xs text-slate-500">
              AU/ECOWAS‑aligned controls. Local date formats apply (e.g. DD/MM/YYYY).
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">ESIGN/UETA and eIDAS‑ready workflows.</p>
          )}

          {/* Card */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 shadow-sm">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  mode === "login"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  mode === "signup"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {err && (
              <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="block w-full rounded-lg border-slate-300 pr-12 focus:border-purple-600 focus:ring-purple-600"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-2"
                    >
                      {showPwd ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300" />
                    Remember me
                  </label>
                  <Link to="/forgetpassword" className="text-sm text-purple-700 hover:text-purple-800">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Login"}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Social row (identical look) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={handleOAuthGoogle} className={socialBtnClass}>
                    <img
                      alt="Google"
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      className="h-5 w-5"
                    />
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={handleOAuthMicrosoft}
                    className={socialBtnClass}
                  >
                    <img
                      alt="Microsoft"
                      src="https://static-00.iconduck.com/assets.00/microsoft-azure-icon-2048x2048-1p4mxwrt.png"
                      className="h-5 w-5"
                    />
                    Continue with Microsoft
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="block w-full text-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50"
                >
                  Create Account
                </button>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  By continuing you agree to our{" "}
                  <Link to="/legal/terms" className="text-slate-700 underline decoration-slate-300 hover:text-slate-900">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/legal/privacy" className="text-slate-700 underline decoration-slate-300 hover:text-slate-900">
                    Privacy Policy
                  </Link>
                  . {region === "wa" ? "AU/ECOWAS‑aligned practices apply." : "ESIGN/UETA applies."}
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-slate-700">
                    Work email
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    autoComplete="email"
                    required
                    className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                    placeholder="you@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value.trim())}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="mt-1 block w-full rounded-lg border-slate-300 focus:border-purple-600 focus:ring-purple-600"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  I agree to the{" "}
                  <Link to="/legal/terms" className="underline decoration-slate-300 hover:text-slate-900">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/legal/privacy" className="underline decoration-slate-300 hover:text-slate-900">
                    Privacy Policy
                  </Link>
                  .
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={handleOAuthGoogle} className={socialBtnClass}>
                    <img
                      alt="Google"
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      className="h-5 w-5"
                    />
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={handleOAuthMicrosoft}
                    className={socialBtnClass}
                  >
                    <img
                      alt="Microsoft"
                      src="https://static-00.iconduck.com/assets.00/microsoft-azure-icon-2048x2048-1p4mxwrt.png"
                      className="h-5 w-5"
                    />
                    Continue with Microsoft
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="block w-full text-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>

          {/* Trust markers */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">🔒 AES‑256 at rest</span>
            <span className="inline-flex items-center gap-2">✅ ESIGN/UETA</span>
            <span className="inline-flex items-center gap-2">🇪🇺 eIDAS ready</span>
            <span className="inline-flex items-center gap-2">🌍 AU/ECOWAS aligned</span>
          </div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600" />
        <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(circle_at_20%_20%,white,transparent_30%),radial-gradient(circle_at_80%_30%,white,transparent_25%),radial-gradient(circle_at_10%_80%,white,transparent_25%)]" />
        <div className="relative h-full flex items-center justify-center p-16 text-white">
          <div className="max-w-lg">
            <div className="text-4xl font-semibold leading-tight">
              Securely sign & automate agreements
            </div>
            <p className="mt-4 text-indigo-100">
              Faster workflows, tamper‑proof audit trails, and global compliance—built in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
