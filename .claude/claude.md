# Shreeforstree — Claude Code Context

## Project Overview

Full-stack e-commerce site for a family member's custom women's clothing business.
This file is `.claude/claude.md`, tracked in git. `.claude/Claude-Context.md` alongside it is an
**untracked session log** — background only, not instructions.
Package manager: `pnpm` exclusively — `preinstall` runs `npx only-allow pnpm`, so npm/npx installs are hard-blocked.

**Aesthetic:** warm paper/ink, not dark mode. Off-white `--color-paper` ground, near-black
`--color-ink` text, **rose-gold** accents. `sage`/`rust` are functional status colors used in
admin dashboards only — never customer-facing UI. All tokens are OKLCH and derived from the
logo mark; see `src/app/globals.css`.

---

## Tech Stack

| Layer            | Technology                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Framework        | Next.js 16.2.10 (App Router) + React 19.2.7 + TypeScript 6.0.3                                   |
| Styling          | Tailwind CSS v4 (`@theme` directive in `globals.css`, no tailwind.config)                        |
| Database         | Neon (PostgreSQL) via `@neondatabase/serverless` Pool                                            |
| ORM              | Drizzle ORM 0.45 + drizzle-kit 0.31                                                              |
| Auth             | Better Auth 1.7 (email/password + Google OAuth, DB-backed rate limiting)                         |
| Payments         | Razorpay (Checkout script + server SDK + webhooks)                                               |
| Media Storage    | Hostinger over SFTP (`ssh2-sftp-client`, private-key auth)                                       |
| Image Processing | Sharp 0.32 — resize to fit 1200×1500, WebP @ 85%                                                 |
| Email            | Resend — **not wired up yet**                                                                    |
| Validation       | Zod v4 (`import z4 from "zod/v4"`)                                                               |
| State            | Zustand 5 (with `persist`)                                                                       |
| UI               | lucide-react (icons), motion, recharts, sonner (toasts), next-themes                             |
| Fonts            | Playfair Display (display), Cormorant Garamond (serif-alt), Inter (body), League Spartan (label) |
| Deployment       | Vercel (app), Hostinger (media at `nextmedia.shreeforstree.in`)                                  |

`package.json` ranges are looser than what's installed — check `node_modules` before assuming a
version. Currently resolved: better-auth **1.7.2** (the range says `^1.6.14`), zod **4.5.4**,
tailwindcss **4.3.3**. The 1.6 → 1.7 jump matters: see `account.issuer` below.

**There is no test framework.** Vitest and the `tests/` directory were removed deliberately
(commit `7769bdb`). Don't add test files, a `test` script, or a test runner unless asked.

### Commands

```bash
pnpm dev            # next dev
pnpm build          # next build
pnpm start          # next start
pnpm lint           # eslint
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate     # drizzle-kit migrate
pnpm db:studio      # drizzle-kit studio
pnpm db:push        # drizzle-kit push
```

### Reading Next.js docs

`AGENTS.md` in the repo root requires reading the relevant doc under
`node_modules/next/dist/docs/` before doing Next.js work. Training data lags; the vendored
docs are the source of truth for this version.

---

## Directory Structure

