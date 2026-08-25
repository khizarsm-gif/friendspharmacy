import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BackToTop from "@/components/BackToTop";
import Providers from "@/components/Providers";
import { businessConfig } from "@/config/business";

const siteUrl = "https://friendspharmacy.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${businessConfig.name} | Trusted Pharmacy in ${businessConfig.city}`,
    template: `%s | ${businessConfig.name}`,
  },
  description: `${businessConfig.tagline}. Shop medicines, vitamins, personal care and more from ${businessConfig.name} in ${businessConfig.city}, ${businessConfig.country}.`,
  keywords: [
    "pharmacy",
    businessConfig.city,
    "online pharmacy",
    "medicines",
    "healthcare products",
  ],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: businessConfig.name,
    title: `${businessConfig.name} | Trusted Pharmacy in ${businessConfig.city}`,
    description: businessConfig.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: `${businessConfig.name} | Trusted Pharmacy in ${businessConfig.city}`,
    description: businessConfig.tagline,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton variant="floating" />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
