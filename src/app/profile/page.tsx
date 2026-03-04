"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PACKAGES = [
  { id: "small", credits: 10, price: "$5" },
  { id: "medium", credits: 25, price: "$10" },
  { id: "large", credits: 50, price: "$18" },
];

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const ext = session as Record<string, unknown> | null;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/paypal/client-id")
      .then((res) => res.json())
      .then((data) => setPaypalClientId(data.clientId))
      .catch(() => setPaypalClientId(""));
  }, []);

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="mb-4" style={{ color: "var(--text-muted)" }}>Sign in to view your profile</p>
        <button
          onClick={() => signIn("github")}
          className="px-6 py-2 rounded-lg font-medium cursor-pointer"
          style={{ background: "var(--accent)", color: "#fff", border: "none" }}
        >
          Sign in with GitHub
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div
        className="rounded-xl border p-6 mb-6 flex items-center gap-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {session?.user?.image && (
          <Image src={session.user.image} alt="" width={64} height={64} className="rounded-full" />
        )}
        <div>
          <h1 className="text-xl font-bold">{(ext?.username as string) || session?.user?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-sm px-3 py-1 rounded-full font-medium"
              style={{ background: "var(--gold-glow)", color: "var(--gold)" }}
            >
              {(ext?.credits as number) ?? 0} credits
            </span>
          </div>
        </div>
      </div>

      {/* Buy credits */}
      <h2 className="text-lg font-bold mb-4">Buy Credits</h2>

      {message && (
        <div
          className="mb-4 px-4 py-2 rounded-lg text-sm"
          style={{
            background: messageType === "success" ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)",
            color: messageType === "success" ? "var(--green)" : "var(--red)",
          }}
        >
          {message}
        </div>
      )}

      {paypalClientId === null ? (
        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
          Loading payment options...
        </div>
      ) : paypalClientId === "" ? (
        <div className="text-center py-8" style={{ color: "var(--red)" }}>
          Payment system unavailable. Please try again later.
        </div>
      ) : (
        <PayPalScriptProvider
          options={{
            clientId: paypalClientId,
            currency: "USD",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-xl border p-4 text-center"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: "var(--gold)" }}>
                  {pkg.credits}
                </div>
                <div className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                  credits &middot; {pkg.price}
                </div>
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    shape: "rect",
                    label: "pay",
                    height: 35,
                  }}
                  createOrder={async () => {
                    const res = await fetch("/api/paypal/create-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ package: pkg.id }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    return data.id;
                  }}
                  onApprove={async (data) => {
                    setMessage("");
                    const res = await fetch("/api/paypal/capture-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderID: data.orderID }),
                    });
                    const result = await res.json();
                    if (res.ok) {
                      setMessageType("success");
                      setMessage(`Purchased ${result.purchased} credits! New balance: ${result.credits}`);
                      await update();
                      router.refresh();
                    } else {
                      setMessageType("error");
                      setMessage(result.error || "Payment failed");
                    }
                  }}
                  onError={() => {
                    setMessageType("error");
                    setMessage("Payment was cancelled or failed");
                  }}
                />
              </div>
            ))}
          </div>
        </PayPalScriptProvider>
      )}

      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        <p>Credits are used to boost repositories (10 credits = 24h boost).</p>
        <p className="mt-1">Boosted repos appear at the top of all listings with a Promoted badge.</p>
      </div>
    </div>
  );
}
