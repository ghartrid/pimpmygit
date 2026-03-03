import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PimpMyGit - Discover & Promote GitHub Repos",
  description: "Upvote the best GitHub repositories. Boost yours for more exposure.",
  verification: {
    google: "iRJE4BUO9NQZIU12VHPxyzQ8WDmx-wOgabKmDUvDVWo",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
