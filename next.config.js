/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Demo product/banner images are local SVG placeholders in /public.
    // They're served directly (unoptimized) instead of through Next's
    // image optimizer: there's nothing to gain from resizing/optimizing a
    // tiny hand-drawn SVG, and it avoids the optimizer's SVG-specific CSP
    // header, which some browser/security configurations reject outright
    // (showing a broken-image icon instead of the picture).
    //
    // If you later add real product photos (JPG/PNG), you can remove this
    // and let Next optimize those normally — this setting only matters for
    // the SVG placeholders.
    unoptimized: true,
    // Real product photos are stored in Supabase Storage (the same project
    // as the database) and referenced by their public URL. This is only
    // needed if `unoptimized` above is ever turned back on — with it set to
    // true, Next.js serves images as-is and doesn't check this list.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fkegoefbkoqxvboggksd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
