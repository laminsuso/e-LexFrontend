//  //export const BASE_URL="http://localhost:6000"

// //export const BASE_URL="https://e-lex-backend.vercel.app"
// //export const BASE_URL="https://e-lex-backend-eight.vercel.app"

// // src/baseUrl.js
// // export const BASE_URL =
// //   process.env.NODE_ENV === "production"
// //     ? "https://e-lex-backend-eight.vercel.app"
// //     : "http://localhost:5000";

// // src/baseUrl.js

// const PROD_API = "https://e-lex-backend-eight.vercel.app";

// // In CRA, only env vars starting with REACT_APP_ are exposed to the browser
// const ENV_API =
//   (process.env.REACT_APP_API_URL || "").trim() ||
//   (process.env.REACT_APP_BACKEND_URL || "").trim();

// function devApiFromBrowserHost() {
//   // If frontend is opened as http://192.168.1.156:3000
//   // window.location.hostname === "192.168.1.156"
//   const host = window.location.hostname;

//   // Backend is assumed to run on port 5000 on the SAME machine
//   return `http://${host}:5000`;
// }

// export const BASE_URL =
//   process.env.NODE_ENV === "production"
//     ? PROD_API
//     : (ENV_API || devApiFromBrowserHost());

// frontend/src/baseUrl.js

const stripTrailingSlash = (url) => (url || "").replace(/\/+$/, "");

const PROD_API =
  stripTrailingSlash(process.env.REACT_APP_PROD_API_URL) ||
  "https://e-lex-backend-eight.vercel.app";

// In CRA, only env vars starting with REACT_APP_ are exposed to the browser
const ENV_API = stripTrailingSlash(
  (process.env.REACT_APP_API_URL || "").trim() ||
    (process.env.REACT_APP_BACKEND_URL || "").trim()
);

function devApiFromBrowserHost() {
  // Example: if frontend runs on http://192.168.1.156:3000
  // window.location.hostname === "192.168.1.156"
  const host =
    typeof window !== "undefined" && window.location
      ? window.location.hostname
      : "localhost";

  // Backend assumed on port 5000 on same host
  return `http://${host}:5000`;
}

export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? PROD_API
    : ENV_API || devApiFromBrowserHost();