```
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                          device-aware shell: sidebar/topbar or mobile nav
│   │   └── admin/
│   │       ├── dashboard/page.tsx
│   │       ├── products/{page,new/page,[id]/{page,loading}}.tsx
│   │       ├── categories/{page,post/page,[slug]/{page,loading,CategoryEditForm}}.tsx
│   │       ├── orders/page.tsx
│   │       ├── users/page.tsx
│   │       ├── notifications/page.tsx
│   │       └── settings/page.tsx
│   ├── (auth)/{layout,sign-in/page,sign-up/page}.tsx
│   ├── (shop)/
│   │   ├── layout.tsx                          header + mobile nav, admin link if role=admin
│   │   ├── page.tsx                            home — getHomeData() → seven sections
│   │   ├── shop/{page,[slug]/page}.tsx         listing + PDP
│   │   ├── collections/, search/, contact/, our-story/
│   │   ├── cart/, wishlist/
│   │   ├── checkout/
│   │   │   ├── page.tsx                        address + email, POSTs the order
│   │   │   └── [orderId]/
│   │   │       ├── payment/page.tsx            opens Razorpay Checkout
│   │   │       └── confirming/page.tsx         polls order status until resolved
│   │   ├── orders/
│   │   │   ├── page.tsx                        list
│   │   │   └── [id]/
│   │   │       ├── page.tsx                    order detail (noindex)
│   │   │       └── confirmation/page.tsx       post-payment success (noindex)
│   │   └── account/{page,addresses/page}.tsx
│   ├── api/
│   │   ├── auth/[...all]/route.ts              Better Auth handler
│   │   ├── admin/stats/route.ts                GET (admin dashboard aggregates)
│   │   ├── categories/
│   │   │   ├── route.ts                        GET, POST (multipart, uploads inline)
│   │   │   └── [slug]/route.ts                 PATCH, DELETE      ← keyed by SLUG, not id
│   │   ├── products/
│   │   │   ├── route.ts                        GET (filters/search), POST (multipart)
│   │   │   └── [id]/
│   │   │       ├── route.ts                    GET, PATCH (JSON), DELETE
│   │   │       └── reviews/route.ts            GET, POST
│   │   ├── users/{route.ts, [id]/route.ts}     GET(admin) | GET, PATCH, DELETE
│   │   ├── addresses/{route.ts, [id]/route.ts}
│   │   ├── cart/
│   │   │   ├── route.ts                        GET, POST, DELETE (clear)
│   │   │   ├── [itemId]/route.ts               PATCH, DELETE
│   │   │   └── merge/route.ts                  POST (call right after login)
│   │   ├── orders/
│   │   │   ├── route.ts                        GET, POST
│   │   │   ├── [id]/route.ts                   GET (owner or guest token)
│   │   │   └── [id]/status/route.ts            GET (poll), PATCH (admin)
│   │   ├── payments/
│   │   │   ├── create-order/route.ts           POST
│   │   │   ├── confirm/route.ts                POST (acknowledge only — no DB writes)
│   │   │   └── webhook/route.ts                POST (Razorpay → source of truth)
│   │   ├── wishlist/{route.ts, [productId]/route.ts}
│   │   ├── reviews/[id]/route.ts               DELETE
│   │   └── media/
│   │       ├── upload/route.ts                 avatar | review (authenticated users)
│   │       └── admin/upload/route.ts           product/category media (admin)
│   ├── actions.ts                              "use server" — setCartCookie
│   ├── globals.css                             Tailwind v4 @theme tokens + utilities
│   ├── layout.tsx                              fonts, metadata, <BrandToaster />
│   └── icon.svg
├── components/
│   ├── admin/    AdminSidebar, AdminDesktopTopBar, AdminMobileTopBar, Notifications,
│   │             ProductForm, ProductMediaManager, StatCard, SparkLine
│   ├── auth/     AuthCard
│   ├── shop/     HeaderDesktop, HeaderMobile, Cart, ProductGrid, CategoryTile,
│   │             home/{HomeHero,HomeMarquee,NewArrivalsRail,HomeCollections,
│   │                   AtelierEdit,HomeSignature,HomePromise},
│   │             Addresses/{AddressModal,AllAddresses},
│   │             product/{ProductGallery,ProductDetails,ProductDescription,
│   │                      ProductPurchase,AddToBag,QuantitySelector},
│   │             search/{searchPanel,useSearch},
│   │             orders/{OrderAddressSnapshot,OrderItemThumbnail,SuccessMark}
│   └── ui/       BrandToaster, Shimmer, Buttons, ArrowLink, Icon
├── hooks/        useFileDragState, useZoneFileDrop
├── stores/       sidebar-store (zustand + persist)
├── types/        razorpay (incl. `declare global { Window.Razorpay }`)
├── utils/        Card, DragDropGlow, Dropdown, FileUpload, NavMobile
├── proxy.ts      Next 16 "Proxy" (was middleware) — sets x-device-type header
└── lib/
    ├── db/
    │   ├── schema/*.schema.ts + index.ts       barrel export
    │   ├── auth.ts                             Better Auth config
    │   ├── index.ts                            Drizzle client (Neon Pool)
    │   ├── errors.ts                           isUniqueViolation (SQLSTATE 23505)
    │   └── migrations/                         0000–0010 + meta/
    ├── media/
    │   ├── media-handle.ts                     SFTP connect/upload/delete/detect
    │   └── path-guard.ts                       isOwnedMediaPath — anti path-traversal
    ├── queries/
    │   ├── products.ts                         getProducts: filters, full-text search, paging
    │   └── home.ts                             getHomeData: hero / new arrivals / categories / atelier edit
    ├── validators/*.validators.ts              Zod v4 schemas
    ├── api-response.ts                         typed NextResponse helpers
    ├── response-handler.ts                     ServiceResponse union → NextResponse
    ├── auth-utils.ts                           getCurrentUser, adminCheck, ownership asserts
    ├── cart-utils.ts                           session cookie, getOrCreateCart, upsertCartItem, Tx
    ├── order-utils.ts                          guest cookie set/resolve + getOwnedOrder
    ├── orders.ts                                display formatters (reference, amount, date)
    ├── optimize.ts                             optimizeImage (Sharp) / optimizeVideo (passthrough)
    ├── razorpay.ts                             server SDK instance
    ├── razorpay-checkout.ts                    browser checkout.js loader (memoized)
    ├── auth-client.ts                          better-auth/react client
    └── constants.ts
```

---

## Database Config

```bash
pnpm db:generate
pnpm db:migrate
```

