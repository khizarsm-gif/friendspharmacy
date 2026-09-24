"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { Category } from "@/types";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { classNames } from "@/lib/utils";
import { createCategory, updateCategory, type CategoryActionState } from "./actions";

const initialState: CategoryActionState = { error: null };

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function CategoryForm({
  category,
  productCount = 0,
  nextSortOrder = 0,
}: {
  category?: Category;
  productCount?: number;
  nextSortOrder?: number;
}) {
  const isEdit = Boolean(category);
  const action = category ? updateCategory.bind(null, category.slug) : createCategory;
  const [state, formAction] = useFormState(action, initialState);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [icon, setIcon] = useState(category?.icon ?? "Pill");
  const effectiveSlug = slugTouched ? slug : slugify(name);

  return (
    <form action={formAction} className="card max-w-2xl space-y-5 p-5 sm:p-6">
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name *</label>
          <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label htmlFor="slug" className="label">URL slug</label>
          <input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="input"
          />
          {isEdit && productCount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Changing this updates all {productCount} products in the category automatically.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">Short description *</label>
        <input id="description" name="description" defaultValue={category?.description} required className="input" />
      </div>

      <fieldset>
        <legend className="label">Icon *</legend>
        <input type="hidden" name="icon" value={icon} />
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              aria-pressed={icon === key}
              aria-label={key}
              title={key}
              className={classNames(
                "flex aspect-square items-center justify-center rounded-xl border transition-colors",
                icon === key
                  ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/30"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="sm:w-40">
        <label htmlFor="sortOrder" className="label">Display order</label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          step="1"
          defaultValue={category?.sortOrder ?? nextSortOrder}
          className="input"
        />
        <p className="mt-1 text-xs text-gray-500">Lower numbers show first.</p>
      </div>

      <div className="flex gap-2 pt-2">
        <SubmitButton label={isEdit ? "Save changes" : "Add category"} />
        <Link href="/admin/categories" className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
