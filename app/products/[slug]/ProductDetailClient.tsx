"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, ShieldAlert, MessageCircle, Phone, Heart, Package } from "lucide-react";
import type { Category, Product } from "@/types";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";
import QuantitySelector from "@/components/QuantitySelector";
import { formatPrice, isOnSale, calculateDiscountPercent } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { useWishlist } from "@/lib/wishlist-context";
import { buildTelUrl, buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { businessConfig } from "@/config/business";

interface ProductDetailClientProps {
  product: Product;
  category?: Category;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  category,
  relatedProducts,
}: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const onSale = isOnSale(product.price, product.salePrice);
  const discount = calculateDiscountPercent(product.price, product.salePrice);
  const outOfStock = product.stock <= 0;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast(`${quantity} × ${product.name} added to cart`);
  };

  return (
    <div className="container-page pb-16">
      <Breadcrumbs
        items={[
          ...(category
            ? [{ label: category.name, href: `/shop?category=${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-brand-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {onSale && <span className="badge bg-red-600 text-white">-{discount}%</span>}
            {product.isDemo && <span className="badge bg-gray-900/80 text-white">Demo Product</span>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {category && (
            <Link
              href={`/shop?category=${category.slug}`}
              className="w-fit text-xs font-semibold uppercase tracking-wide text-brand-600 hover:underline"
            >
              {category.name}
            </Link>
          )}

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>
              Brand: <span className="font-medium text-gray-700">{product.brand}</span>
            </span>
            <span>
              SKU: <span className="font-medium text-gray-700">{product.sku}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onSale ? (
              <>
                <span className="text-3xl font-bold text-brand-800">
                  {formatPrice(product.salePrice as number)}
                </span>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-brand-800">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div>
            {outOfStock ? (
              <span className="badge bg-gray-200 text-gray-700">Out of Stock</span>
            ) : product.stock <= 10 ? (
              <span className="badge bg-amber-100 text-amber-700">
                Low Stock — only {product.stock} left
              </span>
            ) : (
              <span className="badge bg-brand-100 text-brand-700">In Stock</span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>

          {product.prescriptionRequired ? (
            <div className="card flex flex-col gap-3 border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 className="font-semibold">Prescription Required</h2>
              </div>
              <p className="text-sm text-amber-800">
                Please contact the pharmacy to confirm availability and
                prescription requirements. This product cannot be added to
                the cart for online checkout.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildWhatsAppContactUrl(
                    `Hello ${businessConfig.name}, I would like to ask about ${product.name} (prescription required).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Contact Pharmacy
                </a>
                <a href={buildTelUrl()} className="btn-secondary">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call Pharmacy
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="label !mb-0">Quantity</span>
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  max={Math.max(product.stock, 1)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className="btn-primary flex-1 sm:flex-none sm:px-8"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  {outOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-pressed={wishlisted}
                  className="btn-secondary"
                >
                  <Heart
                    className="h-4 w-4"
                    aria-hidden="true"
                    fill={wishlisted ? "currentColor" : "none"}
                    color={wishlisted ? "#ef4444" : "currentColor"}
                  />
                  {wishlisted ? "Wishlisted" : "Wishlist"}
                </button>
              </div>
            </div>
          )}

          {product.keyInfo && product.keyInfo.length > 0 && (
            <div className="card flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Key Information</h2>
              </div>
              <ul className="ml-6 list-disc space-y-1 text-sm text-gray-600">
                {product.keyInfo.map((info, idx) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">
            {businessConfig.disclaimer}
          </p>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
            Related Products
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
