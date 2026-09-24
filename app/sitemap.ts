import type { MetadataRoute } from "next";
import { getAllProducts } from "@/data/products";

const siteUrl = "https://friendspharmacy.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    productRoutes = (await getAllProducts()).map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: new Date(product.createdAt),
    }));
  } catch (err) {
    console.error("[sitemap] Failed to load products:", err);
  }

  return [...staticRoutes, ...productRoutes];
}
