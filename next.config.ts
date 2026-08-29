import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@tauri-apps/api": false,
      "@tauri-apps/plugin-store": false,
      "@tauri-apps/plugin-stronghold": false,
    };
    return config;
  },
};

export default nextConfig;
