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
          <Link href="/" className="text-xl font-bold flex items-center gap-2 no-underline hover:no-underline">
            <span style={{ color: "var(--gold)" }}>&#9733;</span>
            <span style={{ color: "var(--text)" }}>PimpMyGit</span>
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
    </nav>
  );
}
