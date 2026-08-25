import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <PackageSearch className="h-14 w-14 text-brand-300" aria-hidden="true" />
      <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
        <Link href="/shop" className="btn-secondary">
          Browse Shop
        </Link>
      </div>
    </div>
  );
}
