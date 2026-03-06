import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { WebCounter } from "@/components/WebCounter";

export const metadata: Metadata = {
  metadataBase: new URL("https://pimpmygit.com"),
  title: "PimpMyGit - Discover & Promote GitHub Repos",
  description: "Upvote the best GitHub repositories. Boost yours for more exposure.",
  verification: {
    google: "iRJE4BUO9NQZIU12VHPxyzQ8WDmx-wOgabKmDUvDVWo",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icon-180.png", sizes: "180x180" },
  },
  openGraph: {
    title: "PimpMyGit - Discover & Promote GitHub Repos",
    description: "Upvote the best GitHub repositories. Boost yours for more exposure.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PimpMyGit - Discover & Promote GitHub Repos",
    description: "Upvote the best GitHub repositories. Boost yours for more exposure.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
        <link rel="alternate" type="application/rss+xml" title="PimpMyGit - Trending Repos" href="/feed.xml" />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Z5PVSBGKCB"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Z5PVSBGKCB');
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <Providers>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8 pb-20 sm:pb-8">{children}</main>
          <footer className="hidden sm:block border-t text-center py-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-center gap-4">
              <a
                href="/contact"
                className="inline-block px-6 py-2.5 rounded-lg font-medium text-sm no-underline hover:no-underline"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                &#9993; Contact Us
              </a>
              <a
                href="/api-docs"
                className="inline-block px-4 py-2 rounded-lg text-sm no-underline hover:no-underline"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                API
              </a>
              <a
                href="/feed.xml"
                className="inline-block px-4 py-2 rounded-lg text-sm no-underline hover:no-underline"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                RSS
              </a>
              <a
                href="/stats"
                className="inline-block px-4 py-2 rounded-lg text-sm no-underline hover:no-underline"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Stats
              </a>
              <a
                href="/weekly"
                className="inline-block px-4 py-2 rounded-lg text-sm no-underline hover:no-underline"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Weekly
              </a>
            </div>
            <div className="mt-4 flex justify-center">
              <a
                href="https://www.producthunt.com/products/pimpmygit?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-pimpmygit"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="PimpMyGit - The Missing Front Page for Github | Product Hunt"
                  width={250}
                  height={54}
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1090929&theme=light&t=1772747609395"
                />
              </a>
            </div>
            <div className="mt-4">
              <WebCounter />
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
