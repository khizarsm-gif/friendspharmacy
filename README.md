# Friends Pharmacy — Website MVP

A modern, responsive pharmacy e-commerce/catalog website built with
Next.js (App Router), TypeScript, and Tailwind CSS. Customers can browse
and search products, filter by category, view product details, manage a
cart, check out (Cash on Delivery / Pay at Pharmacy), and order directly via
WhatsApp. No online payments, authentication, or database are wired up yet
— see "What to Add in Phase 2" below for how this project is structured to
support them later.

> **All product data, images, and business contact details in this repo are
> DEMO/PLACEHOLDER content.** Replace them before launch — see the sections
> below for exactly where.

---

## 1. How to Run the Project

Requirements: Node.js 18.18+ (Node 20/22 recommended) and npm.

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # run ESLint
```

---

## 2. Where to Change Pharmacy Information

Everything business-specific lives in **one file**:

```
config/business.ts
```

This includes: business name, tagline, phone, WhatsApp number, email,
address, opening hours, currency, delivery fee, free-delivery threshold,
social links, and the legal disclaimer text. Every page and component reads
from this file — nothing is hardcoded elsewhere, so editing it updates the
header, footer, contact page, checkout, and WhatsApp messages all at once.

---

## 3. Where to Add / Edit Products

Product data lives in:

```
data/products.ts   — the product catalog (array of Product objects)
data/categories.ts — the 8 product categories
```

Each product follows the `Product` type in `types/index.ts`:

```ts
{
  id, name, slug, brand, category, description, keyInfo,
  price, salePrice, image, stock, sku, featured,
  prescriptionRequired, createdAt, isDemo
}
```

To add a product, copy an existing object in the `products` array, give it
a unique `id` and `slug`, and fill in the fields. `category` must match one
of the `slug` values in `data/categories.ts`. Product images live in
`public/images/products/` — the 21 shipped products use generated SVG
placeholders (see `scripts/generate-placeholders.py`); replace `image` with
a real photo path (e.g. `/images/products/my-product.jpg`) or a remote URL
(after adding the host to `next.config.js` → `images.remotePatterns`).

Set `isDemo: false` once you replace a demo product with a real one — the
"Demo" badge on product cards/detail pages is driven by that flag.

**Pages never import `products` directly** — they go through the helper
functions at the bottom of `data/products.ts` (`getAllProducts`,
`getProductBySlug`, `getFeaturedProducts`, `searchProducts`, etc.). This
means that when you're ready to move to a real database, you only need to
rewrite those functions to query PostgreSQL/Supabase instead of filtering an
in-memory array — no page or component code needs to change.

---

## 4. Where to Change the WhatsApp Number

`config/business.ts` → `whatsapp` (display format) and `whatsappRaw`
(digits only, international format, no `+` — e.g. `923001234567`). This
number is used everywhere: the header WhatsApp button, the floating
WhatsApp button, product "Contact Pharmacy" buttons, the cart's "Order via
WhatsApp" button, and the checkout flow.

The WhatsApp message text itself is built in `lib/whatsapp.ts`
(`buildWhatsAppOrderUrl` for orders, `buildWhatsAppContactUrl` for general
contact) if you want to change the message wording or format.

---

## 5. How to Deploy to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework preset: **Next.js** (auto-detected). No environment variables
   are required for this MVP.
4. Click **Deploy**. Vercel will run `npm install` and `npm run build`
   automatically.
5. Once live, update `siteUrl` in `app/layout.tsx`, `app/sitemap.ts`, and
   `app/robots.ts` to your real production domain (currently a placeholder:
   `https://friendspharmacy.example.com`).

No database or payment provider credentials are needed for this version —
everything runs statically plus a few dynamic routes (`/shop`, product
pages), which Vercel supports out of the box.

---

## 6. What to Add in Phase 2

This project is structured so the following can be added without a
rewrite:

- **Online payment** — add a `/api/checkout` route and integrate a gateway
  (e.g. Stripe, JazzCash, EasyPaisa); extend `CheckoutForm`/`CheckoutClient`
  to call it instead of (or alongside) the WhatsApp handoff.
- **Customer accounts** — introduce auth (e.g. NextAuth/Supabase Auth) and a
  `/account` section; the cart/wishlist contexts in `lib/` are already
  isolated and easy to sync to a logged-in user instead of `localStorage`.
- **Admin dashboard** — build an `/admin` route group with product/order
  CRUD screens; point them at the same data-access functions in
  `data/products.ts` once those are backed by a real database.
