import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["<lan-ip>", "<tailscale-ip>"],
};

export default nextConfig;
