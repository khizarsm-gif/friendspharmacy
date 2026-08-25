import { categories } from "@/data/categories";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Product</h1>
      <ProductForm categories={categories} mode="create" />
    </div>
  );
}
