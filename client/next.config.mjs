/** @type {import('next').NextConfig} */
import pkg from "./next-i18next.config.js";
const { i18n } = pkg;
const nextConfig = {
  i18n,
  reactStrictMode: true,
  images: {
    domains: ["useprd-cdn-s.care.com"], // Add the external domain here
  },
};
export default nextConfig;
