import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug, getRelatedProducts } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import { businessConfig } from "@/config/business";
import { effectivePrice } from "@/lib/utils";
import ProductDetailClient from "./ProductDetailClient";

interface ProductPageProps {
  params: { slug: string };
}

// Pre-render known products at build time; new ones added in the admin
// render on first visit. If Supabase is unreachable during the build, skip
// pre-rendering instead of failing the deploy.
export async function generateStaticParams() {
  try {
    const products = await getAllProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch (err) {
    console.error("[products] generateStaticParams failed:", err);
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | ${product.brand}`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [category, relatedProducts] = await Promise.all([
    getCategoryBySlug(product.category),
    getRelatedProducts(product),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.image],
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    category: category?.name,
    offers: {
      "@type": "Offer",
      priceCurrency: businessConfig.currency,
      price: effectivePrice(product.price, product.salePrice),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://friendspharmacy.example.com/products/${product.slug}`,
    },
  };

  return (
    <>
      {/* Structured data for search engines (Product rich results). */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} category={category} relatedProducts={relatedProducts} />
    </>
  );
}
