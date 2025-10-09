import React, { useEffect, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../baseUrl";
import { toast } from "react-toastify";

const GoogleAuthButton = ({ onSuccess, onError, redirectTo = "/admin" }) => {
  const btnRef = useRef(null);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const init = () => {
      if (!window.google || !clientId || !btnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            const { credential } = resp || {};
            if (!credential) throw new Error("Missing Google credential");
            // Exchange Google ID token for your app's JWT
            const { data } = await axios.post(`${BASE_URL}/auth/google`, { credential });
            localStorage.setItem("token", data.token);
            if (typeof onSuccess === "function") onSuccess(data);
            window.location.href = redirectTo;
          } catch (e) {
            console.error(e);
            toast.error(e?.response?.data?.error || "Google sign-in failed", { containerId: "auth" });
            if (typeof onError === "function") onError(e);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Render the Google button
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",       // or 'icon'
        theme: "filled_blue",   // 'outline'
        size: "large",          // 'medium' | 'small'
        shape: "rectangular",
        text: "continue_with",  // 'signin_with', 'signup_with'
        logo_alignment: "left",
      });

      // Optional One Tap prompt
      window.google.accounts.id.prompt();
    };

    // Wait until script is loaded
    let t = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(t);
        init();
      }
    }, 100);
    return () => clearInterval(t);
  }, [clientId]);

  return (
    <div className="w-full flex justify-center">
      <div ref={btnRef} />
    </div>
  );
};

export default GoogleAuthButton;
