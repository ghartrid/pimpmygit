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
            <img src="data:image/png;base64,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" alt="PimpMyGit" width={36} height={36} className="flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(255,215,0,0.5))", minWidth: 36, minHeight: 36 }} />
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
