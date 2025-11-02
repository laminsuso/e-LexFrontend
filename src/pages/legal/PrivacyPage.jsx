import React from "react";
import { Link } from "react-router-dom";

/** --- Configure these per release --- */
const EFFECTIVE_DATE = "November 1, 2025";
const LAST_UPDATED = "November 1, 2025";
const ORG_LEGAL_NAME = "E Lex Signature, Inc.";   // “Inc.” or “LLC”
const ORG_ADDRESS = "[address]";                  // your principal place of business
const DPO_EMAIL = "[dpo@elexsignature.com]";      // leave as-is if not appointed

export default function PrivacyPage() {
  const toc = [
    ["1) Roles; scope", "#roles-scope"],
    ["2) Information we collect", "#info-we-collect"],
    ["3) How we use information", "#purposes-legal-bases"],
    ["4) Cookies & tracking", "#cookies"],
    ["5) Sharing of information", "#sharing"],
    ["6) International data transfers", "#transfers"],
    ["7) Security", "#security"],
    ["8) Retention", "#retention"],
    ["9) Your rights", "#your-rights"],
    ["10) Children", "#children"],
    ["11) Marketing choices", "#marketing-choices"],
    ["12) Controller/Processor details; DPA", "#controller-processor"],
    ["13) Changes to this Policy", "#changes"],
    ["14) Contact", "#contact"],
    ["Regional Compliance — Africa (incl. The Gambia)", "#regional-africa"],
    ["Local Date/Time & Audit Metadata", "#local-date-audit"],
    ["Implementation tips (quick checklist)", "#implementation-tips"],
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12 md:py-16 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            E&nbsp;Lex Signature<span className="align-super text-sm">™</span> — Privacy Policy
          </h1>
          <p className="mt-2 text-slate-600">
            <span className="font-medium">Effective date:</span> {EFFECTIVE_DATE} &nbsp;&nbsp;|&nbsp;&nbsp;
            <span className="font-medium">Last updated:</span> {LAST_UPDATED}
          </p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              This Privacy Policy describes how {ORG_LEGAL_NAME} (“E Lex,” “we,” “us”) collects, uses, and shares
              personal data when you visit our sites, create an account, send or sign documents, or otherwise use
              our services (the “Services”). See also our{" "}
              <Link to="/legal/terms" className="text-purple-700 hover:underline">
                Terms of Service
              </Link>.
            </p>
          </div>
        </header>

        {/* Table of contents */}
        <nav className="mb-10">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">On this page</h2>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            {toc.map(([label, href]) => (
              <li key={href}>
                <a href={href} className="hover:text-purple-700 hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Body */}
        <section className="prose prose-slate max-w-none">
          <h2 id="roles-scope">1) Roles; scope</h2>
          <ul>
            <li>
              For our own website, billing, product analytics, support, and marketing, E Lex is a{" "}
              <strong>data controller</strong>.
            </li>
            <li>
              When subscribers upload documents and invite recipients, E Lex acts as a{" "}
              <strong>data processor</strong> on behalf of the subscriber (the customer), and the customer is the
              controller of recipient/signing data. Our processing is governed by the Terms and any applicable{" "}
              Data Processing Addendum (DPA).
            </li>
          </ul>
          <p className="text-sm text-slate-600">
            If you are a signer and have questions about a document sent to you, contact the <strong>sender</strong> first.
          </p>

          <h2 id="info-we-collect">2) Information we collect</h2>
          <p className="!mt-0"><strong>Account &amp; contact data.</strong> Name, email, organization, role, password hashes, phone, addresses, preferences.</p>
          <p><strong>Transactional data.</strong> Subscription plan, invoices, partial card details (via our payment processor), tax information.</p>
          <p>
            <strong>Document &amp; signing data (processor).</strong> Uploaded files, fields (e.g., signature/image/date/text),
            role assignments, signing order, status, audit logs (timestamps, IP address, user agent/device metadata,
            locale, time zone, and—if you or your device choose to share—approximate location coordinates), and message
            delivery metadata.
          </p>
          <p><strong>Communications.</strong> Support tickets, feedback, and email/SMS content we send to you.</p>
          <p>
            <strong>Usage &amp; device data.</strong> Log data (pages, events, error reports), cookie identifiers, approximate
            location (derived from IP), and basic device info (browser type, OS).
          </p>
          <p><strong>Marketing data.</strong> Your preferences and interactions with our campaigns.</p>
          <p>
            <strong>Sensitive data.</strong> We do not require special category data. If you place sensitive data (e.g., health,
            financial, ID numbers) in documents, you instruct us to process it solely to provide the Services.
          </p>

          <h2 id="purposes-legal-bases">3) How we use information (purposes &amp; legal bases)</h2>
          <ul>
            <li>
              Provide and secure the Services (create accounts, route invitations, render previews, stamp signatures,
              maintain audit logs, enforce signing order, troubleshoot, prevent abuse). <em>(Contract; Legitimate interests;
              Processor instructions)</em>
            </li>
            <li>
              Communicate with you about your account, updates, and service notices. <em>(Contract; Legitimate interests;
              Consent for certain communications)</em>
            </li>
            <li>Billing &amp; payments. <em>(Contract; Legal obligation)</em></li>
            <li>Improve the Services (analytics, testing, quality assurance). <em>(Legitimate interests)</em></li>
            <li>Comply with law and enforce our Terms; protect rights, safety, and security. <em>(Legal obligation; Legitimate interests)</em></li>
          </ul>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            We <strong>do not</strong> sell personal information and we <strong>do not</strong> use customer document contents to train
            generalized AI models.
          </div>

          <h2 id="cookies">4) Cookies &amp; tracking</h2>
          <p>We use cookies and similar technologies:</p>
          <ul>
            <li><strong>Necessary</strong> (authentication, security, load balancing)</li>
            <li><strong>Preferences</strong> (e.g., language)</li>
            <li><strong>Analytics</strong> (product usage, performance)</li>
          </ul>
          <p>
            You can manage cookies in your browser. If you are in a jurisdiction that requires consent, we display a banner.
          </p>

          <h2 id="sharing">5) Sharing of information</h2>
          <p>We share data with:</p>
          <ul>
            <li>
              <strong>Service providers</strong> acting on our behalf (hosting/CDN/storage, email/SMS/WhatsApp delivery,
              payments, analytics, customer support). Examples include [Cloud provider], Cloudinary (document storage/processing),
              email providers (e.g., Gmail/Mailgun), Twilio (SMS/WhatsApp), and [Stripe] (payments).
            </li>
            <li><strong>Your organization</strong> (if you use a work account, admins can access data tied to the organization).</li>
            <li><strong>Recipients you designate</strong> (e.g., when routing documents and final copies).</li>
            <li><strong>Legal compliance and protection</strong> (court orders, to prevent harm or illegal activity).</li>
            <li><strong>Business transfers</strong> (merger, acquisition, or asset sale—your information may be transferred with notice where required).</li>
          </ul>
          <p>We do not allow providers to use personal data for their independent marketing.</p>

          <h2 id="transfers">6) International data transfers</h2>
          <p>
            We operate globally and may transfer data to countries with different data protection laws. Where required,
            we rely on approved transfer mechanisms (e.g., Standard Contractual Clauses). You may request a copy of
            relevant clauses by contacting <a href="mailto:privacy@elexsignature.com">privacy@elexsignature.com</a>.
          </p>

          <h2 id="security">7) Security</h2>
          <p>
            We implement reasonable safeguards (TLS in transit; encryption at rest via our cloud; least privilege access;
            monitoring and logging). No security is perfect; please use strong passwords, enable MFA if available, and keep
            your account secure.
          </p>

          <h2 id="retention">8) Retention</h2>
          <p>
            By default, we retain account data while your account is active and for a reasonable period afterward for backup,
            audit, and legal purposes. Executed documents and audit logs are retained <strong>[7 years]</strong> or as configured by the
            customer’s policy, then deleted or anonymized. You can delete documents earlier in the app; deletions from active
            systems propagate to backups within <strong>[30–90] days</strong>.
          </p>

          <h2 id="your-rights">9) Your rights</h2>
          <p>Depending on your location, you may have rights to:</p>
          <ul>
            <li>Access, correct, or delete personal data</li>
            <li>Port data to another provider</li>
            <li>Object to or restrict certain processing</li>
            <li>Withdraw consent (where processing is based on consent)</li>
            <li>Appeal our decision on your request (where applicable)</li>
          </ul>
          <p className="text-sm text-slate-600">
            For customer documents where we are processor, contact the sender/administrator first. Otherwise, email{" "}
            <a href="mailto:privacy@elexsignature.com">privacy@elexsignature.com</a>. We may verify your identity before responding.
          </p>
          <p className="text-sm text-slate-600">
            <strong>California/CPRA.</strong> We do not “sell” or “share” personal information as defined by CPRA. See Sections 2–5
            for categories collected, sources, purposes, and disclosures. You have the rights to know, delete, correct, and
            limit the use of sensitive information and to non‑discrimination.
          </p>

          <h2 id="children">10) Children</h2>
          <p>
            E Lex is not directed to children under 16. Do not use the Services if you are under the age of consent in your
            jurisdiction.
          </p>

          <h2 id="marketing-choices">11) Marketing choices</h2>
          <p>
            You can opt out of marketing emails via the unsubscribe link. We will still send essential transactional emails
            about your account or documents.
          </p>

          <h2 id="controller-processor">12) Controller/Processor details; DPA</h2>
          <ul>
            <li>
              <strong>Controller</strong> (website, billing, product analytics): {ORG_LEGAL_NAME}
            </li>
            <li>
              <strong>Processor</strong> (customer documents): We process only under your instructions. A DPA is available upon
              request at <a href="mailto:privacy@elexsignature.com">privacy@elexsignature.com</a>. We maintain a list of sub‑processors upon request and will
              provide advance notice of material changes where required.
            </li>
          </ul>

          <h2 id="changes">13) Changes to this Policy</h2>
          <p>
            We may update this Policy. We will post the new version with a new “Last updated” date and, where appropriate,
            provide notice. Continued use means you accept the changes.
          </p>

          <h2 id="contact">14) Contact</h2>
          <ul>
            <li>General &amp; privacy requests: <a href="mailto:privacy@elexsignature.com">privacy@elexsignature.com</a></li>
            <li>Data protection contact/DPO (if appointed): {DPO_EMAIL}</li>
            <li>Postal: {ORG_ADDRESS}</li>
          </ul>

          <h2 id="regional-africa">Regional Compliance — Africa (including The Gambia)</h2>
          <p>
            <strong>Scope.</strong> If you are located in an African state (including ECOWAS member states) or if our processing
            is otherwise subject to African frameworks, we process personal data in line with the African Union Convention on
            Cyber Security and Personal Data Protection (Malabo Convention) and the ECOWAS Supplementary Act A/SA.1/01/10 on
            Personal Data Protection, in addition to any applicable national law.
          </p>
          <p>
            <strong>Status in The Gambia.</strong> The Gambia has adopted policy instruments on data protection and privacy and
            is progressing a comprehensive data protection law. Until such legislation is in force, we voluntarily apply
            AU/ECOWAS standards to Gambian users and will update this Policy once a Gambian data protection authority and
            implementing rules are operational.
          </p>
          <p>
            <strong>Legal Bases.</strong> We rely on one or more of the following: consent, contract performance, legitimate
            interests, compliance with legal obligations, or protection of vital interests (as recognized in AU/ECOWAS
            frameworks).
          </p>
          <p>
            <strong>Your Rights (Africa/ECOWAS).</strong> Subject to law, you may request: access; correction/rectification;
            erasure; restriction or objection to processing (including objection to direct marketing); and portability where
            technically feasible. We will respond within 30 days (or any shorter period required by local law). If a Gambian
            supervisory authority is designated, we will include its contact details here and in your confirmation emails.
          </p>
          <p>
            <strong>Cross‑Border Transfers.</strong> We store data in secure cloud regions outside certain African countries.
            When transferring personal data across borders, we use appropriate safeguards recognized by AU/ECOWAS principles—
            such as contractual protections, audits, encryption, and strict access controls—and transfer only what is necessary
            for the service. We assess the legal environment of the destination and will suspend transfers if we cannot protect
            your data to an equivalent standard.
          </p>
          <p>
            <strong>Security &amp; Breach Notification.</strong> We implement administrative, technical, and physical safeguards
            (including encryption in transit and at rest, key management practices, and multi‑factor authentication for staff).
            If a breach creates a high risk to your rights and freedoms, we will notify you and, where required, the competent
            authority without undue delay (and generally within 72 hours of becoming aware), adapting to any stricter local
            requirement.
          </p>
          <p>
            <strong>Children.</strong> Our service is not directed at children. Where local law requires parental authorization
            to process a minor’s data, we will request verifiable consent or decline to provide the service.
          </p>

          <h3 id="local-date-audit">Local Date/Time &amp; Audit Metadata</h3>
          <ul>
            <li>
              We store a canonical timestamp in UTC (ISO 8601) and also record your local offset/time zone so the signed copy
              displays the date/time in your local format (e.g., <strong>DD/MM/YYYY</strong> in The Gambia).
            </li>
            <li>
              We record audit metadata: IP address (coarse geolocation), device/browser data, authentication method (e.g.,
              email/SMS), signature image hash, document version hash, field coordinates, and server logs.
            </li>
            <li>
              We retain the signature audit trail for at least <strong>7 years</strong> (or longer if required by applicable law or to
              establish/defend legal claims).
            </li>
          </ul>

          <h2 id="implementation-tips">Implementation tips (quick checklist)</h2>
          <ul>
            <li>Replace <strong>[bracketed]</strong> items (entity name, address, governing law, SCC/DPA references, retention periods).</li>
            <li>Add links in your app footer: Terms, Privacy, DPA, Sub‑processor list, and Security page.</li>
            <li>
              Make sure your product UI captures consumer consent to e‑records (a brief checkbox with a link to the ESIGN
              disclosure in the Terms).
            </li>
            <li>
              Ensure your email/SMS flow and audit logs match the disclosures (IP, timestamps, locale/time zone, optional
              location).
            </li>
            <li>
              If you operate outside the U.S., swap in your preferred governing law clause and remove/replace the U.S.
              arbitration section in the Terms.
            </li>
          </ul>

          <div className="mt-8">
            <Link to="/" className="text-sm text-purple-700 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
