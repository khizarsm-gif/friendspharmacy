import { CheckCircle2 } from "lucide-react";

const MESSAGES: Record<string, string> = {
  "product-created": "Product added. It's live on the store now.",
  "product-updated": "Product saved.",
  "category-created": "Category added.",
  "category-updated": "Category saved.",
  "member-added": "Team member added. Share their email and temporary password with them privately.",
  "password-reset": "Temporary password set. They'll choose a new one at next sign-in.",
};

/** Success banner driven by the ?saved= query param set after a redirect. */
export default function Flash({ saved }: { saved?: string | string[] }) {
  const key = Array.isArray(saved) ? saved[0] : saved;
  const message = key ? MESSAGES[key] : undefined;
  if (!message) return null;
  return (
    <div
      role="status"
      className="mb-5 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 ring-1 ring-brand-200"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}
