// import React from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// import App from "./App";
// import reportWebVitals from "./reportWebVitals";
// import { RouterProvider, createBrowserRouter } from "react-router-dom";
// import Login from "./login";
// import Pricing from "./pricing";
// import AdminLayout from "./component/adminheader";
// import { PayPalScriptProvider } from "@paypal/react-paypal-js";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements } from "@stripe/react-stripe-js";
// import DashboardPage from "./dashboard";
// import SignYourselfPage from "./signupyourself";
// import RequestSignaturesPage from "./requestsignature";
// import SignDocumentPage from "./signdocument";
// import ViewPdf from "./viewpdf";
// import CreateTemplate from "./createtemplate";
// import Signatures from "./signaturesettings";
// import Preferences from "./preferences";
// import Profile from "./profile";
// import EditTemplate from "./edittemplate";
// import ManageTemplate from "./managetemplates";
// import NeedYourSign from "./needyoursign";
// import SignRequests from "./requests";
// import Completed from "./completed";
// import Drafts from "./drafts";
// import DeclinedComponent from "./declined";
// import ExpiredComponent from "./expired";
// import ContactBooks from "./contactbook";
// import ForgotPassword from "./forgotpassword";
// import Inprogress from "./inprogress";
// import Draftsdocs from "./draftdocs";
// import Subscription from "./subscription";
// import ChangePassword from "./changePassword";
// import UseTemplate from "./usetemplate";
// import PublicProfile from "./publicProfile";
// import Contact from "./contact";
// import axios from "axios";
// import AboutPage from "./pages/about/AboutPage";
// import CareersPage from "./pages/careers/CareersPage";

// /* NEW: Legal pages */
// import TermsPage from "./pages/legal/TermsPage";
// import PrivacyPage from "./pages/legal/PrivacyPage";

// /* NEW: Documents layout with search */
// import DocumentsLayout from "./component/DocumentsLayout"; // <--- create this

// const stripePromise = loadStripe(
//   "pk_test_51OwuO4LcfLzcwwOYdssgGfUSfOgWT1LwO6ewi3CEPewY7WEL9ATqH6WJm3oAcLDA3IgUvVYLVEBMIEu0d8fUwhlw009JwzEYmV"
// );

// axios.interceptors.request.use((config) => {
//   const t = localStorage.getItem("token");
//   if (t) config.headers.authorization = `Bearer ${String(t).trim()}`;
//   return config;
// });

// axios.interceptors.response.use(
//   (r) => r,
//   (err) => {
//     const status = err?.response?.status;

//     // read backend error message if present
//     const msg =
//       err?.response?.data?.error ||
//       err?.response?.data?.message ||
//       "";

//     const isTokenProblem =
//       status === 401 &&
//       (msg.toLowerCase().includes("token") ||
//         msg.toLowerCase().includes("unauthorized") ||
//         msg.toLowerCase().includes("expired") ||
//         msg.toLowerCase().includes("invalid"));

//     // ✅ Only force logout for real token failures
//     if (isTokenProblem || status === 494) {
//       // restore owner token if signer session was active
//       if (localStorage.getItem("signing_session")) {
//         const backup = localStorage.getItem("token_backup");
//         if (backup) localStorage.setItem("token", backup);
//         localStorage.removeItem("token_backup");
//         localStorage.removeItem("signing_session");
//       } else {
//         localStorage.removeItem("token");
//       }

//       // Don't kick user out if they're already on login/register
//       if (typeof window !== "undefined") {
//         const loc = window.location;
//         if (loc && !loc.pathname.includes("/join")) {
//           loc.replace("/join");
//         }
//       }
//     }

//     return Promise.reject(err);
//   }
// );


// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />,
//   },
//   {
//     path: "/join",
//     element: <Login />,
//   },
//   {
//     path: "/contact",
//     element: <Contact />,
//   },
//   {
//     path: "/careers",
//     element: <CareersPage />,
//   },
//   {
//     path: "/about",
//     element: <AboutPage />,
//   },
//   {
//     path: "/forgetpassword",
//     element: <ForgotPassword />,
//   },
//   {
//     path: "/pricing",
//     element: <Pricing />,
//   },
//   {
//     path: "/publicprofile",
//     element: <PublicProfile />,
//   },
//   {
//     path: "/changepassword/:email",
//     element: <ChangePassword />,
//   },

