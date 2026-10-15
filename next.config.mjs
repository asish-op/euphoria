/** @type {import('next').NextConfig} */
const nextConfig = {
  // Order IDs are created at runtime, so /order/[orderId] needs Next.js routing.
  images: { unoptimized: true },
};

export default nextConfig;
