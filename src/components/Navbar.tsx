"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const { data: session, status } = useSession();
  const ext = session as Record<string, unknown> | null;

  return (
    <nav
      className="border-b sticky top-0 z-50 backdrop-blur-sm"
      style={{ borderColor: "var(--border)", background: "rgba(13,17,23,0.95)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 no-underline hover:no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-navbar.png" alt="PimpMyGit" width={36} height={36} className="flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.5))", minWidth: 36, minHeight: 36 }} />
            <span className="text-xl font-bold" style={{ color: "var(--text)" }}>PimpMyGit</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/" className="hover:no-underline" style={{ color: "var(--text-muted)" }}>
              Explore
            </Link>
            <Link href="/leaderboard" className="hover:no-underline" style={{ color: "var(--text-muted)" }}>
              Leaderboard
            </Link>
            {status === "authenticated" && (
              <Link href="/submit" className="hover:no-underline" style={{ color: "var(--green)" }}>
                + Submit
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {status === "authenticated" && ext ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm no-underline hover:no-underline"
                style={{ color: "var(--text)" }}
              >
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span className="hidden sm:inline">{ext.username as string || session?.user?.name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "var(--gold-glow)", color: "var(--gold)" }}
                >
                  {ext.credits as number ?? 0} credits
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm px-3 py-1.5 rounded-md border cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "transparent" }}
              >
                Sign out
              </button>
            </>
          ) : status === "loading" ? (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</span>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="text-sm px-4 py-1.5 rounded-md font-medium cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff", border: "none" }}
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14 border-t"
        style={{ borderColor: "var(--border)", background: "rgba(13,17,23,0.98)" }}
      >
        <Link href="/" className="flex flex-col items-center gap-0.5 text-xs no-underline" style={{ color: "var(--text-muted)" }}>
          <span className="text-lg">&#9733;</span>
          Explore
        </Link>
        <Link href="/leaderboard" className="flex flex-col items-center gap-0.5 text-xs no-underline" style={{ color: "var(--text-muted)" }}>
          <span className="text-lg">&#9650;</span>
          Top
        </Link>
        {status === "authenticated" ? (
          <Link href="/submit" className="flex flex-col items-center gap-0.5 text-xs no-underline" style={{ color: "var(--green)" }}>
            <span className="text-lg">+</span>
            Submit
          </Link>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="flex flex-col items-center gap-0.5 text-xs cursor-pointer"
            style={{ color: "var(--accent)", background: "none", border: "none" }}
          >
            <span className="text-lg">+</span>
            Submit
          </button>
        )}
        <Link href="/contact" className="flex flex-col items-center gap-0.5 text-xs no-underline" style={{ color: "var(--text-muted)" }}>
          <span className="text-lg">&#9993;</span>
          Contact
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-xs no-underline" style={{ color: "var(--text-muted)" }}>
          <span className="text-lg">&#9679;</span>
          Profile
        </Link>
      </div>
    </nav>
  );
}
