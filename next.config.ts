import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  webpack: (config, { webpack }) => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      "fs/promises": false,
      path: false,
      "@tauri-apps/api": false,
      "@tauri-apps/plugin-store": false,
      "@tauri-apps/plugin-stronghold": false,
    };
    return config;
  },
};

export default nextConfig;