//   /* NEW: Legal routes */
//   {
//     path: "/legal/terms",
//     element: <TermsPage />,
//   },
//   {
//     path: "/legal/privacy",
//     element: <PrivacyPage />,
//   },

//   {
//     path: "/subscription",
//     element: (
//       <PayPalScriptProvider
//         options={{
//           clientId:
//             "Aeiv6CI9M6IO70akUujuPV6ru2XJ337_GON5oIAAInPBcavq0up_hZl0NFJwcxmf6mk2tgkJX9sPH4zr",
//         }}
//       >
//         <Elements stripe={stripePromise}>
//           <Subscription />
//         </Elements>
//       </PayPalScriptProvider>
//     ),
//   },

//   // ================== ADMIN AREA ==================
//   {
//     path: "/admin",
//     element: <AdminLayout />,
//     children: [
//       { index: true, element: <DashboardPage /> },
//       { path: "sign-yourself", element: <SignYourselfPage /> },
//       { path: "request-signatures", element: <RequestSignaturesPage /> },
//       {
//         path: "request-signatures/sign-document/:documentId",
//         element: <SignDocumentPage />,
//       },
//       {
//         path: "view-pdf/sign-document/:documentId",
//         element: <ViewPdf />,
//       },
//       {
//         path: "template/create",
//         element: <CreateTemplate />,
//       },
//       {
//         path: "settings/signatures",
//         element: <Signatures />,
//       },
//       {
//         path: "settings/preferences",
//         element: <Preferences />,
//       },
//       {
//         path: "profile",
//         element: <Profile />,
//       },
//       {
//         path: "edittemplate/:documentId",
//         element: <EditTemplate />,
//       },
//       {
//         path: "usetemplate/:documentId",
//         element: <UseTemplate />,
//       },
//       {
//         path: "template/manage",
//         element: <ManageTemplate />,
//       },

//       // ======== NEW: documents layout with shared search ========
//       {
//         path: "documents",
//         element: <DocumentsLayout />, // renders search bar + Outlet
//         children: [
//           { path: "need-sign", element: <NeedYourSign /> },
//           { path: "in-progress", element: <Inprogress /> },
//           { path: "completed", element: <Completed /> },
//           { path: "drafts", element: <Draftsdocs /> },
//           { path: "declined", element: <DeclinedComponent /> },
//           { path: "expired", element: <ExpiredComponent /> },
//         ],
//       },

//       {
//         path: "contactbook",
//         element: <ContactBooks />,
//       },
//     ],
//   },
// ]);

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(<RouterProvider router={router} />);

// reportWebVitals();

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

    // message from backend (if any)
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

    if (shouldForceLogout) {
      // restore owner token if signer session was active
      if (localStorage.getItem("signing_session")) {
        const backup = localStorage.getItem("token_backup");
        if (backup) localStorage.setItem("token", backup);
        localStorage.removeItem("token_backup");
        localStorage.removeItem("signing_session");
        // signer flow handled; do not redirect here
        return Promise.reject(err);
      }

      // clear token
      localStorage.removeItem("token");

      if (typeof window !== "undefined") {
        const loc = window.location;
        const path = loc?.pathname || "/";
        const search = loc?.search || "";
        const hash = loc?.hash || "";

        // ✅ Fix 2: If they are on /pricing, keep them on the upgrade flow
        // redirect to /join?next=/pricing (or current full path)
        const currentFullPath = `${path}${search}${hash}`;
        const next = encodeURIComponent(
          path.startsWith("/pricing") ? "/pricing" : currentFullPath
        );

        // Don't redirect if already on join
        if (!path.includes("/join")) {
          loc.replace(`/join?next=${next}`);
        }
      }
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
