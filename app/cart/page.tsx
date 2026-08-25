import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the items in your cart before checking out.",
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return <CartClient />;
}
