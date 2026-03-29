import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/portal.qoliber.com",
        destination: "/",
        permanent: true,
      },
      // MkDocs migration redirects — strip .html extensions
      {
        source: "/docs/:path*.html",
        destination: "/docs/:path*",
        permanent: true,
      },
      // MkDocs migration — old /extensions/ paths without /docs/ prefix
      {
        source: "/extensions/:path*",
        destination: "/docs/extensions/:path*",
        permanent: true,
      },
      // /docs/index → /docs (index.md is rendered at /docs)
      {
        source: "/docs/index",
        destination: "/docs",
        permanent: true,
      },
      // Same for any section: /docs/open-source/index → /docs/open-source
      {
        source: "/docs/:path*/index",
        destination: "/docs/:path*",
        permanent: true,
      },
      // Trailing slash normalization
      {
        source: "/docs/:path*/",
        destination: "/docs/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