`drizzle.config.ts` points `schema` at `./src/lib/db/schema/index.ts` — the barrel export.
Never point it at `./src/lib/db/index.ts` (that's the client). Migrations output to
`./src/lib/db/migrations`.

Migration `0010_regular_mikhail_rasputin.sql` adds `account.issuer` as `NOT NULL` with **no
default**. Better Auth 1.7 scopes account identity by issuer, so the column is required — but the
`ALTER TABLE` will fail on any database that already has rows in `account`. Backfill first
(Better Auth publishes a 1.7 upgrade guide for exactly this) before running `db:migrate` against
an existing environment.

**Not everything in the DB is in migrations.** `src/lib/queries/products.ts` calls a Postgres
function `product_search_vector(title, description, keywords)` that does **not** appear in any
migration file — it was created directly against the database. Product search silently breaks
on a fresh DB restored from migrations alone.

---

## Schema Architecture Decisions

### `productMedia` table (not columns on products)

Images and videos live in `product_media`, never as array columns on `products`.

| Flag combination                     | Meaning                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| `isHero=false, isFabricSwatch=false` | gallery media (images + videos), max 10                          |
| `isHero=true`                        | hero/banner image, exactly one per product, never in the gallery |
| `isFabricSwatch=true`                | fabric close-ups, images only, max 4                             |

- Gallery query: **always** filter `isHero=false AND isFabricSwatch=false`.
- Thumbnail: `orderBy sortOrder asc, limit 1` — never `sortOrder = 0` (fragile).
- Listing/wishlist cards fetch `limit: 3` gallery images.

### SFTP path conventions

`uploadFiles()` appends an `images/` or `videos/` subfolder automatically based on MIME type.
`uploadSingleFile()` does **not** (it passes `skipMediaFolder: true`).

```
products/{productId}/{images|videos}/{filename}   ← gallery, via uploadFiles
products/{productId}/fabric/{images}/{filename}   ← fabric swatches, via uploadFiles
products/{productId}/hero-image/{filename}        ← via uploadSingleFile
categories/{categoryId}/category-image/{filename} ← via uploadSingleFile
categories/{categoryId}/size-chart-image/{file}   ← via uploadSingleFile
reviews/{userId}/{productId}/{images}/{filename}  ← via uploadFiles
avatars/{userId}/{filename}                       ← via uploadSingleFile
```

All paths are absolute on the remote, prefixed with `MEDIA_REMOTE_ROOT`. Filenames are always
`{timestamp}-{uuid}.webp`. Public URLs are built by stripping `MEDIA_REMOTE_ROOT` and prefixing
`NEXT_PUBLIC_MEDIA_BASE_URL`. Deleting a file also walks up and removes now-empty parent
directories (`cleanupEmptyFolders`), stopping at `MEDIA_REMOTE_ROOT`.

### `products` — attribute columns

Beyond title/description/price/sizes/colors: `fabric` (required), `work[]`, `silhouette`,
`lining`, `sleeveType`, `neckline`, `length`, `careInstructions`, `keywords[]`, plus flags
`isActive`, `isNewArrival`, `isHeroProduct`. `PRODUCT_SIZES` (`XS…3XL`, `Free Size`) is exported
from `products.schema.ts` and drives both the PG enum and the Zod enums.

### `categories` — `title`, not `name`

Columns are `title` + `slug`, plus two independent image pairs: `categoryImageUrl/Path` and
`sizeChartImageUrl/Path`. The size chart is surfaced on the PDP as the size guide, read from
the product's **first** category.

### Orders — snapshot pattern

Shipping fields are copied onto the `orders` row at creation (`shippingFullName`,
`shippingPhone`, `shippingEmail`, `shippingAddressLine1/2`, `shippingCity/State/Pincode/Country`).
`addressId` and `userId` are FKs kept only for reference — both `onDelete: set null`, so users
can delete addresses and accounts without breaking order history. `cartId` (also `set null`)
records which cart produced the order; the webhook uses it to clear `cartItems` after capture.

### Orders — guest checkout

Orders can be placed without an account. When `currentUser` is null the POST route generates a
`guestToken` (`crypto.randomBytes(16).toString("hex")`), stores it on the order (unique), and
sets an httpOnly cookie `guest_order_{orderId}` with a **30-day** TTL.

`resolveGuestToken(orderId, tokenFromRequest)` prefers an explicit token (request body, or the
`guest-token` header on `GET /api/orders/[id]` and `GET /api/orders/[id]/status`) and falls back
to the cookie. `getOwnedOrder` reads the cookie only.
`assertOrderOwnership(order, currentUserId?, guestToken?)` returns `{ kind, message }` and
compares tokens with `crypto.timingSafeEqual` after a length check.

### Order amounts — four separate columns

```
originalAmount  = sum(price * quantity)                        — full price, no discounts
discountAmount  = sum((price - effectivePrice) * quantity)     — savings
itemsTotal      = originalAmount - discountAmount              — what the customer pays for items
shippingCharges = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE
totalAmount     = itemsTotal + shippingCharges                 — charged to Razorpay
```

`itemsTotal` (not `originalAmount`) drives the free-shipping check. "Effective price" is
`Number(discountedPrice) || Number(price)` — a zero or absent discount falls back to full price.
`orderItems.priceAtPurchase` uses the same rule.

### Payments — two-step, webhook-authoritative

The `payments` row is inserted at Razorpay-order creation with `transactionId: null` and
`method: null`. Both are filled in **by the webhook**, never by the client. Status enum:
`pending | success | failed | refunded | expired`. Stale pending rows are marked `expired`
when a new payment order is created. `failureReason` is populated from the Razorpay error
fields, trimmed to 240 chars.

### Reviews — purchase verified

`isVerified` means the user actually purchased and received the product. Set to `true`
automatically on insert after the eligibility check — no manual admin approval. Eligible order
statuses: `delivered`, `returned`. Unique `(userId, productId)` — one review per user per
product; a concurrent duplicate is caught via `isUniqueViolation(error)` and returned as 409.
A `check` constraint enforces `rating BETWEEN 1 AND 5`.

### User avatar — `image_path` additionalField

Better Auth's `image` holds the URL. `image_path` (snake_case in both the schema object **and**
the DB column, and in `additionalFields`) holds the SFTP path for deletion on replacement.
Note the mismatch: the **API** field in `updateUserSchema` is camelCase `imagePath`, mapped to
`image_path` when writing. Additional fields: `role`, `deletedAt`, `phone`, `image_path` —
`role` and `deletedAt` are `input: false` (not settable by the user).

### Wishlist — composite PK, no id column

`(userId, productId)` is the composite primary key. Always use both in where clauses.

### `account.issuer`

Better Auth 1.7 scopes account identity by `(issuer, accountId)` rather than
`(providerId, accountId)`. `issuer` is `text NOT NULL` on `account`. It is written by Better
Auth itself — nothing in this codebase sets it directly.

### `rate_limit` table

Better Auth is configured with `storage: "database"`, so the `rate_limit` table is part of the
schema. Global: 10 requests / 60s. `/sign-in/email`: 5 / 60s.

---

## Constants (`src/lib/constants.ts`)

```typescript
export const SHIPPING_CHARGE = 60;
export const FREE_SHIPPING_THRESHOLD = 999.99;
export const MAX_CART_ITEMS = 10; // note: ITEMS, not QUANTITY

// home page section caps
export const MAX_HERO_PRODUCTS = 4;
export const MAX_ATELIER_EDIT_PRODUCTS = 4;
export const MAX_NEW_ARRIVALS = 12;
export const MAX_CATEGORIES = 7;
export const HERO_SLIDE_INTERVAL_MS = 5500;

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  not_placed: ["placed"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
```

`not_placed → placed` happens **only** in the webhook, never via `PATCH /api/orders/[id]/status`.
That's why `not_placed` is excluded from `updateOrderSchema`.

