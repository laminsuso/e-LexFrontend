import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Login from "./login";
import Pricing from "./pricing";
import AdminLayout from "./component/adminheader";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import DashboardPage from "./dashboard";
import SignYourselfPage from "./signupyourself";
import RequestSignaturesPage from "./requestsignature";
import SignDocumentPage from "./signdocument";
import ViewPdf from "./viewpdf";
import CreateTemplate from "./createtemplate";
import Signatures from "./signaturesettings";
import Preferences from "./preferences";
import Profile from "./profile";
import EditTemplate from "./edittemplate";
import ManageTemplate from "./managetemplates";
import NeedYourSign from "./needyoursign";
import Completed from "./completed";
import DeclinedComponent from "./declined";
import ExpiredComponent from "./expired";
import ContactBooks from "./contactbook";
import ForgotPassword from "./forgotpassword";
import Inprogress from "./inprogress";
import Draftsdocs from "./draftdocs";
import Subscription from "./subscription";
import ChangePassword from "./changePassword";
import UseTemplate from "./usetemplate";
import PublicProfile from "./publicProfile";
import Contact from "./contact";
import axios from "axios";
import AboutPage from "./pages/about/AboutPage";
import CareersPage from "./pages/careers/CareersPage";

/* NEW: Legal pages */
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";

/* NEW: Documents layout with search */
import DocumentsLayout from "./component/DocumentsLayout";

const stripePromise = loadStripe(
  "pk_test_51OwuO4LcfLzcwwOYdssgGfUSfOgWT1LwO6ewi3CEPewY7WEL9ATqH6WJm3oAcLDA3IgUvVYLVEBMIEu0d8fUwhlw009JwzEYmV"
);

// -------------------- Axios interceptors --------------------

axios.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.authorization = `Bearer ${String(t).trim()}`;
  return config;
});

axios.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;

    const msg =
      (err?.response?.data?.error ||
        err?.response?.data?.message ||
        "") + "";

    const lower = msg.toLowerCase();

    // Only treat these as true auth failures
    const isTokenProblem =
      status === 401 &&
      (lower.includes("token") ||
        lower.includes("unauthorized") ||
        lower.includes("expired") ||
        lower.includes("invalid"));

    // Some of your system uses 494 as "session invalid"
    const shouldForceLogout = isTokenProblem || status === 494;

    if (!shouldForceLogout) return Promise.reject(err);

    // signer session: restore owner token and do not redirect
    if (localStorage.getItem("signing_session")) {
      const backup = localStorage.getItem("token_backup");
      if (backup) localStorage.setItem("token", backup);
      localStorage.removeItem("token_backup");
      localStorage.removeItem("signing_session");
      return Promise.reject(err);
    }

    if (typeof window !== "undefined") {
      const loc = window.location;
      const path = loc?.pathname || "/";
      const search = loc?.search || "";
      const hash = loc?.hash || "";
      const currentFullPath = `${path}${search}${hash}`;

      // ✅ BEST UX: pricing & subscription are "upgrade flows"
      // - don't bounce users away unexpectedly
      // - keep context via next=...
      const isUpgradeFlow =
        path.startsWith("/pricing") || path.startsWith("/subscription");

      // If already on /join, don't loop
      if (path.includes("/join")) {
        // still clear token to avoid infinite 401 loops
        localStorage.removeItem("token");
        return Promise.reject(err);
      }

      // Always clear token (it's invalid/expired)
      localStorage.removeItem("token");

      // ✅ If user is on pricing/subscription, send them to login but preserve full path
      const next = encodeURIComponent(
        isUpgradeFlow ? currentFullPath : currentFullPath
      );

      // If they hit auth error anywhere else, redirect to login and come back after auth
      loc.replace(`/join?mode=login&next=${next}`);
    }

    return Promise.reject(err);
  }
);


// -------------------- Router --------------------

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/join", element: <Login /> },
  { path: "/contact", element: <Contact /> },
  { path: "/careers", element: <CareersPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/forgetpassword", element: <ForgotPassword /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "/publicprofile", element: <PublicProfile /> },
  { path: "/changepassword/:email", element: <ChangePassword /> },

  { path: "/legal/terms", element: <TermsPage /> },
  { path: "/legal/privacy", element: <PrivacyPage /> },

  {
    path: "/subscription",
    element: (
      <PayPalScriptProvider
        options={{
          clientId:
            "Aeiv6CI9M6IO70akUujuPV6ru2XJ337_GON5oIAAInPBcavq0up_hZl0NFJwcxmf6mk2tgkJX9sPH4zr",
        }}
      >
        <Elements stripe={stripePromise}>
          <Subscription />
        </Elements>
      </PayPalScriptProvider>
    ),
  },

  // ================== ADMIN AREA ==================
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "sign-yourself", element: <SignYourselfPage /> },
      { path: "request-signatures", element: <RequestSignaturesPage /> },
      { path: "request-signatures/sign-document/:documentId", element: <SignDocumentPage /> },
      { path: "view-pdf/sign-document/:documentId", element: <ViewPdf /> },
      { path: "template/create", element: <CreateTemplate /> },
      { path: "settings/signatures", element: <Signatures /> },
      { path: "settings/preferences", element: <Preferences /> },
      { path: "profile", element: <Profile /> },
      { path: "edittemplate/:documentId", element: <EditTemplate /> },
      { path: "usetemplate/:documentId", element: <UseTemplate /> },
      { path: "template/manage", element: <ManageTemplate /> },

      // documents layout
      {
        path: "documents",
        element: <DocumentsLayout />,
        children: [
          { path: "need-sign", element: <NeedYourSign /> },
          { path: "in-progress", element: <Inprogress /> },
          { path: "completed", element: <Completed /> },
          { path: "drafts", element: <Draftsdocs /> },
          { path: "declined", element: <DeclinedComponent /> },
          { path: "expired", element: <ExpiredComponent /> },
        ],
      },

      { path: "contactbook", element: <ContactBooks /> },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);

reportWebVitals();
