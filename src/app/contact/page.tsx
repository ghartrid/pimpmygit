"use client";

import { useState, useEffect, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    fetch("/api/contact/captcha-key")
      .then((res) => res.json())
      .then((data) => setSiteKey(data.siteKey))
      .catch(() => setSiteKey(""));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setErrorMsg("Please complete the CAPTCHA");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, captchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
        setCaptchaToken("");
        captchaRef.current?.resetCaptcha();
      } else {
        setErrorMsg(data.error || "Failed to send message");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Have a question, payment issue, or feedback? Send us a message.
      </p>

      {status === "sent" ? (
        <div
          className="rounded-xl border p-6 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="text-3xl mb-3">&#10003;</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--green)" }}>
            Message Sent
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            We&apos;ll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 px-4 py-2 rounded-lg text-sm cursor-pointer"
            style={{ background: "var(--accent)", color: "#fff", border: "none" }}
          >
            Send Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-xl border p-6 space-y-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {status === "error" && errorMsg && (
              <div
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: "rgba(248,81,73,0.1)", color: "var(--red)" }}
              >
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={2000}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                placeholder="How can we help?"
              />
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {message.length}/2000
              </div>
            </div>

            {siteKey === null ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading CAPTCHA...
              </div>
            ) : siteKey === "" ? (
              <div className="text-sm" style={{ color: "var(--red)" }}>
                CAPTCHA unavailable. Please try again later.
              </div>
            ) : (
              <HCaptcha
                sitekey={siteKey}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                ref={captchaRef}
                theme="dark"
              />
            )}

            <button
              type="submit"
              disabled={status === "sending" || !siteKey}
              className="w-full py-2.5 rounded-lg font-medium text-sm cursor-pointer"
              style={{
                background: status === "sending" ? "var(--border)" : "var(--accent)",
                color: "#fff",
                border: "none",
                opacity: status === "sending" ? 0.7 : 1,
              }}
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
