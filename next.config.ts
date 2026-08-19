import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
  serverExternalPackages: ["ssh2", "ssh2-sftp-client"],
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
