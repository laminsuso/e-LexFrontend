// src/pages/careers/CareersPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const roles = [
  {
    title: "Senior Full-Stack Engineer",
    location: "Remote (US/EU time zones)",
    type: "Full-time",
    tags: ["React", "Node.js", "PostgreSQL", "AWS"],
    summary:
      "Help us build the next generation of secure e-signature workflows. You’ll architect features end-to-end, collaborate closely with design and product, and mentor fellow engineers.",
  },
  {
    title: "Product Designer",
    location: "Remote",
    type: "Full-time",
    tags: ["UX/UI", "Design Systems", "Prototyping", "Design Research"],
    summary:
      "Own design from discovery to delivery. You’ll create delightful, accessible experiences across web and mobile, and work hand-in-hand with engineering to ship great products.",
  },
  {
    title: "Customer Success Manager",
    location: "Hybrid / Remote",
    type: "Full-time",
    tags: ["Customer Advocacy", "Onboarding", "Enablement"],
    summary:
      "Be the trusted partner for our customers. Drive adoption, advocate for user needs, and ensure successful outcomes from day one.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Join the Team at E-Lex Signature
          </h1>
          <p className="mt-3 text-slate-600 max-w-3xl">
            We’re building the future of digital agreements — secure, fast, and human-centered. If you’re curious, collaborative, and excited to make an impact, you’ll fit right in.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-16">
        {/* Why E-Lex */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Mission-Driven</h3>
            <p className="text-slate-700">
              We’re on a mission to make secure digital agreements accessible to everyone. Your work will directly help teams move faster with confidence.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Remote-First</h3>
            <p className="text-slate-700">
              We’re a distributed team built on trust and outcomes. Work where you’re most productive — with flexible hours and strong async collaboration.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Growth & Impact</h3>
            <p className="text-slate-700">
              Join a team that values autonomy, continuous learning, and building with empathy. Your ideas will shape our product and culture.
            </p>
          </div>
        </section>

        {/* Open Roles */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Open Roles</h2>

          {roles.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-6 text-slate-700">
              No open roles at the moment. You can still{" "}
              <a
                href="mailto:careers@elexsignature.com?subject=General%20Interest%20—%20E-Lex%20Signature"
                className="text-purple-700 underline"
              >
                send us your resume
              </a>{" "}
              and we’ll keep you in mind for future opportunities.
            </div>
          ) : (
            <div className="grid gap-6">
              {roles.map((role) => (
                <div
                  key={role.title}
                  className="rounded-xl border border-slate-200 p-6 hover:shadow-sm transition"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{role.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100">
                          📍 {role.location}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100">
                          💼 {role.type}
                        </span>
                        {role.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-slate-700">{role.summary}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <a
                        href={`mailto:careers@elexsignature.com?subject=Application%3A%20${encodeURIComponent(
                          role.title
                        )}`}
                        className="inline-flex items-center rounded-lg bg-purple-600 text-white px-4 py-2 font-semibold hover:bg-purple-700"
                      >
                        Apply Now
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-6">
            <p className="text-slate-700">
              Don’t see the right role? We’re always excited to meet talented people.
              Send us your resume and a quick note at{" "}
              <a href="mailto:careers@elexsignature.com" className="text-purple-700 underline">
                careers@elexsignature.com
              </a>{" "}
              and tell us how you’d like to help.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Benefits & Perks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Benefit title="Competitive Compensation" desc="Market-based salary, performance bonuses, and meaningful equity." />
            <Benefit title="Remote-First Culture" desc="Work from anywhere with flexible hours and home-office support." />
            <Benefit title="Health & Wellbeing" desc="Comprehensive health coverage and wellness stipends." />
            <Benefit title="Growth Budget" desc="Annual budget for courses, certifications, and conferences." />
            <Benefit title="Time to Recharge" desc="Flexible PTO, generous holidays, and mindful work-life balance." />
            <Benefit title="Inclusive Community" desc="We’re committed to diversity, equity, and accessible design." />
          </div>
        </section>

        {/* Hiring Process */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Our Hiring Process</h2>
          <ol className="relative border-l border-slate-200 pl-6 space-y-6">
            <Step
              title="Apply"
              content="Submit your resume, portfolio (if applicable), and a brief note on why you’re excited about E-Lex."
            />
            <Step
              title="Intro Conversation"
              content="A friendly call to learn about your goals, experience, and what you’re looking for next."
            />
            <Step
              title="Skills Deep-Dive"
              content="A practical exercise or technical conversation tailored to the role."
            />
            <Step
              title="Team Interview"
              content="Meet the team, discuss your approach, and explore how we collaborate."
            />
            <Step
              title="Offer & Onboarding"
              content="We’ll walk you through the details and get you set up for success from day one."
            />
          </ol>
        </section>

        {/* Final CTA */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white">
          <h2 className="text-2xl font-semibold">Ready to build the future of e-signatures?</h2>
          <p className="mt-3 text-indigo-100 max-w-2xl">
            We’d love to meet you. Share your story and tell us what excites you.
          </p>
          <div className="mt-4">
            <a
              href="mailto:careers@elexsignature.com?subject=I%27m%20interested%20in%20joining%20E-Lex%20Signature"
              className="inline-flex items-center rounded-lg bg-white text-purple-700 px-5 py-2.5 font-semibold hover:bg-slate-100"
            >
              Email Your Resume
            </a>
          </div>
        </section>

        {/* Back links */}
        <div className="text-sm text-slate-500">
          <Link to="/" className="text-slate-700 underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Benefit({ title, desc }) {
  return (
    <div className="rounded-lg border border-slate-200 p-5">
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-slate-700">{desc}</p>
    </div>
  );
}

function Step({ title, content }) {
  return (
    <li className="ml-4">
      <div className="absolute -left-3 mt-1.5 h-2 w-2 rounded-full bg-purple-600"></div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-slate-700">{content}</p>
    </li>
  );
}