The status PATCH uses an optimistic guard — the `where` clause re-asserts the status the
transition was validated against, and a `undefined` result returns 409 rather than silently
applying a stale transition. Moving to `cancelled`/`returned` while `paymentStatus === "success"`
sets `refundRequired = true`.

---

## Auth Utils (`src/lib/auth-utils.ts`)

- `getCurrentUser(input)` and `adminCheck(input)` both accept a `Request` **or** a bare `Headers` object — server components pass `await headers()`, route handlers pass the `Request`. Never call `auth.api.getSession` without headers.
- `adminCheck` returns a boolean — check it explicitly.
- Need both user and admin in one route? Get `currentUser`, then check `currentUser.role === "admin"` inline. Don't call both helpers — that's two session lookups.
- `assertOrderOwnership` / `assertOwnsCartItem` return `{ kind, message, ... }` objects designed to feed straight into `handleResponse()`.
- Types: `Session` and `User` are exported from `src/lib/db/auth.ts`.

---

## Cart (`src/lib/cart-utils.ts`)

**The session id is a cookie, not a header.** `getOrCreateSessionId()` reads the httpOnly
`cartCookie` (30-day TTL) and, if absent, mints one via the `setCartCookie` server action.
There is no `x-session-id` header anywhere in this codebase — don't reintroduce one.

- Cart routes allow guests — never `401` for missing auth.
- Guest carts: `userId = null`, identified by `sessionId`. Partial unique indexes enforce one cart per logged-in user and one per guest session.
- `getOrCreateCart(userId, sessionId, tx?)` — accepts an optional `tx`. Returns either the cart **or** a `Response` (from `internalServerError`); callers must do `if (result instanceof Response) return result`.
- `upsertCartItem(tx, {...})` — `onConflictDoUpdate` on `(cartId, productId, size)` with `LEAST(quantity + n, maxQuantity)`, so quantity is clamped in SQL.
- `Tx` type is exported here for typing transaction params.
- `GET /api/cart` filters out inactive products before computing totals and returns `amountToFreeShipping`.
- `POST /api/cart/merge` — moves guest cart items onto the user cart, then deletes the guest cart. Designed to be called right after login; **currently has no caller in `src`**.

---

## Payment Flow

Three pages carry the flow, and each hands off by URL — there is no shared client state
between them.

```
/checkout
  POST /api/orders                 → order (orderStatus "not_placed", paymentStatus "pending")
                                     guest? → guestToken + guest_order_{id} cookie
                                     router.replace(`/checkout/{orderId}/payment`)

/checkout/[orderId]/payment
  POST /api/payments/create-order  → reuse or create Razorpay order, insert payments row
                                     returns { razorpayOrderId, amount, currency, keyId,
                                               name, email, contact }
                                     no razorpayOrderId ⇒ already paid ⇒ jump to confirmation
  loadRazorpayCheckoutScript()     → open Razorpay Checkout
  handler:
    POST /api/payments/confirm     → verifies the client signature and LOGS the result.
                                     Deliberately does NOT mutate order/payment state.
                                     router.replace(`/checkout/{orderId}/confirming`)

/checkout/[orderId]/confirming
  GET /api/orders/[id]/status      → polled until the webhook lands (see below)
                                     success ⇒ router.replace(`/orders/{id}/confirmation`)

(out of band)
  POST /api/payments/webhook       → THE source of truth. Verifies x-razorpay-signature,
                                     handles payment.captured / payment.failed.
```

**The payment page is effect-driven and guarded.** A `hasOpened` ref stops React Strict Mode's
double-invoke from creating two Razorpay orders; it is reset on every failure path so "Try
again" works. The Razorpay instance is kept in a ref and `.close()`d on unmount. Checkout is
prefilled from the **order's shipping snapshot** (`name`/`email`/`contact` returned by
create-order), never from the session. Theme color is `#AD6D5E` (rose-gold). Dismissing the
modal toasts and returns to `/checkout` — the order survives, unpaid.

`payment_capture: true` is set on the Razorpay order, so authorized payments auto-capture and
`payment.captured` fires without a manual capture step.

### `GET /api/orders/[id]/status` — the polling endpoint

Ownership is checked the same way as everywhere else (session user, or guest token from the
`guest-token` header / cookie). It does **not** return the raw columns — it collapses them into
a payment-centric verdict:

| Condition                                                        | Returned `status`                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `paymentStatus === "success"` and `orderStatus !== "not_placed"` | `success`                                                |
| `paymentStatus === "failed"`                                     | `failed` (+ `failureReason` from the latest payment row) |
| `paymentStatus === "refunded"`                                   | `refunded`                                               |
| otherwise                                                        | `pending`                                                |

Responds with `Cache-Control: no-store` — it is polled, and a cached `pending` would strand the
user.

**Polling cadence** (`confirming/page.tsx`): every 2s for the first 20s, then every 6s, giving
up at 60s with a "still confirming, we'll email you" state. It stops on any non-`pending`
status. Two refs (`cancelledRef`, `navigatedRef`) prevent a late response from navigating after
unmount. The waiting state animates the order's own product images in a circular carousel, and
`useReducedMotion` disables it.

`handleCaptured` runs in a transaction with `SELECT ... FOR UPDATE` on both the payment and the
order, and is idempotent — it bails out on already-`success`/`refunded` payments, on amount or
currency mismatch, and on a duplicate `transactionId`. A capture arriving for an order already
marked paid sets `refundRequired = true` instead of double-crediting. On success it sets
payment `success`, order `placed` + `paymentStatus success`, and clears `cartItems` for the
order's `cartId`.

`handleFailed` marks the payment `failed` with a `failureReason` derived from
`error_description → error_reason → error_code`, and leaves the order untouched.

Both signature checks use `crypto.timingSafeEqual` — **always compare buffer lengths first**, it
throws otherwise. Client-side signature: HMAC-SHA256 of `${razorpayOrderId}|${razorpayPaymentId}`
with `RAZORPAY_KEY_SECRET`. Webhook signature: HMAC-SHA256 of the **raw request body**
(`await request.text()`, never the re-serialized JSON) with `RAZORPAY_WEBHOOK_SECRET`.

