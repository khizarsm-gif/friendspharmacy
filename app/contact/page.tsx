import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import { businessConfig } from "@/config/business";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${businessConfig.name} — call, WhatsApp, or visit us in ${businessConfig.city}. See our opening hours and location.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactClient />;
}
