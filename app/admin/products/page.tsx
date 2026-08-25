import Link from "next/link";
import Image from "next/image";
import { getAllProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import DeleteProductButton from "./DeleteProductButton";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products ({products.length})</h1>
        <Link href="/admin/products/new" className="btn-primary">
          Add Product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <span className="relative block h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                    <Image src={product.image} alt="" fill className="object-cover" />
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {product.name}
                  {product.isDemo && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      DEMO
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{product.category}</td>
                <td className="px-4 py-3">
                  {formatPrice(product.salePrice ?? product.price)}
                  {product.salePrice != null && (
                    <span className="ml-1 text-xs text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={product.stock > 0 ? "text-gray-900" : "font-semibold text-red-600"}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">{product.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
