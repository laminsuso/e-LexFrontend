// import React from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// import App from "./App";
// import reportWebVitals from "./reportWebVitals";
// import { RouterProvider, createBrowserRouter } from "react-router-dom";
// import Login from "./login";
// import Pricing from "./pricing";
// import AdminLayout from "./component/adminheader";
// import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
// import { loadStripe } from "@stripe/stripe-js";
// import {
//   PaymentElement,
//   Elements,
//   useStripe,
//   useElements,
// } from "@stripe/react-stripe-js";
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
// const stripePromise = loadStripe(
//   "pk_test_51OwuO4LcfLzcwwOYdssgGfUSfOgWT1LwO6ewi3CEPewY7WEL9ATqH6WJm3oAcLDA3IgUvVYLVEBMIEu0d8fUwhlw009JwzEYmV"
// );

// axios.interceptors.request.use((config) => {
//   const t = localStorage.getItem('token');
//   if (t) config.headers.authorization = `Bearer ${String(t).trim()}`;
//   return config;
// });

// axios.interceptors.response.use(
//   (r) => r,
//   (err) => {
//     const status = err?.response?.status;

//     if (status === 494 || status === 401 || status === 403) {
//       // restore owner token if a signer session was active
//       if (localStorage.getItem('signing_session')) {
//         const backup = localStorage.getItem('token_backup');
//         if (backup) localStorage.setItem('token', backup);
//         localStorage.removeItem('token_backup');
//         localStorage.removeItem('signing_session');
//       } else {
//         localStorage.removeItem('token');
//       }

//       //Use window.location (not the restricted global `location`)
//       if (typeof window !== 'undefined') {
//         const loc = window.location;
//         if (loc && !loc.pathname.includes('/join')) {
//           loc.replace('/join');
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
//     path:"/contact",
//     element:<Contact />
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
//         path: "/admin/profile",
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
//       {
//         path: "documents/need-sign",
//         element: <NeedYourSign />,
//       },
//       {
//         path: "documents/in-progress",
//         element: <Inprogress />,
//       },
//       {
//         path: "documents/completed",
//         element: <Completed />,
//       },
//       {
//         path: "documents/drafts",
//         element: <Draftsdocs />,
//       },
//       {
//         path: "documents/declined",
//         element: <DeclinedComponent />,
//       },
//       {
//         path: "documents/expired",
//         element: <ExpiredComponent />,
//       },
//       {
//         path: "contactbook",
//         element: <ContactBooks />,
//       },
     
//     ],
//   },
// ]);

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(

//     <RouterProvider router={router} />
 
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
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
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
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
import SignRequests from "./requests";
import Completed from "./completed";
import Drafts from "./drafts";
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

/* NEW: Legal pages */
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";

const stripePromise = loadStripe(
  "pk_test_51OwuO4LcfLzcwwOYdssgGfUSfOgWT1LwO6ewi3CEPewY7WEL9ATqH6WJm3oAcLDA3IgUvVYLVEBMIEu0d8fUwhlw009JwzEYmV"
);

axios.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.authorization = `Bearer ${String(t).trim()}`;
  return config;
});

axios.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;

    if (status === 494 || status === 401 || status === 403) {
      // restore owner token if a signer session was active
      if (localStorage.getItem("signing_session")) {
        const backup = localStorage.getItem("token_backup");
        if (backup) localStorage.setItem("token", backup);
        localStorage.removeItem("token_backup");
        localStorage.removeItem("signing_session");
      } else {
        localStorage.removeItem("token");
      }

      // Use window.location (not the restricted global `location`)
      if (typeof window !== "undefined") {
        const loc = window.location;
        if (loc && !loc.pathname.includes("/join")) {
          loc.replace("/join");
        }
      }
    }

    return Promise.reject(err);
  }
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/join",
    element: <Login />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/forgetpassword",
    element: <ForgotPassword />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/publicprofile",
    element: <PublicProfile />,
  },
  {
    path: "/changepassword/:email",
    element: <ChangePassword />,
  },

  /* NEW: Legal routes */
  {
    path: "/legal/terms",
    element: <TermsPage />,
  },
  {
    path: "/legal/privacy",
    element: <PrivacyPage />,
  },

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
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "sign-yourself", element: <SignYourselfPage /> },
      { path: "request-signatures", element: <RequestSignaturesPage /> },
      {
        path: "request-signatures/sign-document/:documentId",
        element: <SignDocumentPage />,
      },
      {
        path: "view-pdf/sign-document/:documentId",
        element: <ViewPdf />,
      },
      {
        path: "template/create",
        element: <CreateTemplate />,
      },
      {
        path: "settings/signatures",
        element: <Signatures />,
      },
      {
        path: "settings/preferences",
        element: <Preferences />,
      },
      {
        // FIXED: make this a relative child path so it renders in AdminLayout's Outlet
        path: "profile",
        element: <Profile />,
      },
      {
        path: "edittemplate/:documentId",
        element: <EditTemplate />,
      },
      {
        path: "usetemplate/:documentId",
        element: <UseTemplate />,
      },
      {
        path: "template/manage",
        element: <ManageTemplate />,
      },
      {
        path: "documents/need-sign",
        element: <NeedYourSign />,
      },
      {
        path: "documents/in-progress",
        element: <Inprogress />,
      },
      {
        path: "documents/completed",
        element: <Completed />,
      },
      {
        path: "documents/drafts",
        element: <Draftsdocs />,
      },
      {
        path: "documents/declined",
        element: <DeclinedComponent />,
      },
      {
        path: "documents/expired",
        element: <ExpiredComponent />,
      },
      {
        path: "contactbook",
        element: <ContactBooks />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
