 //export const BASE_URL="http://localhost:6000"

//export const BASE_URL="https://e-lex-backend.vercel.app"
//export const BASE_URL="https://e-lex-backend-eight.vercel.app"

// src/baseUrl.js
export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://e-lex-backend-eight.vercel.app"
    : "http://localhost:5000";
