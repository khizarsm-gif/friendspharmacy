import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
      <div className="container-page grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-20">
        <div className="flex flex-col items-start gap-5">
          <span className="badge bg-brand-100 text-brand-700">
            Genuine medicines &bull; Fast local delivery
          </span>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Your Trusted Pharmacy, Just a Click Away
          </h1>
          <p className="max-w-xl text-base text-gray-600 sm:text-lg">
            Shop healthcare essentials, medicines, personal care products, and
            more from your trusted local pharmacy.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/shop" className="btn-primary">
              Shop Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contact" className="btn-secondary">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Contact Us
            </Link>
          </div>
        </div>

      <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 via-white to-accent-50 shadow-card-hover ring-1 ring-black/5">
  <div className="flex h-full flex-col items-center justify-center gap-6 p-10 text-center">
    <div className="relative h-28 w-full max-w-xs sm:h-36">
      <Image
        src="/images/logo.png"
        alt="Friends Pharmacy logo"
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 45vw"
        className="object-contain"
      />
    </div>
    <p className="text-base font-semibold uppercase tracking-widest text-brand-700 sm:text-lg">
      A Cure for a Happy Life
    </p>
  </div>
</div>
      </div>
    </section>
  );
}
