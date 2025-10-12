// src/api.js
import axios from "axios";
import { BASE_URL } from "./baseUrl";

export const api = axios.create({
  baseURL: BASE_URL,
});

// Attach only small, JWT‑shaped tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Accept only "header.payload.signature" style tokens under 1.5KB
  const looksLikeJWT = token && token.split(".").length === 3;
  const reasonableSize = token && token.length < 1500;

  if (looksLikeJWT && reasonableSize) {
    config.headers.authorization = `Bearer ${token}`;
  } else {
    // If something odd is in localStorage, don't send it — it breaks Vercel (494)
    delete config.headers.authorization;
  }
  return config;
});
