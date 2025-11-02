import React from "react";
import { Link } from "react-router-dom";

/** --- Configure these per release --- */
const EFFECTIVE_DATE = "November 1, 2025";            // ← replace if needed
const LAST_UPDATED = "November 1, 2025";              // ← replace if needed
const ORG_LEGAL_NAME = "E Lex Signature, Inc.";       // ← “Inc.” or “LLC”
const ORG_ADDRESS = "[address]";                      // ← your principal place of business

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-12 md:py-16 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            E&nbsp;Lex Signature<span className="align-super text-sm">™</span> — Terms of Service
          </h1>
          <p className="mt-2 text-slate-600">
            <span className="font-medium">Effective date:</span> {EFFECTIVE_DATE} &nbsp;&nbsp;|&nbsp;&nbsp;
            <span className="font-medium">Last updated:</span> {LAST_UPDATED}
          </p>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              These Terms govern your use of E‑Lex Signature. For how we collect and use personal data,
              see our{" "}
              <Link to="/legal/privacy" className="text-purple-700 hover:underline">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </header>

        {/* Table of contents */}
        <nav className="mb-10">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">On this page</h2>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            {[
              ["1) Who we are", "#who-we-are"],
              ["2) What E Lex does", "#what-we-do"],
              ["3) Electronic signatures & records", "#esign"],
              ["4) Accounts & eligibility", "#accounts"],
              ["5) Your content & permissions", "#content"],
              ["6) Acceptable use", "#acceptable-use"],
              ["7) Signing order, delivery & notifications", "#order-delivery"],
              ["8) Subscriptions, fees & taxes", "#fees"],
              ["9) Service changes; beta features", "#changes"],
              ["10) Privacy & data protection", "#privacy"],
              ["11) Security", "#security"],
              ["12) Third party services", "#third-parties"],
              ["13) Intellectual property", "#ip"],
              ["14) Disclaimers", "#disclaimers"],
              ["15) Limitation of liability", "#liability"],
              ["16) Indemnification", "#indemnification"],
              ["17) Disputes; governing law; arbitration (U.S.)", "#disputes"],
              ["18) Export & sanctions", "#export"],
              ["19) DMCA / IP complaints", "#dmca"],
              ["20) Changes to these Terms", "#changes-to-terms"],
              ["21) Miscellaneous", "#misc"],
              ["Regional Terms — Africa (incl. The Gambia)", "#regional-africa"],
              ["Practical checklist", "#checklist"],
              ["References", "#references"],
              ["Contact", "#contact"],
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} className="hover:text-purple-700 hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Body */}
        <section id="who-we-are" className="prose prose-slate max-w-none">
          <h2>1) Who we are</h2>
          <p>
            These Terms of Service (“Terms”) govern access to and use of the e‑signature and
            document workflow services, websites, and apps provided by {ORG_LEGAL_NAME} (“E Lex,” “we,”
            “us,” or “our”). Our contact email is <a href="mailto:support@elexsignature.com">support@elexsignature.com</a> and our principal
            place of business is {ORG_ADDRESS}.
          </p>
          <p>
            By creating an account, sending a document, clicking “I agree,” or otherwise using E Lex,
            you agree to these Terms. If you are using E Lex on behalf of an organization, you
            represent you have authority to bind that organization; “you” includes that organization.
          </p>

          <h2 id="what-we-do">2) What E Lex does</h2>
          <p>
            E Lex lets users upload, send, sign, and manage documents electronically, configure
            signing order, capture audit logs (including technical metadata), and distribute completed
            copies.
          </p>
          <p className="italic">
            E Lex is not a law firm and does not provide legal advice. You alone are responsible for
            the content and legality of your documents and for deciding if an electronic signature is
            appropriate for your transaction.
          </p>

          <h2 id="esign">3) Electronic signatures &amp; records</h2>
          <ol>
            <li>
              <strong>Legal recognition.</strong> E Lex is designed to comply with applicable e‑signature laws
              including the U.S. ESIGN Act and UETA, and, for EU/UK users, eIDAS (advanced/qualified
              signature features may require integrations not included in all plans).
              <br />
              <em>Regional note for Africa (incl. The Gambia):</em> For African users, we align our
              service with regional privacy and trust frameworks including the{" "}
              <span className="whitespace-nowrap">AU Malabo Convention</span> and the{" "}
              <span className="whitespace-nowrap">ECOWAS Supplementary Act A/SA.1/01/10</span>. You
              remain responsible for verifying whether a particular document type may be executed
              electronically under the applicable national law and, where required, for obtaining
              witnessing, notarization, or other formalities.
            </li>
            <li>
              <strong>Consumer consent.</strong> By signing electronically, recipients consent to receive
              records electronically and to use electronic signatures. Recipients may withdraw consent
              at any time by contacting the sender or{" "}
              <a href="mailto:support@elexsignature.com">support@elexsignature.com</a>. Withdrawing consent does not affect signatures already
              provided.
            </li>
            <li>
              <strong>Exceptions.</strong> Certain documents may not be signed electronically in your
              jurisdiction (e.g., wills, certain family law or real estate documents, court filings,
              documents that must be notarized, or other excluded categories). You are responsible for
              verifying eligibility.
            </li>
            <li>
              <strong>Records &amp; copies.</strong> Senders and signers should download and retain copies
              of completed documents. E Lex may keep audit logs (e.g., timestamps, IP address, user
              agent, locale/time zone, and optional location if provided) to help verify signing
              events.
            </li>
          </ol>

          <h2 id="accounts">4) Accounts &amp; eligibility</h2>
          <ul>
            <li>You must be 18+ (or the age of majority in your jurisdiction) and able to form a binding contract.</li>
            <li>Keep your credentials confidential and promptly notify us of any compromise. You are responsible for activity in your account.</li>
          </ul>

          <h2 id="content">5) Your content &amp; permissions</h2>
          <ul>
            <li>
              Your content remains yours. You grant E Lex a limited license to process your content
              solely to provide the services (e.g., hosting files, routing invitations, rendering
              previews, stamping signatures/fields, generating audit logs, troubleshooting, security).
            </li>
            <li>
              You represent that your content and your use of E Lex comply with law and that you have
              obtained all necessary notices, authorizations, and consents from recipients.
            </li>
          </ul>

          <h2 id="acceptable-use">6) Acceptable use</h2>
          <p>You will not:</p>
          <ol>
            <li>use E Lex for unlawful, deceptive, or infringing purposes;</li>
            <li>upload malware or attempt to interfere with or overload our systems;</li>
            <li>misrepresent identity or authority to sign;</li>
            <li>send spam or harassing invitations;</li>
            <li>attempt to bypass quotas or security;</li>
            <li>submit content that violates privacy or IP rights;</li>
            <li>
              use E Lex for prohibited/high‑risk uses without our written consent (e.g., where wet
              signatures or notarization are required or where sectoral regulations prohibit
              e‑signatures).
            </li>
          </ol>
          <p>We may suspend or terminate accounts that violate these Terms.</p>

          <h2 id="order-delivery">7) Signing order, delivery &amp; notifications</h2>
          <ul>
            <li>Senders can set signing order; E Lex will invite the first order and automatically invite the next order when the prior order completes.</li>
            <li>E Lex may send emails, and where configured SMS/WhatsApp messages, to facilitate the workflow. Message and data rates may apply.</li>
            <li>We do not guarantee delivery times or receipt by recipients (e.g., due to spam filters, bounces, or recipient misconfiguration).</li>
          </ul>

          <h2 id="fees">8) Subscriptions, fees &amp; taxes</h2>
          <ul>
            <li>
              Some features are provided on a paid subscription. Plans auto‑renew unless canceled as
              described in your account. You authorize us (or our processor) to charge the payment
              method on file for recurring fees, taxes, and authorized add‑ons/overages (e.g., extra
              envelopes, SMS, or storage).
            </li>
            <li>
              <strong>Cancellation.</strong> You may cancel at any time; your plan remains active through
              the current term. Unless required by law, fees are non‑refundable.
            </li>
            <li>
              We may change pricing or features with reasonable notice. If you do not agree, you may
              cancel before the changes take effect.
            </li>
          </ul>

          <h2 id="changes">9) Service changes; beta features</h2>
          <p>
            We may add, change, or discontinue features. Some features may be labeled Beta and are
            provided “as is,” may be unstable, and may change or be withdrawn at any time.
          </p>

          <h2 id="privacy">10) Privacy &amp; data protection</h2>
          <p>
            Our <Link to="/legal/privacy" className="text-purple-700 hover:underline">Privacy Policy</Link> explains how we collect and use personal data and our roles as
            controller and processor. If your organization needs a Data Processing Addendum (DPA),
            contact us at <a href="mailto:privacy@elexsignature.com">privacy@elexsignature.com</a>. You agree not to upload special categories
            of personal data unless your plan and DPA expressly allow it and you have a lawful basis
            to do so.
          </p>

          <h2 id="security">11) Security</h2>
          <p>
            We use reasonable technical and organizational measures to protect the service (e.g., TLS
            in transit, encryption at rest provided by our cloud provider, access controls, logging). No
            system is perfect; you acknowledge that you use E Lex at your own risk.
          </p>

          <h2 id="third-parties">12) Third party services</h2>
          <p>
            The service may rely on third‑party providers (for example, cloud storage/CDN, email/SMS
            delivery, analytics, and payments). Your use of those services may be subject to their
            terms and privacy notices. We are not responsible for third‑party services we do not
            control.
          </p>

          <h2 id="ip">13) Intellectual property</h2>
          <p>
            E Lex and our logos, UI, and underlying technology are our IP. You may not copy or reverse
            engineer the service. You grant us a worldwide, royalty‑free license to use feedback you
            provide to improve E Lex.
          </p>

          <h2 id="disclaimers">14) Disclaimers</h2>
          <p className="uppercase tracking-wide text-[0.92rem] font-semibold text-slate-700">
            E LEX IS PROVIDED “AS IS” AND “AS AVAILABLE.”
          </p>
          <p>
            To the maximum extent permitted by law, we disclaim all warranties, express or implied,
            including merchantability, fitness for a particular purpose, and non‑infringement. We do
            not warrant that E Lex will be error‑free, continuously available, or meet your
            legal/compliance needs.
          </p>

          <h2 id="liability">15) Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, E Lex and its suppliers will not be liable for any
            indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss
            of profits, revenue, data, or goodwill. Our total liability for all claims relating to the
            service will not exceed the amounts you paid to E Lex in the 12 months before the event
            giving rise to liability (or $100 if you have no paid subscription). Some jurisdictions do
            not allow certain limitations; some of the above may not apply to you.
          </p>

          <h2 id="indemnification">16) Indemnification</h2>
          <p>
            You will defend and indemnify E Lex from and against third‑party claims, damages, and
            expenses (including reasonable attorneys’ fees) arising out of your content or your use of
            E Lex in violation of law or these Terms.
          </p>

          <h2 id="disputes">17) Disputes; governing law; arbitration (U.S.)</h2>
          <p>
            These Terms are governed by the laws of [Delaware, USA], without regard to conflict of laws
            rules. Any dispute arising out of or relating to these Terms or E Lex will be resolved by
            binding arbitration administered by [AAA/JAMS] under its rules, on an individual basis;
            class actions are waived. Either party may seek injunctive relief in court for IP or
            unauthorized use. <strong>Opt out:</strong> You may opt out of arbitration within 30 days of
            accepting these Terms by emailing <a href="mailto:legal@elexsignature.com">legal@elexsignature.com</a> with your account details
            and a clear statement opting out.
          </p>
          <p className="text-sm text-slate-600">
            If you operate mainly outside the U.S., replace this section with your preferred venue and
            dispute resolution clause.
          </p>

          <h2 id="export">18) Export &amp; sanctions</h2>
          <p>
            You represent you are not located in, under the control of, or a national/resident of any
            country or entity subject to U.S. sanctions and will not use E Lex contrary to export or
            sanctions laws.
          </p>

          <h2 id="dmca">19) DMCA / IP complaints</h2>
          <p>
            If you believe content on E Lex infringes your copyright, please send a DMCA notice to{" "}
            <a href="mailto:legal@elexsignature.com">legal@elexsignature.com</a> with: (a) your contact details; (b) identification of the work
            and the allegedly infringing material; (c) a statement under penalty of perjury of your
            good‑faith belief; and (d) your signature.
          </p>

          <h2 id="changes-to-terms">20) Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. We will post the updated version and change
            the “Last updated” date. Material changes will be notified in advance where feasible.
            Continued use after changes become effective constitutes acceptance.
          </p>

          <h2 id="misc">21) Miscellaneous</h2>
          <ul>
            <li><strong>Entire agreement.</strong> These Terms plus any order form or DPA are the entire agreement.</li>
            <li><strong>Severability &amp; waiver.</strong> If a provision is unenforceable, the remainder stays effective; failure to enforce is not a waiver.</li>
            <li><strong>Assignment.</strong> You may not assign these Terms without our consent. We may assign to an affiliate or in connection with a merger or sale.</li>
            <li><strong>Force majeure.</strong> We are not liable for delays or failures due to events beyond our reasonable control.</li>
            <li><strong>Notices.</strong> We may provide notices via email, in‑app, or by posting.</li>
          </ul>

          <h2 id="regional-africa">Regional Terms — Africa (including The Gambia)</h2>
          <p>
            <strong>Recognition of Frameworks.</strong> For users in Africa (including ECOWAS member
            states), you acknowledge that E Lex Signature operates under regional privacy standards set
            by the Malabo Convention and the ECOWAS Supplementary Act A/SA.1/01/10, alongside any
            applicable national laws. We commit to maintain safeguards for cross‑border transfers and
            to honor data subject rights described in our Privacy Policy.
          </p>
          <p>
            <strong>The Gambia.</strong> The Gambia is progressing a comprehensive data protection
            framework; pending its full enactment and the designation of a supervisory authority, you
            agree that E Lex Signature’s AU/ECOWAS‑aligned controls are a sufficient standard of care.
            We will update these Terms to reference the competent Gambian authority once established.
          </p>
          <p>
            <strong>Electronic Signatures &amp; Local Law.</strong> E Lex Signature provides tools for
            e‑signatures and document workflows. You are responsible for verifying whether a particular
            document type must be executed with formalities prescribed by local law (e.g., witnessing,
            notarization, land/estate transfers, family law instruments). Where a jurisdiction
            prohibits e‑signatures for a given instrument, you must not use the Service for that
            instrument.
          </p>
          <p>
            <strong>Audit Trail &amp; Evidence.</strong> You authorize E Lex Signature to collect and
            preserve the audit metadata listed in the Privacy Policy for evidentiary use and to
            disclose it to you, your counter‑parties, courts, arbitral bodies, or regulators as legally
            required.
          </p>
          <p>
            <strong>Data Localization.</strong> Unless a binding local law requires in‑country storage,
            you consent to processing and storage in secure cloud regions outside your country with
            appropriate transfer safeguards.
          </p>
          <p>
            <strong>Breach Notice &amp; Cooperation.</strong> In the event of a data incident affecting
            your account, we will notify your designated contact and provide information reasonably
            necessary to meet regulatory obligations under applicable African frameworks and national
            law.
          </p>
          <p>
            <strong>Order of Precedence.</strong> If a conflict exists between these Regional Terms and
            the main Terms, these Regional Terms govern for users in Africa to the extent of the
            conflict.
          </p>

          <h3 id="checklist">4) Practical checklist you can implement now</h3>
          <ol>
            <li>
              Map your transfer safeguards (contractual clauses in DPAs with customers; encryption;
              access controls) to AU/ECOWAS principles.
            </li>
            <li>
              Add a “Gambia watch” note in your policy footer (“Last updated… We will update this page
              when the Gambian data protection authority is established or a new Act takes effect.”).
            </li>
            <li>
              Expose local date formatting in your UI and store UTC + time zone offset + raw ISO
              timestamps in your audit log (you’ve already built this into your product updates).
            </li>
            <li>
              Set a standard DSAR SLA of 30 days and a breach notification target of 72 hours,
              adjusting for stricter local laws as they emerge.
            </li>
          </ol>

          <h3 id="references">Why these sources (informational)</h3>
          <ul>
            <li>AU Malabo Convention – confirms a continent‑wide baseline is active.</li>
            <li>ECOWAS Supplementary Act A/SA.1/01/10 – minimum standards for West Africa, including The Gambia.</li>
            <li>The Gambia policy status and plans – indicates a comprehensive Act is pending/anticipated.</li>
          </ul>

          <h2 id="contact">Contact</h2>
          <p>
            <strong>E Lex Signature — Legal</strong>
            <br />
            <a href="mailto:legal@elexsignature.com">legal@elexsignature.com</a> &nbsp;|&nbsp;{" "}
            <a href="mailto:support@elexsignature.com">support@elexsignature.com</a> &nbsp;|&nbsp; {ORG_ADDRESS}
          </p>

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
