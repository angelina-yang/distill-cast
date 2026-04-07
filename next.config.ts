import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@anthropic-ai/sdk", "@elevenlabs/elevenlabs-js"],
};

export default nextConfig;
