"use client";

import { useState, type ChangeEvent } from "react";
// eslint-disable-next-line camelcase
import { useFormState, useFormStatus } from "react-dom";
import type { Category, Product } from "@/types";
import { createProduct, updateProduct, type ActionState } from "./actions";

interface ProductFormProps {
  categories: Category[];
  mode: "create" | "edit";
  product?: Product;
}

const initialState: ActionState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function ProductForm({ categories, mode, product }: ProductFormProps) {
  const action =
    mode === "edit" && product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useFormState(action, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image ?? null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border bg-white p-6">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Product Name *
        </label>
        <input id="name" name="name" defaultValue={product?.name} required className="input" />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
          URL Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={product?.slug}
          placeholder="Auto-generated from the name if left blank"
          className="input"
        />
        <p className="mt-1 text-xs text-gray-500">
          Powers the product page URL. Only change this if you know what you&apos;re doing —
          editing it on an existing product changes its live URL.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="mb-1 block text-sm font-medium text-gray-700">
            Brand *
          </label>
          <input id="brand" name="brand" defaultValue={product?.brand} required className="input" />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            required
            className="input"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description}
          required
          rows={3}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="keyInfo" className="mb-1 block text-sm font-medium text-gray-700">
          Key Info (one point per line)
        </label>
        <textarea
          id="keyInfo"
          name="keyInfo"
          defaultValue={product?.keyInfo?.join("\n")}
          rows={3}
          placeholder={"e.g.\nPack of 20 tablets\nStore below 25°C"}
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
            Price (PKR) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="salePrice" className="mb-1 block text-sm font-medium text-gray-700">
            Sale Price (optional)
          </label>
          <input
            id="salePrice"
            name="salePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.salePrice}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stock" className="mb-1 block text-sm font-medium text-gray-700">
            Stock *
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 0}
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="sku" className="mb-1 block text-sm font-medium text-gray-700">
            SKU *
          </label>
          <input id="sku" name="sku" defaultValue={product?.sku} required className="input" />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured}
            className="h-4 w-4 rounded border-gray-300"
          />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="prescriptionRequired"
            defaultChecked={product?.prescriptionRequired}
            className="h-4 w-4 rounded border-gray-300"
          />
          Prescription required
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Product Photo</label>
        {previewUrl && (
          // Plain img, not next/image: this can be a local blob: preview URL
          // for a just-selected file, which next/image can't render anyway.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className="mb-2 h-24 w-24 rounded-lg object-cover ring-1 ring-gray-200"
          />
        )}
        <input
          type="file"
          name="imageFile"
          accept="image/*"
          onChange={handleFileChange}
          className="block text-sm text-gray-600"
        />
        <p className="mt-1 text-xs text-gray-500">
          Uploads straight to your product photo storage.{" "}
          {mode === "edit" ? "Leave blank to keep the current photo." : "Or paste a URL below instead."}
        </p>
        <input
          name="imageUrl"
          placeholder="Or paste an image URL instead"
          className="input mt-2"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={mode === "edit" ? "Save Changes" : "Add Product"} />
      </div>
    </form>
  );
}
