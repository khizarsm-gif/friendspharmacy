import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/Hero";
import TrustBadges from "@/components/TrustBadges";
import CategoryCard from "@/components/CategoryCard";
import ProductGrid from "@/components/ProductGrid";
import { getCategories } from "@/data/categories";
import { getAllProducts } from "@/data/products";
import { businessConfig } from "@/config/business";

export const metadata: Metadata = {
  title: `${businessConfig.name} | Trusted Pharmacy in ${businessConfig.city}`,
  description: `${businessConfig.tagline}. Shop medicines, vitamins, personal care and more with fast local delivery in ${businessConfig.city}.`,
  alternates: { canonical: "/" },
};

// Rebuild the cached homepage at most every 5 minutes (admin saves refresh it instantly).
export const revalidate = 300;

async function loadHomeData() {
  try {
    const [allProducts, categories] = await Promise.all([getAllProducts(), getCategories()]);
    return { allProducts, categories };
  } catch (err) {
    // Don't fail the build/page if Supabase is briefly unreachable.
    console.error("[home] Failed to load catalog:", err);
    return { allProducts: [], categories: [] };
  }
}

export default async function HomePage() {
  const { allProducts, categories } = await loadHomeData();
  const featuredProducts = allProducts.filter((p) => p.featured);
  const hasDemoProducts = featuredProducts.some((p) => p.isDemo);
  const countByCategory = allProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Hero />
      <TrustBadges />

      <section id="categories" className="container-page py-14 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Find exactly what you need, organized for you.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:flex"
          >
            View All
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              count={countByCategory[category.slug] ?? 0}
            />
          ))}
        </div>
      </section>

      <section className="bg-brand-50/60 py-14 sm:py-16">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Featured Products
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Popular picks from our shelves.
                {hasDemoProducts && (
                  <span className="font-medium text-brand-700">
                    {" "}(Demo products, replace with real inventory)
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:flex"
            >
              View All
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
          <div className="mt-8 flex justify-center sm:hidden">
            <Link href="/shop" className="btn-secondary">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="card flex flex-col items-center gap-4 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Need help finding the right product?
          </h2>
          <p className="max-w-xl text-sm text-gray-600 sm:text-base">
            Our pharmacy team is ready to help over phone or WhatsApp — from
            product availability to prescription queries.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">
              Contact Us
            </Link>
            <a href={`tel:${businessConfig.phoneRaw}`} className="btn-secondary">
              Call {businessConfig.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
