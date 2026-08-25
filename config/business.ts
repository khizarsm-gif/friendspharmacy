/**
 * ============================================================================
 * CENTRAL BUSINESS CONFIGURATION
 * ============================================================================
 * This is the ONE file you need to edit to update pharmacy information
 * across the entire website: name, contact details, address, hours,
 * delivery fee, currency, and social links.
 *
 * Nothing else in the codebase should hardcode this information — every
 * component/page imports it from here. Update the values below and the
 * whole site (header, footer, contact page, WhatsApp messages, checkout,
 * SEO metadata, etc.) updates automatically.
 * ============================================================================
 */

export const businessConfig = {
  name: "Friends Pharmacy",
  tagline: "Your Trusted Pharmacy & Healthcare Partner",
  legalName: "Friends Pharmacy",

  // Used in SEO titles like "Friends Pharmacy | Trusted Pharmacy in Lahore"
  city: "Lahore",
  country: "Pakistan",

  // --- Contact information -------------------------------------------------
  phone: "+92 304 0286986",
  // Raw digits only (no +, spaces, or dashes) — used to build tel:/wa.me links.
  phoneRaw: "923040286986",
  whatsapp: "+92 304 0286986",
  // Raw digits only, international format, no leading + — required by wa.me links.
  whatsappRaw: "923040286986",
  // TODO: placeholder — you didn't provide a real email yet; update when ready.
  email: "info@example.com",

  // --- Location --------------------------------------------------------------
  address: "03 Tulip Overseas Commercial, Park View City, Lahore, Pakistan",
  // Optional: paste a Google Maps embed src URL here once you have a real address.
  googleMapsEmbedUrl: "",
  googleMapsDirectionsUrl: "https://share.google/BwRsqK1RLApC05GVi",

  // --- Hours -------------------------------------------------------------
  openingHours: "Monday – Sunday: 8:00 AM – 2:00 AM",
  openingHoursDetailed: [
    { days: "Monday – Sunday", hours: "8:00 AM – 2:00 AM" },
  ],

  // --- Commerce ------------------------------------------------------------
  currency: "PKR",
  currencySymbol: "PKR",
  deliveryFee: 50,
  freeDeliveryThreshold: 1000,

  // --- Social links (leave blank string to hide an icon in the footer) ----
  social: {
    facebook: "",
    instagram: "",
    twitter: "",
  },

  // --- Misc ------------------------------------------------------------------
  disclaimer:
    "Product information provided on this website is for general information only. Please consult a qualified healthcare professional for medical advice.",
} as const;

export type BusinessConfig = typeof businessConfig;
