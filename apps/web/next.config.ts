import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The engine and island are TypeScript source packages shared with the extension.
  transpilePackages: ["@pv/engine", "@pv/island"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
