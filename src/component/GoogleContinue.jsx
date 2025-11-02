import { useEffect, useRef } from "react";

/**
 * Renders the official Google "Continue with Google" button and
 * calls onSuccess({ credential, select_by, clientId }) when the user completes.
 *
 * Props:
 *  - clientId: string (REQUIRED)
 *  - onSuccess: function(resp) (REQUIRED) — receives Google ID token in resp.credential
 *  - onError?: function(err)
 *  - text?: 'continue_with' | 'signin_with' | 'signup_with'
 *  - theme?: 'outline' | 'filled_blue' | 'filled_black'
 *  - size?: 'large' | 'medium' | 'small'
 *  - shape?: 'pill' | 'rectangular' | 'circle' | 'square'
 */
export default function GoogleContinue({
  clientId,
  onSuccess,
  onError,
  text = "continue_with",
  theme = "outline",
  size = "large",
  shape = "pill",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Ensure the script is loaded once
    const ensureScript = () =>
      new Promise((resolve) => {
        if (window.google?.accounts?.id) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = resolve;
        document.head.appendChild(s);
      });

    let cancelled = false;

    (async () => {
      await ensureScript();
      if (cancelled) return;
      const gsi = window.google?.accounts?.id;
      if (!gsi || !clientId || !containerRef.current) return;

      gsi.initialize({
        client_id: clientId,
        callback: onSuccess,
        ux_mode: "popup",        // nice modal popup (not a full redirect)
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Avoid duplicate buttons when re-rendering
      containerRef.current.innerHTML = "";

      gsi.renderButton(containerRef.current, {
        theme, size, shape, text,
        logo_alignment: "left",
        width: 320,            // lets the button fill your card width
      });
    })();

    return () => { cancelled = true; };
  }, [clientId, onSuccess, text, theme, size, shape]);

  // Put the button inside a wrapper so it inherits your card layout
  return <div className="w-full flex justify-center"><div ref={containerRef} /></div>;
}
