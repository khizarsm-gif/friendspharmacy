import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { businessConfig } from "@/config/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${businessConfig.name}.`,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container-page py-10 pb-16">
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
      <div className="prose-sm mx-auto max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mb-4 text-sm text-gray-500">
          Placeholder policy — replace with your pharmacy&apos;s reviewed
          privacy policy before launch.
        </p>

        <div className="flex flex-col gap-5 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-1 text-base font-semibold text-gray-900">
              Information We Collect
            </h2>
            <p>
              When you place an order or contact us through this website, we
              collect information you provide directly, such as your name,
              phone number, WhatsApp number, email address, and delivery
              address, in order to process and deliver your order.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-gray-900">
              How We Use Your Information
            </h2>
            <p>
              We use the information you provide solely to fulfill orders,
              respond to inquiries, and improve our service. We do not sell
              your personal information to third parties.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-gray-900">
              WhatsApp Ordering
            </h2>
            <p>
              Orders placed via WhatsApp are sent directly to our pharmacy&apos;s
              WhatsApp number. Message content is subject to WhatsApp&apos;s own
              privacy practices.
            </p>
          </section>
          <section>
            <h2 className="mb-1 text-base font-semibold text-gray-900">
              Contact Us
            </h2>
            <p>
              Questions about this policy can be sent to{" "}
              <a href={`mailto:${businessConfig.email}`} className="text-brand-700 hover:underline">
                {businessConfig.email}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
