import type { MetadataRoute } from "next";
import { getAllProducts } from "@/data/products";

const siteUrl = "https://friendspharmacy.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/cart",
    "/checkout",
    "/privacy-policy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = getAllProducts().map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: new Date(product.createdAt),
  }));

  return [...staticRoutes, ...productRoutes];
}
