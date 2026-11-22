import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a second dev server (e.g. the backend session on port 3001) use its own
  // build folder so it never collides with the main one: NEXT_DIST_DIR=.next-backend
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Hide the floating "N" dev badge: it sat on top of the logo and looked like a site bug.
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Uploaded covers and avatars (Cloudinary) and Google profile photos.
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
