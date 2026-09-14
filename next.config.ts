import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin pulls in jwks-rsa -> jose, and jose ships as pure ESM while jwks-rsa still
  // does a CommonJS require() of it. Left alone, Vercel's serverless bundler re-traces and bundles
  // that chain and hits ERR_REQUIRE_ESM. Marking the package external skips the bundling/tracing
  // for it entirely, so it's resolved from node_modules at runtime the normal way instead.
  serverExternalPackages: ['firebase-admin'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
