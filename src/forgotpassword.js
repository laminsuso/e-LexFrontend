import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import img from "./images/reset-illustration.png";
import { api } from "./api"; // ✅ uses your interceptor baseURL + auth handling (even though this endpoint doesn't require auth)

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const cleanedEmail = useMemo(() => (email || "").trim().toLowerCase(), [email]);

  const isValidEmail = (value) => {
    // Simple email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const sendPasswordResetLink = async () => {
    if (!cleanedEmail) {
      toast.error("Please enter your email.", { containerId: "forget-password" });
      return;
    }
    if (!isValidEmail(cleanedEmail)) {
      toast.error("Please enter a valid email address.", { containerId: "forget-password" });
      return;
    }

    try {
      setSending(true);

      const res = await api.post("/sendPasswordResetLinks", { email: cleanedEmail });

      toast.success(res?.data?.message || "If this email exists, we sent a reset link.", {
        containerId: "forget-password",
      });

      setEmail("");
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        "Unable to send reset email. Please try again.";
      toast.error(msg, { containerId: "forget-password" });
      console.error("Forgot password error:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <ToastContainer containerId={"forget-password"} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Brand */}
          <a href="/" className="inline-flex items-center gap-2 text-slate-900 font-bold">
            <img
              className="h-8 w-8"
              src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
              alt="logo"
            />
            <span className="text-xl">E-Lex Signature</span>
          </a>

          <div className="mt-8 grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h1 className="text-3xl font-extrabold text-slate-900">
                Reset your password
              </h1>
              <p className="mt-2 text-slate-600">
                Enter your email and we’ll send you a password reset link.
              </p>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoComplete="email"
                />

                <div className="mt-3 text-xs text-slate-500">
                  Tip: Check spam/junk folders. If you use a corporate email, your IT filters may block automated emails.
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={sendPasswordResetLink}
                  disabled={sending}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white ${
                    sending ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {sending && (
                    <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                  )}
                  {sending ? "Sending..." : "Send reset link"}
                </button>

                <Link
                  to="/join?mode=login&next=%2Fadmin"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Back to login
                </Link>
              </div>

              <div className="mt-6 text-sm text-slate-600">
                Don’t have an account?{" "}
                <Link to="/join?mode=signup&next=%2Fadmin" className="text-purple-700 font-semibold hover:underline">
                  Create one
                </Link>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="hidden lg:flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <img src={img} alt="Reset password" className="w-full max-w-[520px]" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
