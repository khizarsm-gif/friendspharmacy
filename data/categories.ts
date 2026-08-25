import type { Category } from "@/types";

/**
 * Product categories shown on the homepage and used as the /shop filter.
 * Add or rename categories here — just make sure every product in
 * data/products.ts uses a `category` value that matches a `slug` below.
 */
export const categories: Category[] = [
  {
    slug: "medicines",
    name: "Medicines",
    icon: "Pill",
    description: "Everyday medicines and treatments",
  },
  {
    slug: "vitamins-supplements",
    name: "Vitamins & Supplements",
    icon: "Sparkles",
    description: "Boost immunity and daily wellness",
  },
  {
    slug: "personal-care",
    name: "Personal Care",
    icon: "ShowerHead",
    description: "Everyday hygiene essentials",
  },
  {
    slug: "baby-care",
    name: "Baby Care",
    icon: "Baby",
    description: "Gentle products for your little one",
  },
  {
    slug: "beauty-skincare",
    name: "Beauty & Skincare",
    icon: "Flower2",
    description: "Skincare and beauty essentials",
  },
  {
    slug: "medical-devices",
    name: "Medical Devices",
    icon: "Stethoscope",
    description: "Monitors, thermometers and more",
  },
  {
    slug: "first-aid",
    name: "First Aid",
    icon: "Cross",
    description: "Be prepared for minor emergencies",
  },
  {
    slug: "health-wellness",
    name: "Health & Wellness",
    icon: "HeartPulse",
    description: "General wellbeing products",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
