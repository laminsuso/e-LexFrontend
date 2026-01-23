// src/App.js
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
//import Transparent from "./images/Transparent.png";

function LandingHome() {
  return (
    <>
      {/* HERO (2-column on desktop + product mock) */}
      <section className="hero relative py-10 md:py-16 overflow-hidden">
        <div className="hero-bg-pattern"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* LEFT: copy */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tighter">
                Securely <span className="gradient-text">Sign & Automate</span>
                <br className="hidden md:block" /> Agreements in Minutes
              </h1>

              <p className="mt-4 md:mt-5 max-w-2xl lg:max-w-none text-lg md:text-xl text-slate-600">
                E-Lex Signature helps teams send, sign, and track agreements with audit trails,
                templates, signing order, and transparent pricing.
              </p>

              <div className="mt-6 flex justify-center lg:justify-start items-center gap-3 md:gap-4 flex-wrap">
                <a
                  href={localStorage.getItem("user") ? "/admin" : "/join"}
                  className="bg-purple-600 text-white px-7 py-3.5 rounded-lg font-semibold text-lg shadow-lg hover:bg-purple-700 cta-button-primary"
                >
                  Get Started
                </a>
                <a
                  href="/contact"
                  className="bg-white text-slate-700 px-7 py-3.5 rounded-lg font-semibold text-lg shadow-md border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Request a Demo
                </a>
              </div>

              {/* Trust strip (no over-claims; only what you can support today) */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start text-sm text-slate-600">
                <span className="px-3 py-1 bg-white/70 border border-slate-200 rounded-full">
                  Audit trail + Certificate
                </span>
                <span className="px-3 py-1 bg-white/70 border border-slate-200 rounded-full">
                  Signing order
                </span>
                <span className="px-3 py-1 bg-white/70 border border-slate-200 rounded-full">
                  Templates
                </span>
                <span className="px-3 py-1 bg-white/70 border border-slate-200 rounded-full">
                  Delegate signer
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Encryption in transit & at rest • Cancel anytime • Transparent pricing
              </p>
            </div>

            {/* RIGHT: product mock */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Documents</div>
                  <div className="text-xs text-slate-500">Live status</div>
                </div>

                <div className="p-4 space-y-3">
                  {[
                    { name: "Engagement Letter", status: "Completed", tone: "bg-green-50 text-green-700 border-green-200" },
                    { name: "NDA - Vendor", status: "In progress", tone: "bg-amber-50 text-amber-700 border-amber-200" },
                    { name: "Offer Letter", status: "Needs your sign", tone: "bg-blue-50 text-blue-700 border-blue-200" },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{d.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Audit trail included</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${d.tone}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t">
                  <div className="text-sm font-semibold text-slate-900">Send → Sign → Download</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Certificate of completion included for every completed envelope.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HOW IT WORKS (DocuSign-style strip) */}
          <div className="mt-10">
            <div className="max-w-5xl mx-auto bg-white/80 border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">How it works</div>
                  <div className="text-sm text-slate-600">Four steps from upload to completion.</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                  {[
                    { n: "1", t: "Upload PDF" },
                    { n: "2", t: "Add recipients" },
                    { n: "3", t: "Place fields" },
                    { n: "4", t: "Send & track" },
                  ].map((s) => (
                    <div key={s.n} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center">
                        {s.n}
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{s.t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compact benefit band (kept, tightened text) */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-slate-200 shadow-sm">
              <div className="h-9 w-9 shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Legally binding workflows</p>
                <p className="text-slate-600 text-sm">Designed for ESIGN/UETA-style e-sign flows with audit trails.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-slate-200 shadow-sm">
              <div className="h-9 w-9 shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20Zm1 5a1 1 0 10-2 0v5a1 1 0 00.553.894l3 1.5a1 1 0 10.894-1.788L13 11.382V7Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Faster turnaround</p>
                <p className="text-slate-600 text-sm">Templates, signing order, reminders, and reusable envelopes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-slate-200 shadow-sm">
              <div className="h-9 w-9 shrink-0 rounded-full bg-purple-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3l8 4v5c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V7l8-4zm0 3.236L7 7.618v4.382c0 3.905 2.69 7.61 5 8.066 2.31-.456 5-4.161 5-8.066V7.618L12 6.236z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Security-first</p>
                <p className="text-slate-600 text-sm">Encryption in transit & at rest with tamper-evident records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMS (tighter) */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Stop losing time to paperwork</h2>
            <p className="mt-3 text-lg text-slate-600">
              Manual signing slows deals, creates follow-up churn, and makes compliance harder than it should be.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-center items-center h-14 w-14 mx-auto bg-rose-100 rounded-full">
                <svg className="h-7 w-7 text-rose-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Risk & uncertainty</h3>
              <p className="mt-2 text-slate-600 text-sm">You need a clear audit trail and tamper-evident completion records.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-center items-center h-14 w-14 mx-auto bg-amber-100 rounded-full">
                <svg className="h-7 w-7 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Slow follow-ups</h3>
              <p className="mt-2 text-slate-600 text-sm">Chasing signatures delays revenue and adds operational overhead.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex justify-center items-center h-14 w-14 mx-auto bg-purple-100 rounded-full">
                <svg className="h-7 w-7 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.87H8.25a3.375 3.375 0 00-3.285 2.87l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m15.562 0a2.25 2.25 0 01-2.25 2.25h-13.125a2.25 2.25 0 01-2.25-2.25m17.625 0L16.5 12.75M4.125 17.25L7.5 12.75m0 0l3.75 4.5M7.5 12.75l3.75-4.5M16.5 12.75l-3.75 4.5m3.75-4.5l-3.75-4.5M12 17.25v.007" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Unclear pricing</h3>
              <p className="mt-2 text-slate-600 text-sm">Plans should be simple, predictable, and easy to upgrade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES (more scannable) */}
      <section id="features" className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything you need to send and sign</h2>
            <p className="mt-3 text-lg text-slate-600">
              A clean signing experience for recipients — plus tools for senders to manage workflows.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Send & collect signatures</h3>
              </div>
              <ul className="mt-4 space-y-3 text-slate-700 text-sm">
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Drag-and-drop fields (signature, date, initials, text)</li>
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Signing order (invite by turn)</li>
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Delegation (reassign signer)</li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3l8 4v5c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V7l8-4zm0 3.236L7 7.618v4.382c0 3.905 2.69 7.61 5 8.066 2.31-.456 5-4.161 5-8.066V7.618L12 6.236z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Audit & proof</h3>
              </div>
              <ul className="mt-4 space-y-3 text-slate-700 text-sm">
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Certificate of completion</li>
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Tamper-evident history</li>
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Download combined PDF or ZIP</li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Manage at scale</h3>
              </div>
              <ul className="mt-4 space-y-3 text-slate-700 text-sm">
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Templates & reuse</li>
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Search across document lists</li>
                <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span> Role-based recipient assignment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENCE (over-claims removed) */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="pr-0 md:pr-8">
              <span className="text-purple-600 font-semibold">THE E-LEX SIGNATURE DIFFERENCE</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900">
                Clear pricing. Fast workflows. Real proof.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                We focus on what teams need: simple sending, smooth signing, and completion records you can trust.
              </p>

              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Transparent & flexible</h4>
                    <p className="text-slate-600">No confusing add-ons. Easy upgrades. Cancel anytime.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Sender controls</h4>
                    <p className="text-slate-600">Signing order, delegation, and structured tracking.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full">✓</div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Built-in proof</h4>
                    <p className="text-slate-600">Audit trail + certificate of completion for completed documents.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-6 md:p-7 rounded-2xl overflow-hidden relative">
  <div className="mx-auto max-w-[460px] bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
    <div className="p-4 border-b flex items-center justify-between">
      <div className="font-semibold text-slate-900">Plan overview</div>
      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
        Transparent
      </span>
    </div>

    <div className="p-4 space-y-3">
      {[
        { t: "Personal", d: "For individuals & freelancers" },
        { t: "Standard", d: "For growing teams" },
        { t: "Business", d: "For departments & orgs" },
      ].map((x) => (
        <div key={x.t} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="font-semibold text-slate-900">{x.t}</div>
          <div className="text-sm text-slate-600">{x.d}</div>
        </div>
      ))}
    </div>

    <div className="p-4 bg-slate-50 border-t text-sm text-slate-600">
      Upgrade anytime • Cancel anytime • Clear limits
    </div>
  </div>
</div>

          </div>
        </div>
      </section>

      {/* USE CASES (kept) */}
      <section id="use-cases" className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Powering every department</h2>
            <p className="mt-3 text-lg text-slate-600">
              From sales agreements to HR onboarding, E-Lex Signature streamlines document workflows across your organization.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
            {[
              { emoji: "📈", title: "Sales Contracts", tone: "bg-purple-100" },
              { emoji: "🤝", title: "HR Onboarding", tone: "bg-cyan-100" },
              { emoji: "⚖️", title: "Legal Compliance", tone: "bg-emerald-100" },
              { emoji: "🏠", title: "Real Estate", tone: "bg-amber-100" },
              { emoji: "🛒", title: "Procurement", tone: "bg-rose-100" },
            ].map((u) => (
              <div key={u.title} className="p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                <div className={`flex justify-center items-center h-16 w-16 mx-auto ${u.tone} rounded-full`}>
                  <span className="text-3xl">{u.emoji}</span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{u.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA (improved) */}
      <section className="bg-white">
        <div className="container mx-auto px-6 py-12 md:py-16">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute -bottom-14 -left-14 w-56 h-56 bg-white/10 rounded-full" />
            <div className="absolute -top-20 -right-16 w-64 h-64 bg-white/10 rounded-full" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to send your next agreement?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-indigo-100">
                Upload a PDF, add recipients, place fields, and send — with tracking and a completion certificate built in.
              </p>

              <div className="mt-7 flex justify-center items-center gap-3 md:gap-4 flex-wrap">
                <a
                  href={localStorage.getItem("user") ? "/admin" : "/join"}
                  className="bg-white text-purple-700 px-7 py-3.5 rounded-lg font-semibold text-lg shadow-lg hover:bg-slate-100 transition-colors"
                >
                  Get Started
                </a>
                <a
                  href="/contact"
                  className="bg-white/10 text-white px-7 py-3.5 rounded-lg font-semibold text-lg shadow-md border border-white/25 hover:bg-white/15 transition-colors"
                >
                  Request a Demo
                </a>
              </div>

              <p className="mt-4 text-sm text-indigo-100/90">
                No lock-in • Upgrade anytime • Transparent plans
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function App() {
  //const [me, setMe] = useState(null);
  const [me, setMe] = useState({ user: null, profile: null });

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    setMe({ user: null, profile: null });
    setAuthChecked(true);
    return;
  }

  (async () => {
    try {
      const res = await api.get("/getUser");

      const user = res.data?.user || null;
      const profile = res.data?.profile || null;

      setMe({ user, profile });

      // Keep userEmail for your filters and needsign page
      const email = user?.email || profile?.email;
      if (email) localStorage.setItem("userEmail", email);
    } catch {
      setMe({ user: null, profile: null });
    } finally {
      setAuthChecked(true);
    }
  })();
}, []);

  const displayName =
  me?.profile?.name ||
  me?.user?.name ||
  me?.user?.fullName ||
  (me?.user?.email ? me.user.email.split("@")[0] : null);

  const isLoggedIn = !!displayName; // requires confirmed user
  const getStartedHref = isLoggedIn ? "/admin" : "/join?mode=signup&next=%2Fadmin";

  return (
    <div className="landing-tight max-w-[1440px] mx-auto">
      {/* HEADER (kept global so it also appears on legal pages) */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
              alt="E- Lex Signature Logo"
              className="h-8 w-8 transform -rotate-6"
            />
            <span className="text-2xl font-bold text-slate-900">
              E-Lex Signature
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-slate-600 hover:text-purple-600 transition-colors">
              Home
            </a>
            <a href="/pricing" className="text-slate-600 hover:text-purple-600 transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {/* ✅ Replace Log In with user's name when logged in */}
            {authChecked && isLoggedIn ? (
              <a
                href="/admin"
                className="hidden sm:block text-slate-700 font-semibold hover:text-purple-600 transition-colors"
                title={me?.email || ""}
              >
                {displayName}
              </a>
            ) : (
              <a
                href="/join?mode=login&next=%2Fadmin"
                className="hidden sm:block text-slate-600 font-medium hover:text-purple-600 transition-colors"
              >
                Log In
              </a>
            )}

            <a
              href={getStartedHref}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-purple-700 cta-button-primary"
            >
              {authChecked && isLoggedIn ? "Dashboard" : "Get started"}
            </a>
          </div>
        </div>
      </header>

      {/* ROUTES: landing (/) + legal pages */}
      <Routes>
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/" element={<LandingHome />} />
      </Routes>

      {/* FOOTER (global) — unchanged */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
                  alt="E-Lex Signature"
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold text-white">E-Lex Signature</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                The future of secure digital agreements.
                Sign, send, and manage legally binding documents anywhere.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Use Cases
              </h4>
              <ul className="space-y-3 text-sm">
                <li>Sales Agreements</li>
                <li>HR Onboarding</li>
                <li>Legal Contracts</li>
                <li>Real Estate Documents</li>
                <li>NDAs & Compliance</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Why E-Lex
              </h4>
              <ul className="space-y-3 text-sm">
                <li>Secure & Encrypted</li>
                <li>Audit Trails Included</li>
                <li>ESIGN & eIDAS Ready</li>
                <li>Built for Global & African Markets</li>
                <li>Paperless by Design</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/about" className="hover:text-white">About Us</a></li>
                <li><a href="/careers" className="hover:text-white">Careers</a></li>
                <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} E-Lex Signature, Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/legal/terms" className="hover:text-white">Terms</a>
              <a href="/legal/privacy" className="hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


// function App() {
//   return (
//     <div className="landing-tight max-w-[1440px] mx-auto">
//       {/* HEADER (kept global so it also appears on legal pages) */}
//       <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
//         <div className="container mx-auto px-6 py-4 flex justify-between items-center">
//           <div className="flex items-center space-x-3">
//             <img
//               src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
//               alt="E- Lex Signature Logo"
//               className="h-8 w-8 transform -rotate-6"
//             />
//             <span className="text-2xl font-bold text-slate-900">
//               E-Lex Signature
//             </span>
//           </div>
//           <nav className="hidden md:flex items-center space-x-8">
//             <a href="/" className="text-slate-600 hover:text-purple-600 transition-colors">Home</a>
//             <a href="/pricing" className="text-slate-600 hover:text-purple-600 transition-colors">Pricing</a>
//           </nav>
//           <div className="flex items-center space-x-4">
//             <a href="/join" className="hidden sm:block text-slate-600 font-medium hover:text-purple-600 transition-colors">Log In</a>
//             <a
//               href={localStorage.getItem("user") ? "/admin" : "/join"}
//               className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-purple-700 cta-button-primary"
//             >
//               Get started
//             </a>
//           </div>
//         </div>
//       </header>

//       {/* ROUTES: landing (/) + legal pages */}
//       <Routes>
//         <Route path="/legal/terms" element={<TermsPage />} />
//         <Route path="/legal/privacy" element={<PrivacyPage />} />
//         <Route path="/" element={<LandingHome />} />
//         {/* Optional: fallback to landing for unknown paths */}
//         {/* <Route path="*" element={<LandingHome />} /> */}
//       </Routes>

//       {/* FOOTER (global) — unchanged */}
//       <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300">
//         <div className="max-w-7xl mx-auto px-6 py-16">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
//             {/* Brand */}
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 <img
//                   src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png"
//                   alt="E-Lex Signature"
//                   className="h-8 w-8"
//                 />
//                 <span className="text-xl font-bold text-white">E-Lex Signature</span>
//               </div>
//               <p className="text-sm text-slate-400 leading-relaxed">
//                 The future of secure digital agreements.
//                 Sign, send, and manage legally binding documents anywhere.
//               </p>
//             </div>

//             {/* Use Cases */}
//             <div>
//               <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
//                 Use Cases
//               </h4>
//               <ul className="space-y-3 text-sm">
//                 <li>Sales Agreements</li>
//                 <li>HR Onboarding</li>
//                 <li>Legal Contracts</li>
//                 <li>Real Estate Documents</li>
//                 <li>NDAs & Compliance</li>
//               </ul>
//             </div>

//             {/* Why E-Lex */}
//             <div>
//               <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
//                 Why E-Lex
//               </h4>
//               <ul className="space-y-3 text-sm">
//                 <li>Secure & Encrypted</li>
//                 <li>Audit Trails Included</li>
//                 <li>ESIGN & eIDAS Ready</li>
//                 <li>Built for Global & African Markets</li>
//                 <li>Paperless by Design</li>
//               </ul>
//             </div>

//             {/* Company */}
//             <div>
//               <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
//                 Company
//               </h4>
//               <ul className="space-y-3 text-sm">
//                 <li><a href="/about" className="hover:text-white">About Us</a></li>
//                 <li><a href="/careers" className="hover:text-white">Careers</a></li>
//                 <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
//                 <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
//               </ul>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
//             <p>© {new Date().getFullYear()} E-Lex Signature, Inc. All rights reserved.</p>
//             <div className="flex gap-6 mt-4 md:mt-0">
//               <a href="/legal/terms" className="hover:text-white">Terms</a>
//               <a href="/legal/privacy" className="hover:text-white">Privacy</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

export default App;
