import { notFound } from "next/navigation";
import { categories } from "@/data/categories";
import { getProductById } from "@/data/products";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Product</h1>
      <ProductForm categories={categories} mode="edit" product={product} />
    </div>
  );
}
