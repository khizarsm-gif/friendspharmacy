"use client";

import { useState } from "react";
import type { CheckoutDetails, DeliveryMethod, PaymentMethod } from "@/types";

interface CheckoutFormProps {
  onSubmit: (details: CheckoutDetails) => void;
  submitLabel?: string;
}

const initialState: CheckoutDetails = {
  fullName: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  deliveryMethod: "delivery",
  paymentMethod: "cod",
};

/**
 * Reusable checkout form. Collects customer + delivery + payment details.
 * No online payment fields are collected — cash on delivery / pay at
 * pharmacy only, per the current MVP scope (see /config/business.ts and
 * README for how to later wire up an online payment gateway).
 */
export default function CheckoutForm({ onSubmit, submitLabel = "Place Order" }: CheckoutFormProps) {
  const [details, setDetails] = useState<CheckoutDetails>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutDetails, string>>>({});

  const update = <K extends keyof CheckoutDetails>(key: K, value: CheckoutDetails[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CheckoutDetails, string>> = {};
    if (!details.fullName.trim()) next.fullName = "Full name is required";
    if (!details.phone.trim()) next.phone = "Phone number is required";
    if (!details.whatsapp.trim()) next.whatsapp = "WhatsApp number is required";
    if (details.deliveryMethod === "delivery") {
      if (!details.address.trim()) next.address = "Delivery address is required";
      if (!details.city.trim()) next.city = "City is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(details);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="label">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            className="input"
            value={details.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            required
          />
          {errors.fullName && (
            <p id="fullName-error" className="mt-1 text-xs text-red-500">
              {errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            className="input"
            value={details.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            required
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-red-500">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="whatsapp" className="label">
            WhatsApp Number <span className="text-red-500">*</span>
          </label>
          <input
            id="whatsapp"
            type="tel"
            className="input"
            value={details.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            aria-invalid={Boolean(errors.whatsapp)}
            aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
            required
          />
          {errors.whatsapp && (
            <p id="whatsapp-error" className="mt-1 text-xs text-red-500">
              {errors.whatsapp}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={details.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Delivery Method</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {(
            [
              { value: "delivery", label: "Home Delivery" },
              { value: "pickup", label: "Pharmacy Pickup" },
            ] as { value: DeliveryMethod; label: string }[]
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm hover:border-brand-300"
            >
              <input
                type="radio"
                name="deliveryMethod"
                className="h-4 w-4 accent-brand-600"
                checked={details.deliveryMethod === opt.value}
                onChange={() => update("deliveryMethod", opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {details.deliveryMethod === "delivery" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="address" className="label">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              className="input min-h-[80px]"
              value={details.address}
              onChange={(e) => update("address", e.target.value)}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              required
            />
            {errors.address && (
              <p id="address-error" className="mt-1 text-xs text-red-500">
                {errors.address}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="city" className="label">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              className="input"
              value={details.city}
              onChange={(e) => update("city", e.target.value)}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
              required
            />
            {errors.city && (
              <p id="city-error" className="mt-1 text-xs text-red-500">
                {errors.city}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="label">
          Additional Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          className="input min-h-[70px]"
          value={details.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="E.g. preferred delivery time, landmark, etc."
        />
      </div>

      <fieldset>
        <legend className="label">Payment Method</legend>
        <div className="flex flex-col gap-2 sm:flex-row">
          {(
            [
              { value: "cod", label: "Cash on Delivery" },
              { value: "pay-at-pharmacy", label: "Pay at Pharmacy" },
            ] as { value: PaymentMethod; label: string }[]
          ).map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm hover:border-brand-300"
            >
              <input
                type="radio"
                name="paymentMethod"
                className="h-4 w-4 accent-brand-600"
                checked={details.paymentMethod === opt.value}
                onChange={() => update("paymentMethod", opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Online payments are not yet available. You will pay in cash upon
          delivery or at the pharmacy counter.
        </p>
      </fieldset>

      <button type="submit" className="btn-primary w-full sm:w-auto sm:self-start sm:px-10">
        {submitLabel}
      </button>
    </form>
  );
}
