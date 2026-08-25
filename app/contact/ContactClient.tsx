"use client";

import { useState } from "react";
import { Phone, MessageCircle, MapPin, Mail, Clock, Navigation } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { businessConfig } from "@/config/business";
import { buildTelUrl, buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { useToast } from "@/lib/toast-context";

interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const initialState: ContactFormState = { name: "", phone: "", email: "", message: "" };

export default function ContactClient() {
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<Partial<ContactFormState>>({});
  const { showToast } = useToast();

  const update = (key: keyof ContactFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<ContactFormState> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.message.trim()) nextErrors.message = "Message is required";
    if (!form.phone.trim() && !form.email.trim()) {
      nextErrors.phone = "Provide a phone or email so we can reply";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // This MVP has no backend yet, so the contact form hands off to the
    // pharmacy's email client with the message pre-filled. When a real
    // backend is added, replace this with a POST to e.g. /api/contact
    // (see README "What to add in Phase 2").
    const subject = encodeURIComponent(`Website message from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:${businessConfig.email}?subject=${subject}&body=${body}`;
    showToast("Opening your email app to send this message…", "info");
    setForm(initialState);
  };

  return (
    <div className="container-page py-10 pb-16">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Contact Us</h1>
      <p className="mb-8 max-w-2xl text-sm text-gray-600">
        Have a question about a product, an order, or a prescription? Reach
        out — we&apos;re happy to help.
      </p>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="card flex flex-col gap-4 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">{businessConfig.name}</h2>
            <ul className="flex flex-col gap-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                {businessConfig.address}
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <a href={buildTelUrl()} className="hover:text-brand-700">
                  {businessConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <a
                  href={buildWhatsAppContactUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-700"
                >
                  {businessConfig.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <a href={`mailto:${businessConfig.email}`} className="hover:text-brand-700">
                  {businessConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                {businessConfig.openingHours}
              </li>
            </ul>

            <div className="flex flex-wrap gap-2 pt-2">
              <a href={buildTelUrl()} className="btn-primary">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call Now
              </a>
              <a
                href={buildWhatsAppContactUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp Us
              </a>
              <a
                href={businessConfig.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Get Directions
              </a>
            </div>
          </div>

          <div className="card overflow-hidden">
            {businessConfig.googleMapsEmbedUrl ? (
              <iframe
                title="Pharmacy location map"
                src={businessConfig.googleMapsEmbedUrl}
                className="h-64 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 bg-brand-50 text-center text-sm text-gray-500">
                <MapPin className="h-8 w-8 text-brand-300" aria-hidden="true" />
                <p className="max-w-xs px-4">
                  Map preview placeholder — add a Google Maps embed URL in{" "}
                  <code className="rounded bg-white px-1 py-0.5">config/business.ts</code>{" "}
                  (googleMapsEmbedUrl) once your pharmacy&apos;s exact address
                  is confirmed.
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Send Us a Message</h2>

          <div>
            <label htmlFor="contact-name" className="label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              required
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-phone" className="label">
                Phone
              </label>
              <input
                id="contact-phone"
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="contact-email" className="label">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="label">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contact-message"
              className="input min-h-[120px]"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              aria-invalid={Boolean(errors.message)}
              required
            />
            {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto sm:self-start sm:px-8">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
