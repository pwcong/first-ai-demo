import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      rules: {
        // Enables Turbopack for `next dev`
        '**/*': ['typescript', 'postcss']
      }
    }
  }
};

export default nextConfig;
