// // src/api.js
// import axios from "axios";
// import { BASE_URL } from "./baseUrl";

// export const api = axios.create({
//   baseURL: BASE_URL,
// });

// // Attach only small, JWT‑shaped tokens
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   // Accept only "header.payload.signature" style tokens under 1.5KB
//   const looksLikeJWT = token && token.split(".").length === 3;
//   const reasonableSize = token && token.length < 1500;

//   if (looksLikeJWT && reasonableSize) {
//     config.headers.authorization = `Bearer ${token}`;
//   } else {
//     // If something odd is in localStorage, don't send it — it breaks Vercel (494)
//     delete config.headers.authorization;
//   }
//   return config;
// });

// src/api.js
import axios from "axios";
import { BASE_URL } from "./baseUrl";

export const api = axios.create({
  baseURL: BASE_URL,
  // Optional but helpful on Vercel/network hiccups:
  timeout: 30000,
});

// Attach only small, JWT‑shaped tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Ensure headers object exists
    config.headers = config.headers || {};

    // Accept only "header.payload.signature" style tokens under ~2KB
    const looksLikeJWT = typeof token === "string" && token.split(".").length === 3;
    const reasonableSize = typeof token === "string" && token.length > 0 && token.length < 2000;

    if (looksLikeJWT && reasonableSize) {
      config.headers.authorization = `Bearer ${token}`;
    } else {
      // If something odd is in localStorage, don't send it
      delete config.headers.authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: centralized auth handling
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // If backend returns 401, you can optionally force logout here
    // if (error?.response?.status === 401) localStorage.removeItem("token");
    return Promise.reject(error);
  }
);
