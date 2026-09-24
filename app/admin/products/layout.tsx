import type { ReactNode } from "react";

// The admin shell now lives in app/admin/layout.tsx; this layout just passes through.
export default function AdminProductsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
