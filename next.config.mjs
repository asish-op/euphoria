/** @type {import('next').NextConfig} */
const nextConfig = {
  // Order IDs are created at runtime, so /order/[orderId] needs Next.js routing.
  images: { unoptimized: true },
  allowedDevOrigins: ["192.168.29.252", "*.local"],
};

export default nextConfig;
