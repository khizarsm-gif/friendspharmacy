import Link from "next/link";
import { Cross, Phone, MessageCircle, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { businessConfig } from "@/config/business";
import type { Category } from "@/types";
import { buildTelUrl, buildWhatsAppContactUrl } from "@/lib/whatsapp";

export default function Footer({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-brand-950 text-brand-100">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Cross className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-white">{businessConfig.name}</span>
          </Link>
          <p className="text-sm text-brand-200">
            Your trusted local pharmacy for medicines, wellness essentials, and
            personal care — genuine products, delivered.
          </p>
          <div className="flex gap-3 pt-1">
            {businessConfig.social.facebook && (
              <a
                href={businessConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Friends Pharmacy on Facebook"
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {businessConfig.social.instagram && (
              <a
                href={businessConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Friends Pharmacy on Instagram"
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {businessConfig.social.twitter && (
              <a
                href={businessConfig.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Friends Pharmacy on Twitter"
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Quick Links
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-brand-200">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Categories
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-brand-200">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/shop?category=${cat.slug}`} className="hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Contact Us
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-brand-200">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{businessConfig.address}</span>
            </li>
            <li>
              <a href={buildTelUrl()} className="flex items-center gap-2 hover:text-white">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                {businessConfig.phone}
              </a>
            </li>
            <li>
              <a
                href={buildWhatsAppContactUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {businessConfig.whatsapp}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${businessConfig.email}`}
                className="flex items-center gap-2 hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {businessConfig.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{businessConfig.openingHours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-300 sm:flex-row">
          <p>© {year} {businessConfig.name}. All rights reserved.</p>
          <p className="text-center sm:text-right">{businessConfig.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