- **Inventory management** — replace the static `stock` field with live
  quantities from a database; the UI already reacts to `stock` (out-of-stock
  badges, quantity caps) so no UI change is needed, only the data source.
- **Order tracking** — persist orders (currently only sent via WhatsApp) to
  a database via a new `/api/orders` route, and add an order-status page.
- **Prescription upload** — `prescriptionRequired` products already branch
  to a distinct "Prescription Required" UI in
  `app/products/[slug]/ProductDetailClient.tsx`; add a file upload field
  there (image/PDF) once you have storage (e.g. Supabase Storage) to send
  it to.
- **Delivery management** — `deliveryMethod` is already captured at
  checkout; extend it with delivery zones, live rider tracking, etc. once
  there's a backend to support it.

---

## Project Structure

```
app/                       Next.js App Router pages
  page.tsx                 Homepage
  shop/                    Shop page (search, filter, sort, load more)
  products/[slug]/         Product detail page
  cart/                    Cart page
  checkout/                Checkout page
  about/, contact/         Static-ish content pages
  privacy-policy/, terms/  Legal placeholder pages
  layout.tsx               Root layout (Navbar, Footer, CartDrawer, providers)
  sitemap.ts, robots.ts    SEO metadata routes
  icon.tsx                 Generated favicon

components/                Reusable UI components (Navbar, Footer, ProductCard,
                            ProductGrid, CategoryCard, SearchBar, CartDrawer,
                            QuantitySelector, CheckoutForm, WhatsAppButton,
                            ProductFilters, Breadcrumbs, BackToTop, etc.)

config/business.ts         ⭐ Central business configuration (edit this first)

data/products.ts           ⭐ Demo product catalog + data-access helpers
data/categories.ts         Product categories

lib/                       Cart/wishlist/toast state (React context +
                            localStorage), currency formatting, WhatsApp
                            message builder

types/index.ts             Shared TypeScript types

public/images/             Local SVG placeholder images (no external
                            image-hosting dependency)

scripts/generate-placeholders.py  Regenerates the demo placeholder images
```

---

## Notes on Scope & Decisions

- **Tech stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS +
  lucide-react icons, exactly as requested. No state management library
  beyond React Context — the app is small enough that Redux/Zustand would
  be overkill; swapping to one later is straightforward since all cart/
  wishlist logic is already isolated in `lib/`.
- **Cart persistence**: `localStorage`, as specified. See
  `lib/cart-context.tsx`.
- **Checkout / "placing an order"**: since there's no backend yet, checkout
  currently opens a pre-filled WhatsApp message to the pharmacy (see
  `app/checkout/CheckoutClient.tsx`) rather than silently pretending to
  submit an order to a server that doesn't exist. This keeps the MVP honest
  about what it can and can't do until Phase 2's `/api/orders` route exists.
- **Contact form**: for the same reason, submitting the contact form opens
  the visitor's email client with the message pre-filled (`mailto:`)
  instead of silently "succeeding" with no backend to receive it.
- **Prescription products**: `prescriptionRequired: true` products cannot
  be added to the cart. They show a "Prescription Required" notice with
  WhatsApp/Call buttons instead, per the safety requirement that this site
  not perform prescription verification or unsafe medical dispensing.
- **Medical disclaimer**: shown in the footer, the About page, and on every
  product detail page.

## Admin portal (`/admin`)

- **Sign in:** `/admin/login`. Accounts are created in Supabase (Authentication → Users) and must also be listed in the `admin_users` table. Signing up alone gives no access; Row Level Security enforces this in the database.
- **Dashboard:** catalog totals, low/out-of-stock alerts, recent products.
- **Products:** search/filter, add, edit, delete. Photos upload straight to the `product-images` Storage bucket (JPG/PNG/WebP/GIF, 5 MB max).
- **Categories:** add, edit (renaming a slug updates its products automatically), reorder, delete (blocked while products still use it).
- Saves refresh the live store immediately (cache tag `catalog`).
- **Required env vars** (local `.env.local` and Vercel → Settings → Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Database changes are recorded in `supabase/migrations/`.
- **Team (owners only):** `/admin/team` to add members (name, email, role, temporary password), change roles, reset passwords, and remove members. New members must choose their own password at first sign-in (`/admin/account`).
  - **Owner:** full access, including categories and team.
  - **Purchaser:** add/edit/delete products and photos; categories are view-only.
  - Requires the server-only env var `SUPABASE_SERVICE_ROLE_KEY` in Vercel (never prefix it with `NEXT_PUBLIC_`).