Unhandled webhook events return `200 ok` so Razorpay doesn't retry them.

---

## Reading an order from a server component (`getOwnedOrder`)

`src/lib/order-utils.ts` exports `getOwnedOrder({ orderId })` — the single entry point the order
pages use. It validates the UUID, loads the order with `orderItems` and `payments` (both newest
first), resolves the current user from `await headers()`, resolves the guest token **from the
cookie only** (no request object to read a header from), and runs `assertOrderOwnership`.

```typescript
const orderResponse = await getOwnedOrder({ orderId });
if (orderResponse.kind !== "ok") return notFound();
const { data: orderDetails } = orderResponse;
```

Its return shape is `{ kind: "ok" | "error", status?, message, data? }` — **not** the
`ServiceResponse` union, and not compatible with `handleResponse()`. A failed ownership check
returns `400 / "Invalid order ID"` rather than a 403, so a probing user can't tell a real order
apart from one they don't own. Pages turn any non-`ok` into `notFound()`.

`/orders/[id]/confirmation` additionally redirects to `/orders/[id]` unless the order is fully
settled (`orderStatus === "placed"` && `paymentStatus === "success"` && latest payment
`success`), so the success page can never render for an unpaid order.

Both order pages export `metadata = { robots: { index: false } }`. Anything reachable by guest
token must stay out of search results.

---

## Media Pipeline

### `POST /api/media/upload` — authenticated users

| `type`   | Max files | Destination                     |
| -------- | --------- | ------------------------------- |
| `avatar` | 1         | `avatars/{userId}/`             |
| `review` | 5         | `reviews/{userId}/{productId}/` |

Images only. Avatar flow: upload the replacement → update `user.image` + `user.image_path` →
**then** delete the old file, so a failed upload can't leave the DB pointing at a deleted file.
Review uploads re-check the same purchase eligibility as review creation, so storage can't be
filled with images for products the user never bought.

### `POST /api/media/admin/upload` — admin only

| `type`                | Max files | Destination                                 | Writes to DB?                             |
| --------------------- | --------- | ------------------------------------------- | ----------------------------------------- |
| `product-gallery`     | 10        | `products/{productId}/`                     | no                                        |
| `product-hero`        | 1         | `products/{productId}/hero-image/`          | yes — upserts the hero `productMedia` row |
| `product-fabric`      | 4         | `products/{productId}/fabric/`              | no                                        |
| `category`            | 1         | `categories/{categoryId}/category-image/`   | yes — updates the category row            |
| `category-size-chart` | 1         | `categories/{categoryId}/size-chart-image/` | yes — updates the category row            |

Category uploads are addressed by `categorySlug`, product uploads by `productId`. The product is
verified to exist **before** anything touches storage, so a bad id can't orphan files.

`keepCount` (gallery and fabric only) lets the caller declare how many existing items it intends
to keep, so a replace flow isn't blocked by the current DB count. Omitted → the conservative
"nothing will be removed" assumption.

Gallery and fabric uploads return `{ url, path, type }[]` and write nothing — the caller then
sends `PATCH /api/products/[id]` with `media` / `fabricMedia` arrays.

### Two different write shapes — don't mix them up

- **Create** (`POST /api/products`, `POST /api/categories`) takes **multipart FormData** and uploads files inline in the same request. On DB failure the just-uploaded files are deleted.
- **Update** (`PATCH /api/products/[id]`, `PATCH /api/categories/[slug]`) takes **JSON** containing already-uploaded `url`/`path` pairs from the media routes.

`PATCH /api/products/[id]` diffs incoming `media`/`fabricMedia` against existing rows by `path`
→ insert new, update `sortOrder` on kept, delete missing. Storage cleanup happens **after** the
transaction commits and skips any file whose URL is still referenced by an `orderItems`
snapshot.

