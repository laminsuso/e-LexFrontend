// src/pages/about/AboutPage.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            About E-Lex Signature
          </h1>
          <p className="mt-3 text-slate-600 max-w-3xl">
            We’re building the future of digital agreements — secure, fast, and human-centered. From startups to global teams, we help organizations move work forward with confidence.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-16">
        {/* Mission */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Our Mission</h2>
          <p className="text-slate-700 leading-relaxed">
            At <strong>E-Lex Signature</strong>, our mission is to make secure digital agreements effortless and accessible. We’re removing friction from the signing process so teams can collaborate faster, reduce risk, and deliver a best-in-class experience to their customers.
          </p>
        </section>

        {/* What We Build */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">What We Build</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Modern E-Signatures</h3>
              <p className="text-slate-700">
                Fast, intuitive signing flows that eliminate paper, reduce manual work, and help you close deals in minutes. Whether you’re sending a single document or orchestrating a multi-step workflow, we’ve got you covered.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Automated Workflows</h3>
              <p className="text-slate-700">
                Configure signer order, approvals, reminders, and conditional logic — no code required. Our platform streamlines complex processes so you can focus on outcomes, not admin.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Audit & Evidence</h3>
              <p className="text-slate-700">
                Every signature generates a tamper-evident audit trail, including timestamps, IP metadata, device context, and document hash to support compliance and enforceability.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Global-Ready by Design</h3>
              <p className="text-slate-700">
                E-Lex is built for scale and compliance: ESIGN/UETA in the U.S., eIDAS readiness in the EU, and alignment with AU/ECOWAS data-protection principles for African markets — with localization for regional date/time formats like DD/MM/YYYY in The Gambia.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Security & Compliance</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-700">
            <li><strong>Encryption by default</strong> — TLS in transit and encryption at rest.</li>
            <li><strong>Access controls</strong> — Role-based permissions, audit logs, and optional MFA.</li>
            <li><strong>Global frameworks</strong> — Supports ESIGN/UETA, eIDAS readiness, and aligns with African Union/ECOWAS data-protection principles. See our <Link to="/legal/privacy" className="text-purple-700 underline">Privacy Policy</Link> for details.</li>
          </ul>
        </section>

        {/* Who We Serve */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Who We Serve</h2>
          <p className="text-slate-700">
            From fast-growing startups to enterprise teams, we partner with organizations across industries — healthcare, legal, real estate, education, and the public sector — to deliver secure, compliant, and delightful signing experiences.
          </p>
        </section>

        {/* Values */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Our Values</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-700">
            <li><strong>Trust First:</strong> Security and privacy aren’t features — they’re foundational.</li>
            <li><strong>Clarity & Speed:</strong> Simple, intuitive experiences that save time and reduce friction.</li>
            <li><strong>Customer Obsession:</strong> We grow by listening, learning, and delivering measurable value.</li>
            <li><strong>Global Mindset:</strong> We design for diverse teams and regulatory environments.</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
          <h2 class Obviously Bold>Ready to accelerate your agreements?</h2>
          <p className="mt-2 max-w-2xl text-indigo-100">
            Explore how E-Lex can streamline your workflows, strengthen compliance, and elevate customer trust.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={localStorage.getItem("user") ? "/admin" : "/login"}
              className="inline-flex items-center rounded-lg bg-white text-purple-700 px-5 py-2.5 font-semibold hover:bg-slate-100"
            >
              Get Started
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-lg ring-1 ring-white/60 px-5 py-2.5 hover:bg-white/10"
            >
              Contact Us
            </Link>
          </div>
        </section>

        {/* Legal Links */}
        <div className="text-sm text-slate-500">
          <span className="mr-3">Looking for legal docs?</span>
          <Link to="/legal/terms" className="text-slate-700 underline">
            Terms of Service
          </Link>
          <span className="mx-2">•</span>
          <Link to="/legal/privacy" className="text-slate-700 underline">
            Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
