import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
  serverExternalPackages: ["sql.js"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.hcaptcha.com https://hcaptcha.com https://www.paypal.com https://www.sandbox.paypal.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://avatars.githubusercontent.com https://github.com https://*.hcaptcha.com https://hcaptcha.com https://api.producthunt.com data:",
              "connect-src 'self' https://www.google-analytics.com https://*.hcaptcha.com https://hcaptcha.com",
              "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://*.hcaptcha.com https://hcaptcha.com",
              "font-src 'self'",
              "worker-src 'self' blob: https://*.hcaptcha.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