`DELETE /api/products/[id]` refuses outright if any `orderItems` reference the product ("set
isActive to false instead"). It deletes the DB row first, then the files.

### `media-handle.ts`

- `detectMediaType(file)` → `{ isImage, isVideo, mime }` from the browser-supplied MIME type.
- `uploadSingleFile(file, folder)` → one `UploadedFile`, no `images/`/`videos/` subfolder.
- `uploadFiles(files, folder)` → `UploadedFile[]`, adds the subfolder, `mkdir -p` per unique dir.
- `deleteFile(path)` throws on failure; `deleteFiles(paths[])` swallows and logs.
- Every helper opens its own SFTP connection and closes it in a `finally`.
- `ssh2` / `ssh2-sftp-client` are in `serverExternalPackages` in `next.config.ts` — they must not be bundled.

---

## Product Search & Filtering (`src/lib/queries/products.ts`)

`getProducts()` backs both `GET /api/products` and the server-rendered shop page.
Query params: `slug`, `fabric`, `silhouette`, `sleeveType`, `work`, `categories`, `isNewArrival`,
`isHeroProduct`, `search`, `page`, `limit`. Comma-separated values become `inArray`; `work` uses
the array-overlap operator `&&`.

Non-admin callers always get `isActive = true` forced on.

Full-text search: terms are stripped to letters/digits, capped at 8, turned into a
`term:*` prefix `tsquery`, and ranked by (a) how many distinct terms matched, then
(b) `ts_rank` with weights `{0.05, 0.2, 0.6, 1.0}`, then (c) `createdAt`. The route runs a
ranked id query first, then re-fetches with relations and re-sorts in JS to preserve rank order —
Drizzle's relational `findMany` can't express the ranking directly.

---

## Home Page Data (`src/lib/queries/home.ts`)

`getHomeData()` runs three queries in `Promise.all`, then a fourth that depends on the
category result. Returns `{ heroProducts, newArrivals, categories, atelierEdit }`; the
`HomeData` type is exported and the home components take slices of it
(`HomeData["heroProducts"]`, `HomeData["categories"][number]`).

| Slice          | Source                                                   | Cap                         | Note                                                                                                                                                                      |
| -------------- | -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heroProducts` | `isActive && isHeroProduct`, ordered by `updatedAt desc` | `MAX_HERO_PRODUCTS`         | Joins **only** `isHero=true` media, then **filters out products with none** in JS — an `isHeroProduct` flag without a hero image is silently skipped, not rendered broken |
| `newArrivals`  | `isActive && isNewArrival`, `createdAt desc`             | `MAX_NEW_ARRIVALS`          | standard 3-image gallery shape                                                                                                                                            |
| `categories`   | `isActive`, `title asc`                                  | `MAX_CATEGORIES`            | `id, title, slug, description, categoryImageUrl` only                                                                                                                     |
| `atelierEdit`  | one product per category, round-robin                    | `MAX_ATELIER_EDIT_PRODUCTS` | see below                                                                                                                                                                 |

**Atelier edit** is raw SQL via ``db.execute<Row>(sql`…`)`` — the only place in the codebase
that bypasses the query builder. A window function ranks each category's newest active products
(`row_number() over (partition by category_id order by created_at desc, id desc)`), then JS
walks the categories in order picking the first product not already chosen, so a product in
two categories can't appear twice. The final `findMany` is re-sorted to the chosen order, same
pattern as the search ranking.

The page renders sections conditionally — an empty slice drops its section and the
`stitch-divider` above it, so a fresh DB shows just the hero fallback and the static
marquee/promise blocks. `HomeHero` with zero slides renders a static brand panel instead.

---

## API Response Helpers (`src/lib/api-response.ts`)

`ok`, `created`, `paginated`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`,
`validationError` (422), `internalServerError`.

`ok()` accepts an optional third `headers` argument. `internalServerError()` logs the error plus
the call site before responding.

```typescript
return paginated("Message", items, totalCount, page, limit);
return badRequest(
  "Message",
  result.error.flatten((issue) => issue.message).fieldErrors,
);
```

### `response-handler.ts`

Helpers that can't return a `NextResponse` directly (they run inside transactions, or are shared
between routes) return a `ServiceResponse<T>` discriminated union — `{ kind: "ok" | "forbidden" | ... }` —
and the route converts it with `handleResponse(result)`. The switch is exhaustiveness-checked
with a `never` assignment, so adding a `kind` breaks the build until it's handled.

Common pattern in routes:

```typescript
const ownership = await assertOwnsCartItem(itemId, currentUser, sessionId);
const ownershipResponse = handleResponse(ownership);
if (ownershipResponse.status !== 200) return ownershipResponse;
```

---

## Drizzle Patterns

```typescript
// Conditional update spread
await db.update(table).set({
  ...(name && { name: name.trim(), slug }),
  ...(isActive !== undefined && { isActive }),
})

// Transaction — use tx, not db, inside
await db.transaction(async (tx) => {
  const [row] = await tx.insert(...).returning()
  await tx.delete(...).where(...)
})

// Row locking before a state transition
const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");

// Discriminated union from helpers — never throw Response objects
return { success: true as const, address, currentUser }
return { success: false as const, response: unauthorized(...) }

// In the route handler:
const result = await getAddressById(params, request)
if (!result.success) return result.response
const { address } = result

// Relational filters take a callback, not a bare expression
where: (products, { and, eq }) => and(eq(products.id, id), eq(products.isActive, true))
```

Imports: `count`, `avg`, `sum`, `countDistinct`, `inArray`, `ne`, `gte`, `lte`, `desc`, `isNull`,
`sql`, `SQL` — all from `drizzle-orm`.

---

## Zod v4 Patterns

```typescript
import z4 from "zod/v4";

z4.uuid(); // UUID
z4.email({ error: "..." }); // email
z4.enum(PRODUCT_SIZES); // enum from a const array
z4.coerce.number().int(); // FormData strings → number

await schema
  .safeParseAsync(body) // always the async form

  // Paired fields must arrive together
  .refine(({ image, imagePath }) => !!image === !!imagePath, {
    message: "...",
    path: ["image"],
  })

  // PATCH schemas — require at least one field
  .refine(
    (data) =>
      Object.keys(data).some((k) => data[k as keyof typeof data] !== undefined),
    { message: "At least one field must be provided" },
  );
```

FormData needs manual coercion before parsing — booleans arrive as the strings `"true"`/`"false"`,
repeated fields need `formData.getAll(...)`, and absent fields must be normalized to `undefined`
(not `null`) so `.optional()` works.

---

## Slug Generation

```typescript
import slugify from "slugify";
const slug = slugify(title.trim(), { lower: true, strict: true });
```

- Always server-side; never trust a client-provided slug.
- On PATCH, only regenerate when `title` is present in the body.
- Uniqueness check must exclude the current record: `and(eq(table.slug, newSlug), ne(table.id, id))`.
- Categories are addressed by slug in the URL (`/api/categories/[slug]`), so renaming a category changes its API path.

---

## Environment Variables

