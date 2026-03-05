"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface UserRepo {
  id: number;
  name: string;
  owner: string;
  description: string;
  upvote_count: number;
  created_at: string;
}

interface UserCollection {
  id: number;
  title: string;
  description: string;
  repo_count: number;
  created_at: string;
}

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
  const [myRepos, setMyRepos] = useState<UserRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [deletingRepo, setDeletingRepo] = useState<number | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [myCollections, setMyCollections] = useState<UserCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [creatingCol, setCreatingCol] = useState(false);
  const [sponsorRepoId, setSponsorRepoId] = useState("");
  const [sponsorSlot, setSponsorSlot] = useState("1");
  const [sponsorDuration, setSponsorDuration] = useState("1d");
  const [sponsoring, setSponsoring] = useState(false);

  const fetchMyRepos = useCallback(async () => {
    try {
      const res = await fetch("/api/repos?mine=1");
      const data = await res.json();
      setMyRepos(data.repos || []);
    } catch { /* ignore */ }
    setLoadingRepos(false);
  }, []);

  useEffect(() => {
    fetch("/api/paypal/client-id")
      .then((res) => res.json())
      .then((data) => setPaypalClientId(data.clientId))
      .catch(() => setPaypalClientId(""));
  }, []);

  const fetchMyCollections = useCallback(async () => {
    if (!ext?.userId) return;
    try {
      const res = await fetch(`/api/collections?user=${ext.userId}`);
      const data = await res.json();
      setMyCollections(data.collections || []);
    } catch { /* ignore */ }
    setLoadingCollections(false);
  }, [ext?.userId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMyRepos();
      fetchMyCollections();
    }
  }, [status, fetchMyRepos, fetchMyCollections]);

  const handleDeleteRepo = async (repoId: number) => {
    if (!confirm("Are you sure you want to delete this repo? This cannot be undone.")) return;
    setDeletingRepo(repoId);
    try {
      const res = await fetch(`/api/repos/${repoId}/delete`, { method: "DELETE" });
      if (res.ok) {
        setMyRepos((prev) => prev.filter((r) => r.id !== repoId));
        setMessageType("success");
        setMessage("Repo deleted successfully");
      } else {
        const data = await res.json();
        setMessageType("error");
        setMessage(data.error || "Failed to delete repo");
      }
    } catch {
      setMessageType("error");
      setMessage("Network error");
    }
    setDeletingRepo(null);
  };

  const handleCreateCollection = async () => {
    if (!newColTitle.trim()) return;
    setCreatingCol(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newColTitle.trim(), description: newColDesc.trim() }),
      });
      if (res.ok) {
        setNewColTitle("");
        setNewColDesc("");
        setMessageType("success");
        setMessage("Collection created!");
        await fetchMyCollections();
      } else {
        const data = await res.json();
        setMessageType("error");
        setMessage(data.error || "Failed to create collection");
      }
    } catch {
      setMessageType("error");
      setMessage("Network error");
    }
    setCreatingCol(false);
  };

  const handleDeleteCollection = async (colId: number) => {
    if (!confirm("Delete this collection?")) return;
    try {
      const res = await fetch(`/api/collections/${colId}`, { method: "DELETE" });
      if (res.ok) {
        setMyCollections((prev) => prev.filter((c) => c.id !== colId));
        setMessageType("success");
        setMessage("Collection deleted");
      }
    } catch { /* ignore */ }
  };

  const handleSponsor = async () => {
    if (!sponsorRepoId) return;
    setSponsoring(true);
    try {
      const res = await fetch("/api/sponsored", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: parseInt(sponsorRepoId, 10), slot: parseInt(sponsorSlot, 10), duration: sponsorDuration }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessageType("success");
        setMessage(`Sponsored! ${data.credits} credits remaining.`);
        await update();
        router.refresh();
      } else {
        setMessageType("error");
        setMessage(data.error || "Failed to sponsor");
      }
    } catch {
      setMessageType("error");
      setMessage("Network error");
    }
    setSponsoring(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account, all your repos, votes, and credits. This CANNOT be undone.")) return;
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        setMessageType("error");
        setMessage(data.error || "Failed to delete account");
        setDeletingAccount(false);
      }
    } catch {
      setMessageType("error");
      setMessage("Network error");
      setDeletingAccount(false);
    }
  };

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

      <div className="text-xs mb-8" style={{ color: "var(--text-muted)" }}>
        <p>Credits are used to boost repositories: 10cr/24h, 25cr/3 days, 50cr/7 days.</p>
        <p className="mt-1">Boosted repos appear at the top of all listings with a Promoted badge.</p>
        <p className="mt-1">Sponsored slots (100cr/day) give premium homepage placement.</p>
      </div>

      {/* My Repos */}
      <h2 className="text-lg font-bold mb-4">My Repos</h2>
      {loadingRepos ? (
        <div className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Loading repos...</div>
      ) : myRepos.length === 0 ? (
        <div
          className="rounded-xl border p-6 text-center mb-8"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>You haven&apos;t submitted any repos yet.</p>
          <Link
            href="/submit"
            className="inline-block px-4 py-2 rounded-lg text-sm font-medium no-underline"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + Submit a Repo
          </Link>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {myRepos.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xl border p-4 flex items-center justify-between"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/repo/${repo.id}`}
                  className="font-medium text-sm no-underline hover:underline"
                  style={{ color: "var(--text)" }}
                >
                  {repo.owner}/{repo.name}
                </Link>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {repo.upvote_count} upvotes &middot; {new Date(repo.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteRepo(repo.id)}
                disabled={deletingRepo === repo.id}
                className="ml-3 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                style={{
                  background: "rgba(248,81,73,0.1)",
                  color: "var(--red)",
                  border: "1px solid rgba(248,81,73,0.3)",
                  opacity: deletingRepo === repo.id ? 0.5 : 1,
                }}
              >
                {deletingRepo === repo.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Collections */}
      <h2 className="text-lg font-bold mb-4">My Collections</h2>
      {loadingCollections ? (
        <div className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Loading collections...</div>
      ) : (
        <>
          {myCollections.length > 0 && (
            <div className="space-y-3 mb-4">
              {myCollections.map((col) => (
                <div
                  key={col.id}
                  className="rounded-xl border p-4 flex items-center justify-between"
                  style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/collections/${col.id}`}
                      className="font-medium text-sm no-underline hover:underline"
                      style={{ color: "var(--text)" }}
                    >
                      {col.title}
                    </Link>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {col.repo_count} {col.repo_count === 1 ? "repo" : "repos"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCollection(col.id)}
                    className="ml-3 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: "rgba(248,81,73,0.1)", color: "var(--red)", border: "1px solid rgba(248,81,73,0.3)" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            className="rounded-xl border p-4 mb-8"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-bold mb-2">Create Collection</h3>
            <input
              type="text"
              placeholder="Collection title"
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-2"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-2"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={handleCreateCollection}
              disabled={creatingCol || !newColTitle.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff", border: "none" }}
            >
              {creatingCol ? "Creating..." : "Create"}
            </button>
          </div>
        </>
      )}

      {/* Sponsor a Repo */}
      {myRepos.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-4">Sponsor a Repo</h2>
          <div
            className="rounded-xl border p-4 mb-8"
            style={{ background: "var(--bg-card)", borderColor: "var(--gold)" }}
          >
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              Get premium homepage placement. Pricing: 100cr/day, 250cr/3 days, 400cr/7 days.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select
                value={sponsorRepoId}
                onChange={(e) => setSponsorRepoId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="">Select a repo</option>
                {myRepos.map((r) => (
                  <option key={r.id} value={r.id}>{r.owner}/{r.name}</option>
                ))}
              </select>
              <select
                value={sponsorSlot}
                onChange={(e) => setSponsorSlot(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="1">Slot 1</option>
                <option value="2">Slot 2</option>
              </select>
              <select
                value={sponsorDuration}
                onChange={(e) => setSponsorDuration(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <option value="1d">1 day (100cr)</option>
                <option value="3d">3 days (250cr)</option>
                <option value="7d">7 days (400cr)</option>
              </select>
            </div>
            <button
              onClick={handleSponsor}
              disabled={sponsoring || !sponsorRepoId}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: "var(--gold)", color: "#000", border: "none" }}
            >
              {sponsoring ? "Sponsoring..." : "Sponsor"}
            </button>
          </div>
        </>
      )}

      {/* Delete Account */}
      <div
        className="rounded-xl border p-6 mt-8"
        style={{ background: "var(--bg-card)", borderColor: "rgba(248,81,73,0.3)" }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--red)" }}>Danger Zone</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Permanently delete your account, all your submitted repos, votes, and credits.
          This action cannot be undone.
        </p>
        {!showDeleteAccount ? (
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
            style={{
              background: "transparent",
              color: "var(--red)",
              border: "1px solid rgba(248,81,73,0.5)",
            }}
          >
            Delete My Account
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
              style={{
                background: "var(--red)",
                color: "#fff",
                border: "none",
                opacity: deletingAccount ? 0.5 : 1,
              }}
            >
              {deletingAccount ? "Deleting..." : "Yes, Delete Everything"}
            </button>
            <button
              onClick={() => setShowDeleteAccount(false)}
              className="px-4 py-2 rounded-lg text-sm cursor-pointer"
              style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
