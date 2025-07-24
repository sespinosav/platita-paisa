import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // Ignora errores de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
}



export default nextConfig;
