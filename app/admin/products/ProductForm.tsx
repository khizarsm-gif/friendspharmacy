"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { Category, Product } from "@/types";
import ImageUpload from "../_components/ImageUpload";
import { createProduct, updateProduct, type ActionState } from "./actions";

interface ProductFormProps {
  categories: Category[];
  mode: "create" | "edit";
  product?: Product;
}

const initialState: ActionState = { error: null };

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
}

function SubmitButton({ label, blocked }: { label: string; blocked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || blocked} className="btn-primary">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? "Saving…" : blocked ? "Waiting for upload…" : label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function ProductForm({ categories, mode, product }: ProductFormProps) {
  const action = mode === "edit" && product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useFormState(action, initialState);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {state.error}
          </p>
        )}

        <Section title="Basic details">
          <div>
            <label htmlFor="name" className="label">Product name *</label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="slug" className="label">URL slug</label>
            <div className="flex items-center rounded-xl border border-gray-300 bg-gray-50 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
              <span className="pl-4 text-sm text-gray-400">/products/</span>
              <input
                id="slug"
                name="slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="w-full rounded-r-xl bg-transparent px-1 py-2.5 text-sm text-gray-900 focus:outline-none"
              />
            </div>
            {mode === "edit" && (
              <p className="mt-1 text-xs text-gray-500">Changing this changes the product&apos;s live URL.</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand" className="label">Brand *</label>
              <input id="brand" name="brand" defaultValue={product?.brand} required className="input" />
            </div>
            <div>
              <label htmlFor="category" className="label">Category *</label>
              <select id="category" name="category" defaultValue={product?.category ?? ""} required className="input">
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  No categories yet. <Link href="/admin/categories/new" className="underline">Add one first</Link>.
                </p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="description" className="label">Description *</label>
            <textarea id="description" name="description" defaultValue={product?.description} required rows={4} className="input" />
          </div>
          <div>
            <label htmlFor="keyInfo" className="label">Key info <span className="font-normal text-gray-400">(one point per line)</span></label>
            <textarea
              id="keyInfo"
              name="keyInfo"
              defaultValue={product?.keyInfo?.join("\n")}
              rows={3}
              placeholder={"Pack of 20 tablets\nStore below 25°C"}
              className="input"
            />
          </div>
        </Section>

        <Section title="Pricing & stock">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="label">Price (PKR) *</label>
              <input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} required className="input" />
            </div>
            <div>
              <label htmlFor="salePrice" className="label">Sale price <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="salePrice" name="salePrice" type="number" step="0.01" min="0" defaultValue={product?.salePrice} className="input" />
            </div>
            <div>
              <label htmlFor="stock" className="label">Stock *</label>
              <input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required className="input" />
            </div>
            <div>
              <label htmlFor="sku" className="label">SKU *</label>
              <input id="sku" name="sku" defaultValue={product?.sku} required className="input" />
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Photo">
          <ImageUpload
            name="image"
            defaultValue={product?.image}
            slugHint={effectiveSlug}
            onUploadingChange={setUploading}
          />
        </Section>

        <Section title="Visibility">
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand-600" />
            <span>
              <span className="font-medium text-gray-900">Featured</span>
              <span className="block text-xs text-gray-500">Shown in &ldquo;Featured Products&rdquo; on the homepage.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input type="checkbox" name="prescriptionRequired" defaultChecked={product?.prescriptionRequired} className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand-600" />
            <span>
              <span className="font-medium text-gray-900">Prescription required</span>
              <span className="block text-xs text-gray-500">Shows a prescription notice to customers.</span>
            </span>
          </label>
        </Section>

        <div className="flex flex-col gap-2 lg:sticky lg:top-6">
          <SubmitButton label={mode === "edit" ? "Save changes" : "Add product"} blocked={uploading} />
          <Link href="/admin/products" className="btn-secondary">Cancel</Link>
        </div>
      </div>
    </form>
  );
}
