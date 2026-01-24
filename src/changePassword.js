import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { api } from "./api"; // ✅ uses BASE_URL + interceptor; safer and consistent

// ---------- Password strength helper ----------
function scorePassword(pw = "") {
  const s = pw || "";
  if (!s) return { score: 0, label: "Empty", tips: ["Enter a password."] };

  let score = 0;
  const tips = [];

  // Length
  if (s.length >= 8) score += 1;
  else tips.push("Use at least 8 characters.");

  if (s.length >= 12) score += 1;

  // Variety
  const hasLower = /[a-z]/.test(s);
  const hasUpper = /[A-Z]/.test(s);
  const hasNum = /\d/.test(s);
  const hasSym = /[^A-Za-z0-9]/.test(s);

  const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
  if (variety >= 2) score += 1;
  else tips.push("Add a mix of letters and numbers.");

  if (variety >= 3) score += 1;
  else if (variety === 2) tips.push("Add a symbol or uppercase letter for extra strength.");

  // Common weak patterns
  const lower = s.toLowerCase();
  const common = ["password", "123456", "qwerty", "admin", "letmein"];
  if (common.some((w) => lower.includes(w))) {
    score = Math.max(0, score - 1);
    tips.push("Avoid common words like “password” or “admin”.");
  }

  // Clamp 0..4
  score = Math.max(0, Math.min(4, score));

  const label =
    score <= 1 ? "Weak" :
    score === 2 ? "Fair" :
    score === 3 ? "Good" :
    "Strong";

  return { score, label, tips };
}

function barClass(score, idx) {
  const active = idx <= score;
  if (!active) return "bg-slate-200";
  if (score <= 1) return "bg-red-500";
  if (score === 2) return "bg-amber-500";
  if (score === 3) return "bg-blue-500";
  return "bg-emerald-500";
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const params = useParams();

  // URL format: /changepassword/:email
  const email = useMemo(() => {
    const raw = params?.email || "";
    try {
      return decodeURIComponent(raw).trim().toLowerCase();
    } catch {
      return raw.trim().toLowerCase();
    }
  }, [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;

  const handleSubmit = async () => {
    toast.dismiss();

    if (!email) {
      toast.error("Reset link is missing an email.", { containerId: "changePassword" });
      return;
    }
    if (!password) {
      toast.error("Please enter a new password.", { containerId: "changePassword" });
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.", { containerId: "changePassword" });
      return;
    }
    if (!confirm) {
      toast.error("Please confirm your new password.", { containerId: "changePassword" });
      return;
    }
    if (password !== confirm) {
      toast.error("Password and confirm password don't match.", { containerId: "changePassword" });
      return;
    }
    if (strength.score < 2) {
      toast.error("Please choose a stronger password.", { containerId: "changePassword" });
      return;
    }

    try {
      setSaving(true);

      // ✅ your backend expects: POST /resetPassword { email, password }
      await api.post("/resetPassword", { email, password });

      setPassword("");
      setConfirm("");
      setDone(true);

      toast.success("Password updated successfully.", { containerId: "changePassword" });
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        "Something went wrong. Please try again.";
      toast.error(msg, { containerId: "changePassword" });
      console.error("Reset password error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ToastContainer containerId={"changePassword"} />

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
              {!done ? (
                <>
                  <h1 className="text-3xl font-extrabold text-slate-900">
                    Create a new password
                  </h1>
                  <p className="mt-2 text-slate-600">
                    Choose a strong password you don’t use elsewhere.
                  </p>

                  <div className="mt-4 text-sm text-slate-600">
                    Resetting password for{" "}
                    <span className="font-semibold text-slate-900">{email || "unknown email"}</span>
                  </div>

                  {/* New password */}
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New password
                    </label>

                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        title={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {/* Strength meter */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-600">
                          Strength: <span className="text-slate-900">{strength.label}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {password.length ? `${password.length} chars` : ""}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((idx) => (
                          <div key={idx} className={`h-2 rounded-full ${barClass(strength.score, idx)}`} />
                        ))}
                      </div>

                      {strength.tips?.length > 0 && (
                        <ul className="mt-2 text-xs text-slate-500 list-disc pl-5 space-y-1">
                          {strength.tips.slice(0, 2).map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm new password
                    </label>

                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        title={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {confirm.length > 0 && (
                      <div className={`mt-2 text-xs font-semibold ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </div>
                    )}
                  </div>

                  <div className="mt-7 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white ${
                        saving ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      {saving && (
                        <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                      )}
                      {saving ? "Updating..." : "Update password"}
                    </button>

                    <Link
                      to="/join?mode=login&next=%2Fadmin"
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Back to login
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold text-slate-900">
                    Password updated
                  </h1>
                  <p className="mt-2 text-slate-600">
                    Your password has been changed successfully. You can now log in with your new password.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate("/join?mode=login&next=%2Fadmin")}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Go to login
                    </button>

                    <a
                      href="/"
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Back to home
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Right illustration (optional) */}
            <div className="hidden lg:flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <img
                src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
                alt="Reset"
                className="w-full max-w-[520px] opacity-10"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
