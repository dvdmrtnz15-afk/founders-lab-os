import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow local/dev origins for hot-reload and testing on LAN devices.
  // If you need to allow other hosts (e.g. your phone on the LAN),
  // update them dynamically with an environment variable. Example:
  //   ALLOWED_DEV_ORIGINS=127.0.0.1,localhost,192.168.1.81
  // then parse it (uncomment the line below to enable):
  //   allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || ['127.0.0.1','localhost'],
  // Default to localhost-only here to avoid committing machine-specific IPs.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["127.0.0.1", "localhost"],
};

export default nextConfig;
