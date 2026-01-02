import axios from "axios";
import Header from "./component/header";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { BASE_URL } from "./baseUrl";

export default function Contact() {
  const [state, setState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    phoneNumber: "",
    topic: "Support", // ✅ NEW
  });

  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) =>
    setState((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

  const validate = () => {
    if (!state.firstName.trim()) return "Please enter first name";
    if (!state.lastName.trim()) return "Please enter last name";
    if (!state.email.trim()) return "Please enter email";
    if (!state.phoneNumber.trim()) return "Please enter phone number";
    if (!state.message.trim()) return "Please enter message";
    return null;
  };

  const sendMail = async (e) => {
    e.preventDefault();

    const errorMsg = validate();
    if (errorMsg) {
      toast.error(errorMsg, { containerId: "contactUs" });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        firstName: state.firstName.trim(),
        lastName: state.lastName.trim(),
        email: state.email.trim(),
        phoneNumber: state.phoneNumber.trim(),
        message: state.message.trim(),
        topic: state.topic, // ✅ NEW (backend can ignore if not used)
      };

      const response = await axios.post(`${BASE_URL}/contactus`, payload);
      toast.success(response.data.message || "Message sent successfully", {
        containerId: "contactUs",
      });

      setState({
        firstName: "",
        lastName: "",
        email: "",
        message: "",
        phoneNumber: "",
        topic: "Support",
      });
    } catch (e2) {
      toast.error(e2?.response?.data?.error || "Something went wrong please try again", {
        containerId: "contactUs",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer containerId={"contactUs"} />

      <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
        <div className="lg:px-16 lg:pt-12 px-6 py-10">
          <Header />

          <div className="max-w-6xl mx-auto mt-10">
            {/* Hero */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold">
                    <span>✉️</span>
                    Contact E-Lex
                  </div>

                  <h1 className="mt-5 text-3xl lg:text-4xl font-extrabold tracking-tight">
                    How can we help?
                  </h1>

                  <p className="mt-3 text-slate-600 text-base lg:text-lg max-w-2xl">
                    Reach out to Support, Billing, or Sales. We’ll respond within 24 hours.
                  </p>

                  <div className="mt-6 grid sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold">🔒 Secure</div>
                      <div className="text-sm text-slate-600">Your message is encrypted in transit.</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold">⚡ Fast response</div>
                      <div className="text-sm text-slate-600">Typically within 1 business day.</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold">🧾 Billing help</div>
                      <div className="text-sm text-slate-600">Plans, upgrades, invoices.</div>
                    </div>
                  </div>
                </div>

                {/* Quick contact card */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-6 w-full lg:w-[360px] shadow-sm">
                  <div className="text-lg font-bold">Prefer email?</div>
                  <p className="mt-2 text-sm text-white/90">
                    Send us a note and include your account email.
                  </p>
                  <div className="mt-4 text-sm font-semibold break-words">
                    support@elexsignature.com
                  </div>
                  <div className="mt-6 text-xs text-white/80">
                    Tip: Include a screenshot if you’re reporting a bug.
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="mt-8 grid lg:grid-cols-5 gap-8">
              {/* Left: form */}
              <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white shadow-sm p-8">
                <h2 className="text-2xl font-bold">Send a message</h2>
                <p className="text-slate-600 mt-1">
                  Fill out the form and we’ll get back to you soon.
                </p>

                <form onSubmit={sendMail} className="mt-8 space-y-6">
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Topic
                    </label>
                    <select
                      value={state.topic}
                      onChange={setField("topic")}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option>Support</option>
                      <option>Billing</option>
                      <option>Sales</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        First Name *
                      </label>
                      <input
                        value={state.firstName}
                        onChange={setField("firstName")}
                        type="text"
                        placeholder="First name"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        value={state.lastName}
                        onChange={setField("lastName")}
                        type="text"
                        placeholder="Last name"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Email/Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email *
                      </label>
                      <input
                        value={state.email}
                        onChange={setField("email")}
                        type="email"
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        value={state.phoneNumber}
                        onChange={setField("phoneNumber")}
                        type="tel"
                        placeholder="+220 (555) 000-0000"
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={state.message}
                      onChange={setField("message")}
                      rows={6}
                      placeholder="Describe your issue or request. Include steps to reproduce if reporting a bug."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      Please don’t include passwords or sensitive personal information.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full rounded-xl px-5 py-3 font-semibold text-white shadow-sm transition ${
                      submitting
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {submitting ? "Sending…" : "Send message"}
                  </button>
                </form>
              </div>

              {/* Right: “What to include” */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm p-8">
                <h3 className="text-xl font-bold">To help us resolve faster</h3>
                <ul className="mt-4 space-y-3 text-slate-700">
                  <li className="flex gap-3">
                    <span className="mt-0.5">✅</span>
                    <span>
                      Your account email (the one you use to sign in)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">✅</span>
                    <span>
                      Document name / Envelope ID if applicable
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">✅</span>
                    <span>
                      A screenshot of the error (no sensitive data)
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5">✅</span>
                    <span>
                      Steps to reproduce (what you clicked)
                    </span>
                  </li>
                </ul>

                <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200 p-5">
                  <div className="font-semibold">For urgent billing issues</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Select “Billing” as the topic so we route it faster.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer spacing */}
            <div className="h-10" />
          </div>
        </div>
      </div>
    </>
  );
}