```
NODE_ENV
DATABASE_URL

BETTER_AUTH_SECRET               # openssl rand -base64 32
BETTER_AUTH_URL                  # server-side base URL
NEXT_PUBLIC_BETTER_AUTH_URL      # client copy, used by createAuthClient + trustedOrigins
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

MEDIA_UPLOAD_DIR                 # local filesystem upload dir
MEDIA_REMOTE_ROOT                # remote root; stripped when building public URLs
NEXT_PUBLIC_MEDIA_BASE_URL       # public prefix — NEXT_PUBLIC_ because <Image> renders client-side
MEDIA_MAX_UPLOAD_MB

SFTP_HOST
SFTP_PORT
SFTP_USER
SFTP_PRIVATE_KEY_PATH            # path to the key file, not the PEM body
SFTP_PASSPHRASE

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

`.env.example` is committed (`.gitignore` has `.env*` then `!.env.example`) and lists every key
above with empty values — keep it in sync when adding a variable.

The Razorpay `key_id` is **not** exposed as a `NEXT_PUBLIC_` variable — the payment page reads it
from the `keyId` field that `POST /api/payments/create-order` returns. `BETTER_AUTH_SECRET`,
`MEDIA_UPLOAD_DIR` and `MEDIA_MAX_UPLOAD_MB` are declared but not referenced anywhere in `src`
(the first is read by Better Auth internally; the other two are unused).

`auth-client.ts` must use `NEXT_PUBLIC_BETTER_AUTH_URL` — it runs in the browser, where the
non-public `BETTER_AUTH_URL` is `undefined`.

SFTP auth is **private key + passphrase**, not password. `next.config.ts` allowlists
`nextmedia.shreeforstree.in` under `images.remotePatterns` — a new media host needs an entry
there or every `<Image>` breaks.

---

## Next.js 16 Gotchas

- Middleware is now **Proxy**: the file is `src/proxy.ts` with a default-exported `proxy()` function. It sets an `x-device-type: mobile | desktop` header from the user agent; layouts read it via `await headers()` to pick desktop vs mobile shells. Its matcher excludes `api/`.
- `params` is a Promise — `const { id } = await params` before destructuring:
  ```typescript
  { params }: { params: Promise<{ id: string }> }
  ```
- `cookies()` and `headers()` are async — always `await`.
- Import `NextRequest` from `"next/server"`.
- Vercel body limit is 4.5MB; Sharp compression covers images, not videos.
- `export const dynamic = "force-dynamic"` is set on `GET /api/categories` because the response varies by admin status.

---

## Frontend Conventions

- Route groups: `(shop)`, `(admin)`, `(auth)` — each with its own layout. `(admin)` redirects non-admins via `auth.api.getSession`. `(auth)` checks an `x-session` header that nothing sets, so its redirect is dead code (see Known Gaps).
- Server components hit `db` / `getProducts` directly; client components `fetch("/api/...")`. Don't add a fetch hop inside a server component for data the DB can give it.
- Device split is server-side via `x-device-type`, not CSS breakpoints, for header/nav shells. `dynamic()` imports keep the unused variant out of the bundle.
- Styling is Tailwind v4 utilities against the `@theme` tokens: `bg-paper`, `text-ink`, `text-ink-55`, `border-ink-25`, `text-rose-gold`, `font-display`, `font-body`, `font-label`, `font-serif-alt`. Ink opacity steps (`ink-05/08/15/25/40/55`) are predefined tokens — prefer them over `ink/10`-style arbitrary values.
- `.label-caps` is the tracked-out uppercase label style used across nav, buttons and eyebrows. `.stitch-divider` is the rose-gold running-stitch motif. `.btn-focus` / `.peer-focus-ring` carry the focus-visible rings — `.btn-focus` also applies `cursor-pointer`, so don't add it again.
- Base typography is set in `@layer base`: `h1`–`h4` get `--font-display` bold, and **`p` gets `--font-label` weight 400**. A paragraph is already League Spartan; adding `font-label` to a `<p>` is redundant.
- Loading states use `<Shimmer />` and the shaped skeletons in `components/ui/Shimmer.tsx` (`CardShimmer`, `CartItemShimmer`, `OrderItemsShimmer`, `PaymentSummaryShimmer`, …) — match the real layout rather than inventing a new placeholder.
- Toasts: `sonner` via `<BrandToaster />`, mounted once in the root layout. Call `toast()` from anywhere.
- Icons: `lucide-react`. Brand/payment marks live in `components/ui/icon.tsx`.
- Client state: Zustand. `sidebar-store` persists only `isCollapsed` via `partialize`.
- Drag-and-drop uploads: `useFileDragState` + `useZoneFileDrop` + `utils/FileUpload` + `DragDropGlow`.
- Buttons come from `components/ui/Buttons.tsx`. `PrimaryButton` (rose-gold fill) and `SecondaryButton` (outline) take **either** `href` **or** `onClick`, never both — the props are a discriminated union with `never` on the unused half, so the wrong combination is a type error. `href` renders a `<Link>`, `onClick` renders a `<button>`. `PrimaryButton` also handles `loading` (spinner + `aria-busy` + disabled). `BackButton` calls `router.back()`; `CopyButton` writes to the clipboard.
- Order display formatting lives in `src/lib/orders.ts` — `orderReference` (last 8 chars of the UUID, uppercase, `#`-prefixed — never show the raw UUID), `formatAmount(amount, { fractionalDigits: 0 | 2 })` (en-IN / INR, two cached `Intl.NumberFormat` instances; default 2, product cards pass 0), `formatDate` (en-IN, `d MMM yyyy`), `itemCount` (pluralized), `handleCopyToClipboard`. Use these rather than inlining new formatting.
- **`Card` (`@/utils/Card`)** is the one product/category tile, with `variant: "customer-product" | "admin-product" | "admin-category"`. Pass `href` for navigation — it renders an absolutely-positioned overlay `<Link>` and the title becomes a link; pass `onClick` only when there's no destination. Customer cards with >1 image get a three-zone hover gallery on desktop and swipe on touch, with dots. Admin variants get the ⋯ dropdown (edit / view / toggle / delete) that flips side and direction to stay on screen, and a delete dialog that requires typing the exact title. It normalizes `images[]`, `productMedia[]`, `image`, or `categoryImageUrl` into one list, excluding hero media; empty falls back to `/images/white.webp`. `ProductGrid` is a server component that just maps products to `Card`s.
- `ArrowLink` (`components/ui/ArrowLink.tsx`) is the "see more →" link used across the home sections — `label-caps`, rose-gold underline, `textColor` prop for dark backgrounds.
- `components/ui/Icon.tsx` (capital I) exports `RazorpayIcon`, `GoogleIcon`, `Ring` (the hero slide indicator — animated `stroke-dashoffset`), and `ArrowLeft` as the **default** export. Import paths are case-sensitive on Vercel even though macOS forgives them.
- `CategoryTile` links to `/shop?categories={slug}` — the query param name is plural.
- CSS animation utilities: `.animate-ken-burns` (14s scale drift, hero backgrounds) and `.animate-slide-ring` (stroke-dashoffset, the `Ring` indicator). Both — like `.shimmer` — are switched off under `prefers-reduced-motion`.
- `HomeHero` auto-advances every `HERO_SLIDE_INTERVAL_MS`; hover/focus pauses and the remaining time is preserved in a ref, so resuming doesn't restart the countdown. Rotation is disabled entirely under reduced motion.
- Auth redirects: `AuthCard`'s `getSafeRedirect()` reads `?redirect=` and only honours root-relative, same-origin paths (rejects absolute, protocol-relative `//`, and backslash variants), and never sends the user back to `/sign-in` or `/sign-up`. Google sign-in goes through `authClient.signIn.social({ provider: "google", callbackURL, errorCallbackURL })`.
- Animation: `motion/react` (not `framer-motion`). Every animated component reads `useReducedMotion()` and collapses its transitions to `{ duration: 0 }` when set — match that.
- Pages reachable by guest token export `metadata = { robots: { index: false } }`.

