/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    turbo: false, // Disable Turbopack - causes CSS parsing issues with SCSS
  },
  env: {
    // Replace below URL with your current Domain
    API_PROD_URL: process.env.API_PROD_URL,
    storageURL: process.env.STORAGE_URL,
  },
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/en",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1:3000",
      },
      {
        protocol: "http",
        hostname: "res.cloudinary.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
      },
    ],
  },
};

module.exports = nextConfig;