---

## Business Rules

- **One review per user per product** — DB unique constraint, 409 on conflict.
- **Review eligibility** — an order containing the product must be `delivered` or `returned`. Enforced on both review creation and review-image upload.
- **Shipping** — flat ₹60, free above ₹999.99, computed on `itemsTotal` (after discounts).
- **No GST** — not registered, no tax columns.
- **Max cart quantity** — 10 per unique `(cartId, productId, size)`, clamped in SQL.
- **Guest checkout** — supported; ownership via httpOnly `guest_order_{orderId}` cookie or explicit token, 30-day TTL.
- **Address deletion** — allowed; shipping is already snapshotted on the order. Deleting the default address promotes the most recent remaining one.
- **User deletion** — soft delete: anonymize PII (`name`, `email`, `phone`, `image`), set `deletedAt`, drop sessions and accounts; orders and payments are retained.
- **Category deletion** — blocked while any product is linked via `productCategories`.
- **Product deletion** — blocked entirely if any `orderItems` reference it; deactivate instead.
- **Shipping country** — `createOrderSchema` defaults `shippingCountry` to `"India"`, matching the `addresses.country` column default.
- **Sizes** — from the `PRODUCT_SIZES` const; **colors** — free-form text array.
- **Cart merge** — `POST /api/cart/merge` is meant to run immediately after login. **Nothing calls it yet** (see Known Gaps).

---

## Code Quality Rules

- Production-grade only — no shortcuts.
- Never throw `Response` objects across module boundaries — use the `ServiceResponse` union + `handleResponse`. (`getOrCreateCart` is the one legacy exception; it returns a `Response`, and callers check `instanceof Response`.)
- **Storage failures must never block DB operations.** Order of operations: DB write first, storage cleanup after, wrapped in try/catch. For replacements: upload new → update DB → delete old.
- **Client-supplied storage paths are attacker-controlled.** Anything that will later reach `deleteFile`/`deleteFiles` must pass `isOwnedMediaPath(path, scopePrefix)` first — see the review and user-avatar routes.
- `await Promise.all(array.map(...))` — never `await array.map(...)`.
- `price` / `discountedPrice` / all `numeric` columns are **strings** from the DB — `Number()` to compute, `.toString()` / `.toFixed(2)` to write back.
- `avg()` and `sum()` return strings — `parseFloat(raw).toFixed(1)` before returning.
- `timingSafeEqual` throws on length mismatch — check lengths first, every time.
- `$onUpdate` on the schema handles `updatedAt`; don't set it manually.
- Money comparisons against Razorpay are in **paise**: `Math.round(Number(totalAmount) * 100)`.
- Pagination is uniform: `page`/`limit` query params, `Math.max(1, parseInt(...) || default)`, plus a separate `count()` query.

---

## Known Gaps / TODOs

Derived from TODOs and unfinished wiring in the code — not a roadmap.

1. **Cart merge is never invoked** — `POST /api/cart/merge` exists but no client code calls it, so a guest's cart is abandoned on sign-in. Needs a client component mounted in `(shop)/layout.tsx` that fires once per session id after `useSession()` resolves (Google login is a full-page redirect, so it can't live in `AuthCard`). Details in `.claude/Claude-Context.md`.
2. **Order confirmation email** — `src/app/api/payments/webhook/route.ts:244`. The confirming and confirmation pages both promise the customer an email ("we'll email you once the payment is confirmed"), and nothing sends one. Resend is listed in the stack but is not installed or configured.
3. **`(auth)` layout redirect never fires** — `src/app/(auth)/layout.tsx:10` reads an `x-session` header that nothing in the app sets (`proxy.ts` only sets `x-device-type`). A signed-in user can still open `/sign-in` and `/sign-up`. Contrast `(admin)/layout.tsx`, which now checks the real session.
4. **`account.issuer` migration will fail on a populated database** — `0010` adds the column `NOT NULL` with no default. Backfill before migrating any environment that already has accounts.
5. **`product_search_vector` is not in migrations** — product search depends on a DB function that no migration creates. A DB rebuilt from migrations alone will 500 on any `?search=` query.
6. **Video optimization** — `src/lib/optimize.ts:8`. `optimizeVideo()` is a passthrough (`Buffer.from(await file.arrayBuffer())`); the hook exists but does nothing. Videos bypass compression and count against the 4.5MB Vercel body limit.
7. **Admin sidebar role is hardcoded** — `src/components/admin/AdminSidebar.tsx:250` should read the role from the session.
