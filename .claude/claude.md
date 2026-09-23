# Shreeforstree - Claude Code Context

## Project Overview

Full-stack e-commerce site for a family member's custom women's clothing business.
This file is `.claude/claude.md`, tracked in git. `.claude/claude-context.md` alongside it is an
**untracked session log** (gitignored) - background only, not instructions.
Package manager: `pnpm` exclusively - `preinstall` runs `npx only-allow pnpm`, so npm/npx installs are hard-blocked.

**Formatting rule for both files:** plain keyboard characters only. Hyphens, not em or en
dashes; `->` not arrows; `...` not ellipsis; `x` not the multiplication sign; ASCII tree
characters (`|--`, `` `-- ``); no section signs or other typographic symbols. Anything you
can't type on a standard keyboard doesn't belong in these docs.

**Aesthetic:** warm paper/ink, not dark mode. Off-white `--color-paper` ground, near-black
`--color-ink` text, **rose-gold** accents. `sage`/`rust` are functional status colors used in
admin dashboards only - never customer-facing UI. All tokens are OKLCH and derived from the
logo mark; see `src/app/globals.css`.

---

## Tech Stack

| Layer            | Technology                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Framework        | Next.js 16.3.5 (App Router) + React 19.3.0 + TypeScript 6.0.3                                    |
| Styling          | Tailwind CSS v4 (`@theme` directive in `globals.css`, no tailwind.config)                        |
| Database         | Neon (PostgreSQL) via `@neondatabase/serverless` Pool                                            |
| ORM              | Drizzle ORM 0.45 + drizzle-kit 0.31                                                              |
| Auth             | Better Auth 1.7 (email/password + Google OAuth, DB-backed rate limiting)                         |
| Payments         | Razorpay (Checkout script + server SDK + webhooks)                                               |
| Media Storage    | Hostinger over SFTP (`ssh2-sftp-client`, private-key auth)                                       |
| Image Processing | Sharp 0.32 - resize to fit 1200x1500, WebP @ 85%                                                 |
| Email            | Resend - **not wired up yet**                                                                    |
| Validation       | Zod v4 (`import z4 from "zod/v4"`)                                                               |
| State            | Zustand 5 (with `persist`)                                                                       |
| UI               | lucide-react (icons), motion, recharts, sonner (toasts)                                          |
| Fonts            | Playfair Display (display), Cormorant Garamond (serif-alt), Inter (body), League Spartan (label) |
| Deployment       | Vercel (app), Hostinger (media at `nextmedia.shreeforstree.in`)                                  |

`package.json` ranges are looser than what's installed - check `node_modules` before assuming a
version. Currently resolved: better-auth **1.7.5**, zod **4.5.4**, tailwindcss **4.3.3**,
drizzle-orm **0.45.2**. `next`, `react`, `react-dom` and `eslint-config-next` are pinned exactly.
`packageManager` is `pnpm@12.4.2` and `engines.node` is `>=24`. `pg`, `@types/pg` and
`next-themes` were removed - the Neon Pool is the only DB client and there is no theme switcher.

**There is no test framework.** Vitest and the `tests/` directory were removed deliberately
(commit `7769bdb`). Don't add test files, a `test` script, or a test runner unless asked.

### Commands

```bash
pnpm dev            # next dev
pnpm build          # next build
pnpm start          # next start
pnpm lint           # eslint .
pnpm lint:fix       # eslint . --fix
pnpm format         # prettier --write .
pnpm format:check   # prettier --check .
pnpm typecheck      # tsc --noEmit
pnpm check          # typecheck + lint + format:check - run before every commit
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate     # drizzle-kit migrate
pnpm db:studio      # drizzle-kit studio
pnpm db:push        # drizzle-kit push
```

`pnpm check` baseline: tsc clean, prettier clean, 5 eslint warnings - all
`@next/next/no-img-element` (`ProductForm.tsx:1366`, `ProductMediaManager.tsx:98/182/251`,
`FileUpload.tsx:146`). Anything above that is new.
`@typescript-eslint/no-unused-vars` is `warn` with `ignoreRestSiblings` and `^_`
ignore patterns, so `const { image_path: _drop, ...rest } = row` is the sanctioned way to strip
a field. `react-hooks/set-state-in-effect` is an **error** here, and it fires only on a direct
`setState()` in an effect body - a call wrapped in a helper closure does not trip it. Probe the
rule with a throwaway file and `pnpm exec eslint` before claiming what it will or won't flag. `.prettierignore` excludes `.next`, `node_modules`, `src/lib/db/migrations` and
`pnpm-lock.yaml` (one path per line - a space-separated list silently matches nothing).

### Reading Next.js docs

`AGENTS.md` in the repo root requires reading the relevant doc under
`node_modules/next/dist/docs/` before doing Next.js work. Training data lags; the vendored
docs are the source of truth for this version.

---

## Directory Structure

```
src/
|-- app/
|   |-- (admin)/
|   |   |-- layout.tsx                          device-aware shell: sidebar/topbar or mobile nav
|   |   `-- admin/
|   |       |-- dashboard/page.tsx
|   |       |-- products/{page,new/page,[id]/{page,loading}}.tsx
|   |       |-- categories/{page,post/page,[slug]/{page,loading,CategoryEditForm}}.tsx
|   |       |-- orders/{page.tsx,[id]/page.tsx}   list (client, paged) + detail (server, direct db)
|   |       |-- users/page.tsx
|   |       |-- notifications/page.tsx
|   |       `-- settings/page.tsx
|   |-- (auth)/{layout,sign-in/page,sign-up/page}.tsx
|   |-- (shop)/
|   |   |-- layout.tsx                          header + mobile nav, <CartMerge />, admin link if role=admin
|   |   |-- page.tsx                            home - getHomeData() -> seven sections
|   |   |-- shop/{page,[slug]/page}.tsx         listing + PDP
|   |   |-- collections/, search/, contact/, our-story/
|   |   |-- cart/page.tsx                       mobile: renders the Cart drawer full-screen
|   |   |-- wishlist/
|   |   |-- checkout/
|   |   |   |-- page.tsx                        address + email, POSTs the order
|   |   |   `-- [orderId]/
|   |   |       |-- payment/page.tsx            opens Razorpay Checkout
|   |   |       `-- confirming/page.tsx         polls order status until resolved
|   |   |-- orders/
|   |   |   |-- page.tsx                        list - server component, db query
|   |   |   `-- [id]/
|   |   |       |-- page.tsx                    order detail (noindex)
|   |   |       `-- confirmation/page.tsx       post-payment success (noindex)
|   |   `-- account/{page,addresses/page}.tsx
|   |-- api/
|   |   |-- auth/[...all]/route.ts              Better Auth handler
|   |   |-- admin/stats/route.ts                GET (admin dashboard aggregates)
|   |   |-- categories/
|   |   |   |-- route.ts                        GET, POST (multipart, uploads inline)
|   |   |   `-- [slug]/route.ts                 PATCH, DELETE      <- keyed by SLUG, not id
|   |   |-- products/
|   |   |   |-- route.ts                        GET (filters/search), POST (multipart)
|   |   |   `-- [id]/
|   |   |       |-- route.ts                    GET, PATCH (JSON), DELETE
|   |   |       `-- reviews/route.ts            GET, POST
|   |   |-- users/{route.ts, [id]/route.ts}     GET(admin) | GET, PATCH, DELETE
|   |   |-- addresses/{route.ts, [id]/route.ts}
|   |   |-- cart/
|   |   |   |-- route.ts                        GET, POST, DELETE (clear)
|   |   |   |-- [itemId]/route.ts               PATCH, DELETE
|   |   |   `-- merge/route.ts                  POST (guest cart -> user cart; fired by <CartMerge />)
|   |   |-- orders/
|   |   |   |-- route.ts                        GET, POST
|   |   |   |-- [id]/route.ts                   GET (owner or guest token)
|   |   |   `-- [id]/status/route.ts            GET (poll), PATCH (admin)
|   |   |-- payments/
|   |   |   |-- create-order/route.ts           POST
|   |   |   |-- confirm/route.ts                POST (acknowledge only - no DB writes)
|   |   |   |-- refund/route.ts                 POST (admin; records a refund already issued)
|   |   |   `-- webhook/route.ts                POST (Razorpay -> source of truth)
|   |   |-- wishlist/{route.ts, [productId]/route.ts}
|   |   |-- reviews/[id]/route.ts               DELETE
|   |   `-- media/
|   |       |-- upload/route.ts                 avatar | review (authenticated users)
|   |       `-- admin/upload/route.ts           product/category media (admin)
|   |-- actions.ts                              "use server" - setCartCookie
|   |-- globals.css                             Tailwind v4 @theme tokens + utilities
|   |-- layout.tsx                              fonts, metadata, <BrandToaster />
|   `-- icon.svg
|-- components/
|   |-- admin/    AdminSidebar, AdminDesktopTopBar, AdminMobileTopBar, Notifications,
|   |             ProductForm, ProductMediaManager, StatCard, SparkLine,
|   |             OrderTracker, ShipOrderDialog, RefundBanner
|   |-- auth/     AuthCard
|   |-- shop/     HeaderDesktop, HeaderMobile, Cart, CartMerge, ProductGrid, CategoryTile,
|   |             home/{HomeHero,HomeMarquee,NewArrivalsRail,HomeCollections,
|   |                   AtelierEdit,HomeSignature,HomePromise},
|   |             Addresses/{AddressModal,AllAddresses},
|   |             product/{ProductGallery,ProductDetails,ProductDescription,
|   |                      ProductPurchase,AddToBag,QuantitySelector},
|   |             search/{searchPanel,useSearch},
|   |             orders/{OrderAddressSnapshot,OrderItemThumbnail,SuccessMark}
|   `-- ui/       BrandToaster, Shimmer, Buttons, ArrowLink, Icon, OrderStatusBadge,
|                 PaginationButtons, ConfirmDialog
|-- hooks/        useFileDragState, useZoneFileDrop
|-- stores/       sidebar-store (zustand + persist)
|-- types/
|   |-- api.ts                                  ApiSuccess / ApiPaginated / ApiError / Jsonified / ApiResult
|   |-- models.ts                               $inferSelect alias per table + OrderStatus / PaymentStatus
|   |-- api/{orders,products,reviews,cart,categories,addresses,users,wishlist,media,payments,admin}.ts
|   |                                           per-route payload types (see "API response types")
|   `-- razorpay.ts                             incl. `declare global { Window.Razorpay }`
|-- utils/        Card, DragDropGlow, Dropdown, FileUpload, NavMobile
|-- proxy.ts      Next 16 "Proxy" (was middleware) - sets x-device-type header
`-- lib/
    |-- db/
    |   |-- schema/*.schema.ts + index.ts       barrel export
    |   |-- auth.ts                             Better Auth config
    |   |-- index.ts                            Drizzle client (Neon Pool)
    |   |-- errors.ts                           isUniqueViolation (SQLSTATE 23505)
    |   `-- migrations/                         0000-0011 + meta/
    |-- media/
    |   |-- media-handle.ts                     SFTP connect/upload/delete/detect
    |   `-- path-guard.ts                       isOwnedMediaPath - anti path-traversal
    |-- queries/
    |   |-- products.ts                         getProducts: filters, full-text search, paging
    |   `-- home.ts                             getHomeData: hero / new arrivals / categories / atelier edit
    |-- validators/*.validators.ts              Zod v4 schemas
    |-- api-response.ts                         typed NextResponse helpers
    |-- response-handler.ts                     ServiceResponse union -> NextResponse
    |-- auth-utils.ts                           getCurrentUser, adminCheck, ownership asserts
    |-- cart-utils.ts                           session cookie, getOrCreateCart, upsertCartItem, Tx
    |-- order-utils.ts                          guest cookie set/resolve + getOwnedOrder
    |-- orders.ts                                display formatters (reference, amount, date)
    |-- optimize.ts                             optimizeImage (Sharp) / optimizeVideo (passthrough)
    |-- razorpay.ts                             server SDK instance
    |-- razorpay-checkout.ts                    browser checkout.js loader (memoized)
    |-- auth-client.ts                          better-auth/react client
    `-- constants.ts
```

---

## Database Config

```bash
pnpm db:generate
pnpm db:migrate
```

`drizzle.config.ts` points `schema` at `./src/lib/db/schema/index.ts` - the barrel export.
Never point it at `./src/lib/db/index.ts` (that's the client). Migrations output to
`./src/lib/db/migrations`.

`account.issuer` came and went: `0010_regular_mikhail_rasputin.sql` added it `NOT NULL` for
Better Auth 1.7.0-1.7.2, and `0011_chilly_miek.sql` drops it again because 1.7.3+ reverted the
change. The column is gone from `auth.schema.ts`. A fresh `db:migrate` runs both and nets to
nothing; a database stuck between the two just needs `0011`. Don't re-add the column, and don't
downgrade better-auth below 1.7.3 without restoring it.

**Not everything in the DB is in migrations.** `src/lib/queries/products.ts` calls a Postgres
function `product_search_vector(title, description, keywords)` that does **not** appear in any
migration file - it was created directly against the database. Product search silently breaks
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
- Thumbnail: `orderBy sortOrder asc, limit 1` - never `sortOrder = 0` (fragile).
- Listing/wishlist cards fetch `limit: 3` gallery images.

### SFTP path conventions

`uploadFiles()` appends an `images/` or `videos/` subfolder automatically based on MIME type.
`uploadSingleFile()` does **not** (it passes `skipMediaFolder: true`).

```
products/{productId}/{images|videos}/{filename}   <- gallery, via uploadFiles
products/{productId}/fabric/{images}/{filename}   <- fabric swatches, via uploadFiles
products/{productId}/hero-image/{filename}        <- via uploadSingleFile
categories/{categoryId}/category-image/{filename} <- via uploadSingleFile
categories/{categoryId}/size-chart-image/{file}   <- via uploadSingleFile
reviews/{userId}/{productId}/{images}/{filename}  <- via uploadFiles
avatars/{userId}/{filename}                       <- via uploadSingleFile
```

All paths are absolute on the remote, prefixed with `MEDIA_REMOTE_ROOT`. Filenames are always
`{timestamp}-{uuid}.webp`. Public URLs are built by stripping `MEDIA_REMOTE_ROOT` and prefixing
`NEXT_PUBLIC_MEDIA_BASE_URL`. Deleting a file also walks up and removes now-empty parent
directories (`cleanupEmptyFolders`), stopping at `MEDIA_REMOTE_ROOT`.

### `products` - attribute columns

Beyond title/description/price/sizes/colors: `fabric` (required), `work[]`, `silhouette`,
`lining`, `sleeveType`, `neckline`, `length`, `careInstructions`, `keywords[]`, plus flags
`isActive`, `isNewArrival`, `isHeroProduct`. `PRODUCT_SIZES` (`XS...3XL`, `Free Size`) is exported
from `products.schema.ts` and drives both the PG enum and the Zod enums.

### `categories` - `title`, not `name`

Columns are `title` + `slug`, plus two independent image pairs: `categoryImageUrl/Path` and
`sizeChartImageUrl/Path`. The size chart is surfaced on the PDP as the size guide, read from
the product's **first** category.

### Orders - snapshot pattern

Shipping fields are copied onto the `orders` row at creation (`shippingFullName`,
`shippingPhone`, `shippingEmail`, `shippingAddressLine1/2`, `shippingCity/State/Pincode/Country`).
`addressId` and `userId` are FKs kept only for reference - both `onDelete: set null`, so users
can delete addresses and accounts without breaking order history. `cartId` (also `set null`)
records which cart produced the order; the webhook uses it to clear `cartItems` after capture.

### Orders - guest checkout

Orders can be placed without an account. When `currentUser` is null the POST route generates a
`guestToken` (`crypto.randomBytes(16).toString("hex")`), stores it on the order (unique), and
sets an httpOnly cookie `guest_order_{orderId}` with a **30-day** TTL.

`resolveGuestToken(orderId, tokenFromRequest)` prefers an explicit token (request body, or the
`guest-token` header on `GET /api/orders/[id]` and `GET /api/orders/[id]/status`) and falls back
to the cookie. `getOwnedOrder` reads the cookie only.
`assertOrderOwnership(order, currentUserId?, guestToken?)` returns `{ kind, message }` and
compares tokens with `crypto.timingSafeEqual` after a length check.

### Order amounts - four separate columns

```
originalAmount  = sum(price * quantity)                        - full price, no discounts
discountAmount  = sum((price - effectivePrice) * quantity)     - savings
itemsTotal      = originalAmount - discountAmount              - what the customer pays for items
shippingCharges = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE
totalAmount     = itemsTotal + shippingCharges                 - charged to Razorpay
```

`itemsTotal` (not `originalAmount`) drives the free-shipping check. "Effective price" is
`Number(discountedPrice) || Number(price)` - a zero or absent discount falls back to full price.
`orderItems.priceAtPurchase` uses the same rule.

### Refunds - recorded by hand

`POST /api/payments/refund` is the only writer of `paymentStatus: "refunded"`. It is
**bookkeeping, not money**: no Razorpay API call happens: the admin issues the refund in the
Razorpay dashboard and then records it here. Admin-only (`adminCheck` -> `forbidden`), takes
`{ orderId }` in the body (no dynamic segment), and inside a transaction with
`SELECT ... FOR UPDATE` it refuses with `conflict("Refund not allowed")` unless the order has
`refundRequired` **and** an `orderStatus` of `cancelled` or `returned`. On success it flips the
`status = "success"` payment row to `refunded` and sets the order to
`paymentStatus: "refunded", refundRequired: false`, returning the updated `Order`.

`refundRequired` is set in two places: the status PATCH (cancel or return of a paid order) and
the webhook (a capture landing on an already-paid order). Nothing clears it except this route.

### Payments - two-step, webhook-authoritative

The `payments` row is inserted at Razorpay-order creation with `transactionId: null` and
`method: null`. Both are filled in **by the webhook**, never by the client. Status enum:
`pending | success | failed | refunded | expired`. Stale pending rows are marked `expired`
when a new payment order is created. `failureReason` is populated from the Razorpay error
fields, trimmed to 240 chars.

### Reviews - purchase verified

`isVerified` means the user actually purchased and received the product. Set to `true`
automatically on insert after the eligibility check - no manual admin approval. Eligible order
statuses: `delivered`, `returned`. Unique `(userId, productId)` - one review per user per
product; a concurrent duplicate is caught via `isUniqueViolation(error)` and returned as 409.
A `check` constraint enforces `rating BETWEEN 1 AND 5`. `GET /api/products/[id]/reviews` is
`paginated<ProductReview>` with `orderBy desc(createdAt)` - the same `page`/`limit` contract as
every other list. `GET /api/products/[id]` returns `ProductDetailWithRating`, i.e. the product
plus `averageRating` and `reviewCount`.

### User avatar - `image_path` additionalField

Better Auth's `image` holds the URL. `image_path` (snake_case in both the schema object **and**
the DB column, and in `additionalFields`) holds the SFTP path for deletion on replacement.
Note the mismatch: the **API** field in `updateUserSchema` is camelCase `imagePath`, mapped to
`image_path` when writing. Additional fields: `role`, `deletedAt`, `phone`, `image_path` -
`role` and `deletedAt` are `input: false` (not settable by the user). API responses never
include `image_path` - the user routes return `PublicUser = Omit<User, "image_path">`, stripping
it with a rest-destructure before `ok<PublicUser>()`.

### Wishlist - composite PK, no id column

`(userId, productId)` is the composite primary key. Always use both in where clauses.

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

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  not_placed: ["placed"],
  placed: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
```

`not_placed -> placed` happens **only** in the webhook, never via `PATCH /api/orders/[id]/status`.
That's why `not_placed` is excluded from `updateOrderSchema`. `GET /api/orders` narrows the
`?orderStatus=` query param with an `isOrderStatus` type guard over `orderStatusEnum.enumValues`
rather than casting.

`Record<OrderStatus, OrderStatus[]>` (imported from `@/types/models`) means every status must
have an entry - adding one to the enum breaks the build until the table is updated.

The status PATCH uses an optimistic guard - the `where` clause re-asserts the status the
transition was validated against, and a `undefined` result returns 409 rather than silently
applying a stale transition. Moving to `cancelled`/`returned` while `paymentStatus === "success"`
sets `refundRequired = true`.

### Shipping an order

`PATCH /api/orders/[id]/status` also writes `trackingNumber` and `estimatedDelivery`. The
validator is split in two: `updateOrderFields` (the plain `z4.object`) and `updateOrderSchema`
(`updateOrderFields.refine(...)`, which requires `trackingNumber` when `orderStatus === "shipped"`).
The split exists because a refined schema is a `ZodEffects` with no `.shape`, and
`OrderFieldErrors` in `src/types/api/orders.ts` is keyed off
`keyof typeof updateOrderFields.shape`. Import `updateOrderSchema` to parse and
`updateOrderFields` only for that key type.

`orders.trackingNumber` is `unique`, so a duplicate raises 23505. The route catches it with
`isUniqueViolation(error)` **before** falling through to `internalServerError` and returns
`conflict(message, { trackingNumber: [message] })` - `conflict()` takes an optional `errors`
argument like `badRequest`. That makes 409 ambiguous on the client: a 409 with `errors` is a
duplicate tracking number (show it under the field, keep the dialog open), a 409 without is the
stale-status guard (`router.refresh()` to snap to reality).

---

## Auth Utils (`src/lib/auth-utils.ts`)

- `getCurrentUser(input)` and `adminCheck(input)` both accept a `Request` **or** a bare `Headers` object - server components pass `await headers()`, route handlers pass the `Request`. Never call `auth.api.getSession` without headers.
- `adminCheck` returns a boolean - check it explicitly.
- Need both user and admin in one route? Get `currentUser`, then check `currentUser.role === "admin"` inline. Don't call both helpers - that's two session lookups.
- `assertOrderOwnership` / `assertOwnsCartItem` return `{ kind, message, ... }` objects designed to feed straight into `handleResponse()`.
- Types: `Session` and `User` are exported from `src/lib/db/auth.ts`.

---

## Cart (`src/lib/cart-utils.ts`)

**The session id is a cookie, not a header.** `getOrCreateSessionId()` reads the httpOnly
`cartCookie` (30-day TTL) and, if absent, mints one via the `setCartCookie` server action.
There is no `x-session-id` header anywhere in this codebase - don't reintroduce one.

- Cart routes allow guests - never `401` for missing auth.
- Guest carts: `userId = null`, identified by `sessionId`. Partial unique indexes enforce one cart per logged-in user and one per guest session.
- **A `sessionId` can be on both an account cart and a guest cart at once** (the account cart keeps the cookie's id it was created with). Every guest-branch lookup must therefore be `and(eq(carts.sessionId, sessionId), isNull(carts.userId))` - `sessionId` alone would hand a signed-out browser the account's cart. The pattern is:
  ```typescript
  where: (carts, { and, eq, isNull }) =>
    userId
      ? eq(carts.userId, userId)
      : and(eq(carts.sessionId, sessionId), isNull(carts.userId)),
  ```
  Used in `getOrCreateCart`, the cart lookup in `POST /api/orders`, and `assertOwnsCartItem` (`item.cart.userId === currentUser?.id || (item.cart.sessionId === sessionId && item.cart.userId === null)`). Use a ternary, not `and(x, !user && isNull(...))` - the `&&` can yield `false`, which `and()` rejects; and use `isNull()`, never `eq(col, null)`.
- `getOrCreateCart(userId, sessionId, tx?)` - accepts an optional `tx`. Returns either the cart **or** a `Response` (from `internalServerError`); callers must do `if (result instanceof Response) return result`.
- `upsertCartItem(tx, {...})` - `onConflictDoUpdate` on `(cartId, productId, size)` with `LEAST(quantity + n, maxQuantity)`, so quantity is clamped in SQL.
- `Tx` type is exported here for typing transaction params.
- `GET /api/cart` filters out inactive products before computing totals and returns `amountToFreeShipping`.
- `POST /api/cart/merge` - moves guest cart items onto the user cart (via `upsertCartItem`, so quantities clamp to `MAX_CART_ITEMS`), then deletes the guest cart. Requires a session (401 otherwise). Returns `200 { merged: false }` when there is no guest cart - that is the normal case on a clean login, not an error. The user cart comes from `getOrCreateCart(userId, sessionId, tx)`; don't replace that with a bare `insert ... onConflictDoNothing({ target: carts.userId })` - the unique index on `userId` is partial, so Postgres rejects it with 42P10 unless a matching `where` is supplied.

### Cart merge on login (`components/shop/CartMerge.tsx`)

Both login paths are full-page navigations (email sign-in sets `window.location.href`; Google
is an OAuth redirect), so the merge runs on the **landing** side: `<CartMerge />` is mounted once
in `(shop)/layout.tsx`, renders nothing, and fires `POST /api/cart/merge` when `useSession()`
resolves with a `session.session.id`. It runs once per session id (sessionStorage key
`cart-merged:{id}`, so a re-login merges again) and an `inFlight` ref absorbs Strict Mode's
double-invoke. The effect depends on `[isPending, session?.session.id]` only - `session.user` is a
new object on every refetch.

When the response is `merged: true` it dispatches a `window` event `cart:merged`. Anything that
fetches the cart on mount and could race the merge must listen for it - `/checkout` does
(`fetchOrderItems` is a `useCallback` re-run by the listener). The `Cart` drawer doesn't need to;
it refetches on every open.

---

## Payment Flow

Three pages carry the flow, and each hands off by URL - there is no shared client state
between them.

```
/checkout
  POST /api/orders                 -> order (orderStatus "not_placed", paymentStatus "pending")
                                     guest? -> guestToken + guest_order_{id} cookie
                                     router.replace(`/checkout/{orderId}/payment`)

/checkout/[orderId]/payment
  POST /api/payments/create-order  -> reuse or create Razorpay order, insert payments row
                                     returns { razorpayOrderId, amount, currency, keyId,
                                               name, email, contact }
                                     no razorpayOrderId => already paid => jump to confirmation
  loadRazorpayCheckoutScript()     -> open Razorpay Checkout
  handler:
    POST /api/payments/confirm     -> verifies the client signature and LOGS the result.
                                     Deliberately does NOT mutate order/payment state.
                                     router.replace(`/checkout/{orderId}/confirming`)

/checkout/[orderId]/confirming
  GET /api/orders/[id]/status      -> polled until the webhook lands (see below)
                                     success => router.replace(`/orders/{id}/confirmation`)

(out of band)
  POST /api/payments/webhook       -> THE source of truth. Verifies x-razorpay-signature,
                                     handles payment.captured / payment.failed.
```

**The payment page is effect-driven and guarded.** A `hasOpened` ref stops React Strict Mode's
double-invoke from creating two Razorpay orders; it is reset on every failure path so "Try
again" works. The Razorpay instance is kept in a ref and `.close()`d on unmount. Checkout is
prefilled from the **order's shipping snapshot** (`name`/`email`/`contact` returned by
create-order), never from the session. Theme color is `#AD6D5E` (rose-gold). Dismissing the
modal toasts and returns to `/checkout` - the order survives, unpaid.

`payment_capture: true` is set on the Razorpay order, so authorized payments auto-capture and
`payment.captured` fires without a manual capture step.

### `GET /api/orders/[id]/status` - the polling endpoint

Ownership is checked the same way as everywhere else (session user, or guest token from the
`guest-token` header / cookie). It does **not** return the raw columns - it collapses them into
a payment-centric verdict:

| Condition                                                        | Returned `status`                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `paymentStatus === "success"` and `orderStatus !== "not_placed"` | `success`                                                |
| `paymentStatus === "failed"`                                     | `failed` (+ `failureReason` from the latest payment row) |
| `paymentStatus === "refunded"`                                   | `refunded`                                               |
| otherwise                                                        | `pending`                                                |

Responds with `Cache-Control: no-store` - it is polled, and a cached `pending` would strand the
user.

**Polling cadence** (`confirming/page.tsx`): every 2s for the first 20s, then every 6s, giving
up at 60s with a "still confirming, we'll email you" state. It stops on any non-`pending`
status. Two refs (`cancelledRef`, `navigatedRef`) prevent a late response from navigating after
unmount. The waiting state animates the order's own product images in a circular carousel, and
`useReducedMotion` disables it.

`handleCaptured` runs in a transaction with `SELECT ... FOR UPDATE` on both the payment and the
order, and is idempotent - it bails out on already-`success`/`refunded` payments, on amount or
currency mismatch, and on a duplicate `transactionId`. A capture arriving for an order already
marked paid sets `refundRequired = true` instead of double-crediting. On success it sets
payment `success`, order `placed` + `paymentStatus success`, and clears `cartItems` for the
order's `cartId`.

`handleFailed` marks the payment `failed` with a `failureReason` derived from
`error_description -> error_reason -> error_code`, and leaves the order untouched.

Both signature checks use `crypto.timingSafeEqual` - **always compare buffer lengths first**, it
throws otherwise. Client-side signature: HMAC-SHA256 of `${razorpayOrderId}|${razorpayPaymentId}`
with `RAZORPAY_KEY_SECRET`. Webhook signature: HMAC-SHA256 of the **raw request body**
(`await request.text()`, never the re-serialized JSON) with `RAZORPAY_WEBHOOK_SECRET`.

Unhandled webhook events return `200 ok` so Razorpay doesn't retry them.

---

## Reading an order from a server component (`getOwnedOrder`)

`src/lib/order-utils.ts` exports `getOwnedOrder({ orderId })` - the single entry point the order
pages use. It validates the UUID, loads the order with `orderItems` and `payments` (both newest
first), resolves the current user from `await headers()`, resolves the guest token **from the
cookie only** (no request object to read a header from), and runs `assertOrderOwnership`.

```typescript
const orderResponse = await getOwnedOrder({ orderId });
if (orderResponse.kind !== "ok") return notFound();
const { data: orderDetails } = orderResponse;
```

Its return shape is `{ kind: "ok" | "error", status?, message, data? }` - **not** the
`ServiceResponse` union, and not compatible with `handleResponse()`. A failed ownership check
returns `400 / "Invalid order ID"` rather than a 403, so a probing user can't tell a real order
apart from one they don't own. Pages turn any non-`ok` into `notFound()`.

`/orders/[id]/confirmation` additionally redirects to `/orders/[id]` unless the order is fully
settled (`orderStatus === "placed"` && `paymentStatus === "success"` && latest payment
`success`), so the success page can never render for an unpaid order.

Both order pages export `metadata = { robots: { index: false } }`. Anything reachable by guest
token must stay out of search results.

---

## Admin orders

**The admin pages do not reuse the customer order endpoints.** `assertOrderOwnership` has no
admin bypass, so `GET /api/orders/[id]` and `getOwnedOrder` would 403 an admin looking at
someone else's order. `(admin)/layout.tsx`'s session gate is the authorization boundary, and
`admin/orders/[id]/page.tsx` queries `db` directly (after a `z4.uuid()` check) with `orderItems`
and `payments`.

- **List** (`admin/orders/page.tsx`) is a client page: fetches `/api/orders?page=N&limit=10` as
  `ApiPaginatedResult<OrdersListItem>`, shows `<AdminOrdersShimmerGrid />` while loading, and
  renders `<PaginationButtons totalPages currentPage onPageChange />` only when
  `pagination.totalPages > 1` (a parent `gap-4` would otherwise leave a stray gap).
- **Both order lists share `OrdersListItem`**, and the shared half is only
  `orderItems: Pick<OrderItem, "id">[]` - enough for `itemCount()`. The customer list also
  selects `productImageUrl` for a row thumbnail, so that field is
  `Partial<Pick<OrderItem, "productImageUrl">>` on the type: present when the query asks for it,
  absent for the admin list, and narrowed before use. When two callers of one payload type need
  different columns, widen the type with `Partial` and keep the `columns:` selection per query
  rather than forking the type.
- `GET /api/orders` supports `?search=` **for admins only** - it matches
  `shippingFullName`, `shippingEmail`, or the 8-character order reference via
  ``ilike(sql`upper(right(${orders.id}::text, 8))`, term.toUpperCase())``. The list page does not
  have a search box wired up yet.
- **Detail** renders `<RefundBanner />` (only when `refundRequired`), then `<OrderTracker />`,
  then the items panel and the right-hand column (`shrink-0 md:w-120`; the row is
  `items-start justify-between` - without an explicit width both columns content-size and
  collapse).
- **`OrderTracker`** (`components/admin/OrderTracker.tsx`) owns every status transition.
  `STEPS` is the four-step happy path and `ACTIVE_INDEX: Record<OrderStatus, number>` maps each
  status onto it (`not_placed` and `cancelled` are `-1`, `returned` sits at `3`). The current
  status is checked, the next is rose-gold, and the rail segment leading to it is highlighted.
  `move(next, extra?)` PATCHes the status route and returns `{ ok, error? }` so callers can keep
  a dialog open on failure. Destructive moves (`cancelled`, `returned`) open a `ConfirmDialog`
  from the `DIALOGS` record, with `PAID_WARNING` added only when `paymentStatus === "success"`;
  `shipped` opens `ShipOrderDialog` instead; everything else calls `move` directly. Every button
  is `disabled={pending !== null}` - disabling only the clicked one leaves the rest live during
  the request.
- **Dialogs.** `ConfirmDialog` (`components/ui/ConfirmDialog.tsx`) is the generic one:
  `{ open, title, description, warning?, cancelLabel, confirmLabel, confirmVariant: "rust" | "ink",
loading, onCancel, onConfirm }`. `ShipOrderDialog` (`components/admin/`) is the same portal +
  focus-trap shell with a required tracking-number field, an optional delivery date, and inline
  `errors: OrderFieldErrors`. Both portal to `document.body`, trap Tab, close on Escape and
  outside click (both no-ops while `loading`), and set `body.style.overflow = "hidden"`.
  `ShipOrderDialog` is rendered conditionally (`{shipDialogOpen && <ShipOrderDialog ... />}`) so
  unmounting resets its fields - that replaces a reset effect, which
  `react-hooks/set-state-in-effect` forbids.
- After any mutation, `router.refresh()` re-renders the server component; the banner unmounts and
  the badges flip in the same pass.
- **Tracking display is shared.** `OrderAddressSnapshot` takes
  `Pick<Order, ...shipping> & Partial<Pick<Order, "trackingNumber" | "estimatedDelivery">>`, so
  the admin detail page and both customer order pages render the tracking block from one
  component. It only appears once `trackingNumber` is set.

---

## Media Pipeline

### `POST /api/media/upload` - authenticated users

| `type`   | Max files | Destination                     |
| -------- | --------- | ------------------------------- |
| `avatar` | 1         | `avatars/{userId}/`             |
| `review` | 5         | `reviews/{userId}/{productId}/` |

Images only. Avatar flow: upload the replacement -> update `user.image` + `user.image_path` ->
**then** delete the old file, so a failed upload can't leave the DB pointing at a deleted file.
Review uploads re-check the same purchase eligibility as review creation, so storage can't be
filled with images for products the user never bought.

### `POST /api/media/admin/upload` - admin only

| `type`                | Max files | Destination                                 | Writes to DB?                             |
| --------------------- | --------- | ------------------------------------------- | ----------------------------------------- |
| `product-gallery`     | 10        | `products/{productId}/`                     | no                                        |
| `product-hero`        | 1         | `products/{productId}/hero-image/`          | yes - upserts the hero `productMedia` row |
| `product-fabric`      | 4         | `products/{productId}/fabric/`              | no                                        |
| `category`            | 1         | `categories/{categoryId}/category-image/`   | yes - updates the category row            |
| `category-size-chart` | 1         | `categories/{categoryId}/size-chart-image/` | yes - updates the category row            |

Category uploads are addressed by `categorySlug`, product uploads by `productId`. The product is
verified to exist **before** anything touches storage, so a bad id can't orphan files.

`keepCount` (gallery and fabric only) lets the caller declare how many existing items it intends
to keep, so a replace flow isn't blocked by the current DB count. Omitted -> the conservative
"nothing will be removed" assumption.

Gallery and fabric uploads return `{ url, path, type }[]` and write nothing - the caller then
sends `PATCH /api/products/[id]` with `media` / `fabricMedia` arrays.

### Two different write shapes - don't mix them up

- **Create** (`POST /api/products`, `POST /api/categories`) takes **multipart FormData** and uploads files inline in the same request. On DB failure the just-uploaded files are deleted.
- **Update** (`PATCH /api/products/[id]`, `PATCH /api/categories/[slug]`) takes **JSON** containing already-uploaded `url`/`path` pairs from the media routes.

`PATCH /api/products/[id]` diffs incoming `media`/`fabricMedia` against existing rows by `path`
-> insert new, update `sortOrder` on kept, delete missing. Storage cleanup happens **after** the
transaction commits and skips any file whose URL is still referenced by an `orderItems`
snapshot.

`DELETE /api/products/[id]` refuses outright if any `orderItems` reference the product ("set
isActive to false instead"). It deletes the DB row first, then the files.

### `media-handle.ts`

- `detectMediaType(file)` -> `{ isImage, isVideo, mime }` from the browser-supplied MIME type.
- `uploadSingleFile(file, folder)` -> one `UploadedFile`, no `images/`/`videos/` subfolder.
- `uploadFiles(files, folder)` -> `UploadedFile[]`, adds the subfolder, `mkdir -p` per unique dir.
- `deleteFile(path)` throws on failure; `deleteFiles(paths[])` swallows and logs.
- Every helper opens its own SFTP connection and closes it in a `finally`.
- `ssh2` / `ssh2-sftp-client` are in `serverExternalPackages` in `next.config.ts` - they must not be bundled.

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
ranked id query first, then re-fetches with relations and re-sorts in JS to preserve rank order -
Drizzle's relational `findMany` can't express the ranking directly.

---

## Home Page Data (`src/lib/queries/home.ts`)

`getHomeData()` runs three queries in `Promise.all`, then a fourth that depends on the
category result. Returns `{ heroProducts, newArrivals, categories, atelierEdit }`; the
`HomeData` type is exported and the home components take slices of it
(`HomeData["heroProducts"]`, `HomeData["categories"][number]`).

| Slice          | Source                                                   | Cap                         | Note                                                                                                                                                                      |
| -------------- | -------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heroProducts` | `isActive && isHeroProduct`, ordered by `updatedAt desc` | `MAX_HERO_PRODUCTS`         | Joins **only** `isHero=true` media, then **filters out products with none** in JS - an `isHeroProduct` flag without a hero image is silently skipped, not rendered broken |
| `newArrivals`  | `isActive && isNewArrival`, `createdAt desc`             | `MAX_NEW_ARRIVALS`          | standard 3-image gallery shape                                                                                                                                            |
| `categories`   | `isActive`, `title asc`                                  | `MAX_CATEGORIES`            | `id, title, slug, description, categoryImageUrl` only                                                                                                                     |
| `atelierEdit`  | one product per category, round-robin                    | `MAX_ATELIER_EDIT_PRODUCTS` | see below                                                                                                                                                                 |

**Atelier edit** is raw SQL via ``db.execute<Row>(sql`...`)`` - the only place in the codebase
that bypasses the query builder. A window function ranks each category's newest active products
(`row_number() over (partition by category_id order by created_at desc, id desc)`), then JS
walks the categories in order picking the first product not already chosen, so a product in
two categories can't appear twice. The final `findMany` is re-sorted to the chosen order, same
pattern as the search ranking.

The page renders sections conditionally - an empty slice drops its section and the
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
between routes) return a `ServiceResponse<T>` discriminated union - `{ kind: "ok" | "forbidden" | ... }` -
and the route converts it with `handleResponse(result)`. The switch is exhaustiveness-checked
with a `never` assignment, so adding a `kind` breaks the build until it's handled.

Common pattern in routes:

```typescript
const ownership = await assertOwnsCartItem(itemId, currentUser, sessionId);
const ownershipResponse = handleResponse(ownership);
if (ownershipResponse.status !== 200) return ownershipResponse;
```

---

## API response types (`src/types`)

One shared type system covers every route body and every client that reads one. It exists
because `res.json()` is `any`: a client annotation like `const data: OrderResponse = await
res.json()` is never checked, and the admin orders page shipped with a shape that had never
matched `paginated()`. The types close that hole from both ends.

```
src/types/api.ts        Pagination, ApiSuccess<T>, ApiPaginated<T>, ApiError   <- server-side bodies, raw Date
                        Jsonified<T>                                             <- recursive Date -> string
                        ApiResult<T>, ApiPaginatedResult<T>                      <- client-side unions
src/types/models.ts     Address, Cart, CartItem, Category, Order, OrderItem, Payment, Product,
                        ProductCategory, ProductMedia, Review, User, WishlistItem ($inferSelect each)
                        OrderStatus, PaymentStatus (from enumValues)
src/types/api/*.ts      per-route payloads, e.g. OrdersListItem, OrderDetail, OrderStatusData,
                        ProductListItem, ProductDetailWithRating, ProductReview, CartSummary,
                        CartMergeData, PublicUser, WishlistEntry, UploadedMedia, PaymentOrderData,
                        PaymentConfirmData, AdminStats, <Resource>FieldErrors
```

Rules, all enforced by `tsc`:

1. **Every `ok` / `created` / `paginated` call passes an explicit `<T>`** from `src/types/api/*`.
   `ok<ProductDetail>("...", row)` makes the compiler check that the Drizzle result is
   assignable to the declared payload; a bare `ok("...", row)` infers whatever came back and
   checks nothing.
2. **No bare model type in a `"use client"` file.** Over the wire every `Date` is a string, so
   client code uses `Jsonified<Model>` and reads fetches as
   `const result: ApiResult<X> = await res.json()` (or `ApiPaginatedResult<X>`), then narrows on
   `result.success`. There are no untyped `res.json()` calls left in `src`; don't add one.
3. **`<T>` checks assignability, not exactness.** Extra fields from a `with:` relation leak into
   the body silently. Strip them at the query (`columns: { field: false }`) or with a
   rest-destructure (`PublicUser` is the model for this).
4. **`ApiError.errors` is `unknown`.** Narrow on `!payload.success` first, then cast once at the
   form boundary to the matching `<Resource>FieldErrors` type - never deeper in the tree.
5. **Never wrap a `NextResponse` or a `ServiceResponse` in `ok()`.** A transaction that can
   return `getOrCreateCart`'s `Response` needs an `instanceof Response` guard on its result
   (cart `POST`), and one that can return an ownership `{ kind, ... }` needs a `"kind" in result`
   check routed through `handleResponse` (cart `[itemId]` `PATCH`) - both before the value is
   passed as `data`. Previously the PATCH swallowed a 403 into a 200 body.

Adding a route: define its payload in the matching `src/types/api/<resource>.ts`, use it as the
`<T>` in the route, and import it (wrapped in `Jsonified` / `ApiResult`) on the client. Display
helpers accept the wire shape too - `formatDate` takes `Date | string | number` for this reason.

---

## Drizzle Patterns

```typescript
// Conditional update spread
await db.update(table).set({
  ...(name && { name: name.trim(), slug }),
  ...(isActive !== undefined && { isActive }),
})

// Transaction - use tx, not db, inside
await db.transaction(async (tx) => {
  const [row] = await tx.insert(...).returning()
  await tx.delete(...).where(...)
})

// Row locking before a state transition
const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");

// Discriminated union from helpers - never throw Response objects
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
`sql`, `SQL` - all from `drizzle-orm`.

---

## Zod v4 Patterns

```typescript
import z4 from "zod/v4";

z4.uuid(); // UUID
z4.email({ error: "..." }); // email
z4.enum(PRODUCT_SIZES); // enum from a const array
z4.coerce.number().int(); // FormData strings -> number

await schema
  .safeParseAsync(body) // always the async form

  // Paired fields must arrive together
  .refine(({ image, imagePath }) => !!image === !!imagePath, {
    message: "...",
    path: ["image"],
  })

  // PATCH schemas - require at least one field
  .refine(
    (data) =>
      Object.keys(data).some((k) => data[k as keyof typeof data] !== undefined),
    { message: "At least one field must be provided" },
  );
```

FormData needs manual coercion before parsing - booleans arrive as the strings `"true"`/`"false"`,
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
NEXT_PUBLIC_MEDIA_BASE_URL       # public prefix - NEXT_PUBLIC_ because <Image> renders client-side
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
above with empty values - keep it in sync when adding a variable.

The Razorpay `key_id` is **not** exposed as a `NEXT_PUBLIC_` variable - the payment page reads it
from the `keyId` field that `POST /api/payments/create-order` returns. `BETTER_AUTH_SECRET`,
`MEDIA_UPLOAD_DIR` and `MEDIA_MAX_UPLOAD_MB` are declared but not referenced anywhere in `src`
(the first is read by Better Auth internally; the other two are unused).

`auth-client.ts` must use `NEXT_PUBLIC_BETTER_AUTH_URL` - it runs in the browser, where the
non-public `BETTER_AUTH_URL` is `undefined`.

SFTP auth is **private key + passphrase**, not password. `next.config.ts` allowlists
`nextmedia.shreeforstree.in` under `images.remotePatterns` - a new media host needs an entry
there or every `<Image>` breaks.

---

## Next.js 16 Gotchas

- Middleware is now **Proxy**: the file is `src/proxy.ts` with a default-exported `proxy()` function. It sets an `x-device-type: mobile | desktop` header from the user agent; layouts read it via `await headers()` to pick desktop vs mobile shells. Its matcher excludes `api/`.
- `params` is a Promise - `const { id } = await params` before destructuring:
  ```typescript
  { params }: { params: Promise<{ id: string }> }
  ```
- `cookies()` and `headers()` are async - always `await`.
- Import `NextRequest` from `"next/server"`.
- Vercel body limit is 4.5MB; Sharp compression covers images, not videos.
- `export const dynamic = "force-dynamic"` is set on `GET /api/categories` because the response varies by admin status.

---

## Frontend Conventions

- Route groups: `(shop)`, `(admin)`, `(auth)` - each with its own layout. `(admin)` redirects non-admins via `auth.api.getSession`. `(auth)` checks an `x-session` header that nothing sets, so its redirect is dead code (see Known Gaps).
- Server components hit `db` / `getProducts` directly; client components `fetch("/api/...")`. Don't add a fetch hop inside a server component for data the DB can give it.
- Device split is server-side via `x-device-type`, not CSS breakpoints, for header/nav shells. `dynamic()` imports keep the unused variant out of the bundle.
- Styling is Tailwind v4 utilities against the `@theme` tokens: `bg-paper`, `text-ink`, `text-ink-55`, `border-ink-25`, `text-rose-gold`, `font-display`, `font-body`, `font-label`, `font-serif-alt`. Ink opacity steps (`ink-05/08/15/25/40/55`) are predefined tokens - prefer them over `ink/10`-style arbitrary values.
- `.label-caps` is the tracked-out uppercase label style used across nav, buttons and eyebrows. `.stitch-divider` is the rose-gold running-stitch motif. `.btn-focus` / `.peer-focus-ring` carry the focus-visible rings - `.btn-focus` also applies `cursor-pointer`, so don't add it again.
- Base typography is set in `@layer base`: `h1`-`h4` get `--font-display` bold, and **`p` gets `--font-label` weight 400**. A paragraph is already League Spartan; adding `font-label` to a `<p>` is redundant.
- **Cart drawer** (`components/shop/Cart.tsx`) is the only cart UI. Desktop: `HeaderDesktop` opens it as a `40%`-wide right panel portaled to `document.body` (the sticky header's `backdrop-blur` would otherwise clamp a `fixed` child). Mobile: the bottom nav's Cart tab goes to `/cart`, a client page that mounts the same component with `isOpen` always true and `onClose -> router.back()`; the panel is `w-full`, the X button is `md:flex` only. The panel is `flex-col` with the list `min-h-0 flex-1 overflow-y-auto` and the footer `sticky bottom-0 pb-25 md:pb-4` - that mobile padding is what keeps Checkout above `NavMobile` (`z-80`, above the panel's `z-70`). Don't hide the nav while the cart is open; it's the only way off the page on mobile.
- Scrollbars are styled in `globals.css` for both engines (`::-webkit-scrollbar-*` and `scrollbar-color`), thumb `--color-ink` on `--color-paper`. Use full-opacity tokens here - an `ink-55` thumb composites to grey over paper, and Chrome ignores the legacy `:hover` rule once `scrollbar-color` is set.
- Loading states use `<Shimmer />` and the shaped skeletons in `components/ui/Shimmer.tsx` (`CardShimmer`, `CartItemShimmer`, `OrderItemsShimmer`, `PaymentSummaryShimmer`, ...) - match the real layout rather than inventing a new placeholder.
- Toasts: `sonner` via `<BrandToaster />`, mounted once in the root layout. Call `toast()` from anywhere.
- Icons: `lucide-react`. Brand/payment marks live in `components/ui/icon.tsx`.
- Client state: Zustand. `sidebar-store` persists only `isCollapsed` via `partialize`.
- Drag-and-drop uploads: `useFileDragState` + `useZoneFileDrop` + `utils/FileUpload` + `DragDropGlow`.
- Buttons come from `components/ui/Buttons.tsx`. `PrimaryButton` (rose-gold fill) and `SecondaryButton` (outline) take **either** `href` **or** `onClick`, never both - the props are a discriminated union with `never` on the unused half, so the wrong combination is a type error. `href` renders a `<Link>`, `onClick` renders a `<button>`. `PrimaryButton` also handles `loading` (spinner + `aria-busy` + disabled). `BackButton` calls `router.back()`; `CopyButton` writes to the clipboard.
- Order display formatting lives in `src/lib/orders.ts` - `orderReference` (last 8 chars of the UUID, uppercase, `#`-prefixed - never show the raw UUID), `formatAmount(amount, { fractionalDigits: 0 | 2 })` (en-IN / INR, two cached `Intl.NumberFormat` instances; default 2, product cards pass 0), `formatDate` (en-IN, `d MMM yyyy`; accepts `Date | string | number` so `Jsonified` rows pass straight through), `itemCount` (pluralized), `handleCopyToClipboard`. Use these rather than inlining new formatting.
- `OrderStatusBadge` (`components/ui/OrderStatusBadge.tsx`) is the one status pill: `kind: "order" | "payment"` with the matching `OrderStatus` / `PaymentStatus` union from `@/types/models`. It maps `not_placed` to a display label and carries the colour table - don't build ad-hoc status spans.
- **`Card` (`@/utils/Card`)** is the one product/category tile, with `variant: "customer-product" | "admin-product" | "admin-category"`. Pass `href` for navigation - it renders an absolutely-positioned overlay `<Link>` and the title becomes a link; pass `onClick` only when there's no destination. Customer cards with >1 image get a three-zone hover gallery on desktop and swipe on touch, with dots. Admin variants get the ... dropdown (edit / view / toggle / delete) that flips side and direction to stay on screen, and a delete dialog that requires typing the exact title. It normalizes `images[]`, `productMedia[]`, `image`, or `categoryImageUrl` into one list, excluding hero media; empty falls back to `/images/white.webp`. `ProductGrid` is a server component that just maps products to `Card`s.
- `ArrowLink` (`components/ui/ArrowLink.tsx`) is the "see more ->" link used across the home sections - `label-caps`, rose-gold underline, `textColor` prop for dark backgrounds.
- `components/ui/Icon.tsx` (capital I) exports `RazorpayIcon`, `GoogleIcon`, `Ring` (the hero slide indicator - animated `stroke-dashoffset`), and `ArrowLeft` as the **default** export. Import paths are case-sensitive on Vercel even though macOS forgives them.
- `CategoryTile` links to `/shop?categories={slug}` - the query param name is plural.
- CSS animation utilities: `.animate-ken-burns` (14s scale drift, hero backgrounds) and `.animate-slide-ring` (stroke-dashoffset, the `Ring` indicator). Both - like `.shimmer` - are switched off under `prefers-reduced-motion`.
- `HomeHero` auto-advances every `HERO_SLIDE_INTERVAL_MS`; hover/focus pauses and the remaining time is preserved in a ref, so resuming doesn't restart the countdown. Rotation is disabled entirely under reduced motion.
- Auth redirects: `AuthCard`'s `getSafeRedirect()` reads `?redirect=` and only honours root-relative, same-origin paths (rejects absolute, protocol-relative `//`, and backslash variants), and never sends the user back to `/sign-in` or `/sign-up`. Google sign-in goes through `authClient.signIn.social({ provider: "google", callbackURL, errorCallbackURL })`.
- Animation: `motion/react` (not `framer-motion`). Every animated component reads `useReducedMotion()` and collapses its transitions to `{ duration: 0 }` when set - match that.
- Pages reachable by guest token export `metadata = { robots: { index: false } }`.

---

## Business Rules

- **One review per user per product** - DB unique constraint, 409 on conflict.
- **Review eligibility** - an order containing the product must be `delivered` or `returned`. Enforced on both review creation and review-image upload.
- **Shipping** - flat INR 60, free above INR 999.99, computed on `itemsTotal` (after discounts).
- **No GST** - not registered, no tax columns.
- **Max cart quantity** - 10 per unique `(cartId, productId, size)`, clamped in SQL.
- **Guest checkout** - supported; ownership via httpOnly `guest_order_{orderId}` cookie or explicit token, 30-day TTL.
- **Address deletion** - allowed; shipping is already snapshotted on the order. Deleting the default address promotes the most recent remaining one.
- **User deletion** - soft delete: anonymize PII (`name`, `email`, `phone`, `image`), set `deletedAt`, drop sessions and accounts; orders and payments are retained.
- **Category deletion** - blocked while any product is linked via `productCategories`.
- **Product deletion** - blocked entirely if any `orderItems` reference it; deactivate instead.
- **Shipping country** - `createOrderSchema` defaults `shippingCountry` to `"India"`, matching the `addresses.country` column default.
- **Sizes** - from the `PRODUCT_SIZES` const; **colors** - free-form text array.
- **Cart merge** - runs automatically on the first `(shop)` page after login via `<CartMerge />`; not from `AuthCard`, and not from the auth routes.

---

## Code Quality Rules

- Production-grade only - no shortcuts.
- Never throw `Response` objects across module boundaries - use the `ServiceResponse` union + `handleResponse`. (`getOrCreateCart` is the one legacy exception; it returns a `Response`, and callers check `instanceof Response`.)
- **Storage failures must never block DB operations.** Order of operations: DB write first, storage cleanup after, wrapped in try/catch. For replacements: upload new -> update DB -> delete old.
- **Client-supplied storage paths are attacker-controlled.** Anything that will later reach `deleteFile`/`deleteFiles` must pass `isOwnedMediaPath(path, scopePrefix)` first - see the review and user-avatar routes.
- API bodies are typed end to end - see "API response types". Explicit `<T>` on every `ok`/`created`/`paginated`, `ApiResult<T>` on every `res.json()`, `Jsonified<>` in client files.
- `await Promise.all(array.map(...))` - never `await array.map(...)`.
- `price` / `discountedPrice` / all `numeric` columns are **strings** from the DB - `Number()` to compute, `.toString()` / `.toFixed(2)` to write back.
- `avg()` and `sum()` return strings - `parseFloat(raw).toFixed(1)` before returning.
- `timingSafeEqual` throws on length mismatch - check lengths first, every time.
- `$onUpdate` on the schema handles `updatedAt`; don't set it manually.
- Money comparisons against Razorpay are in **paise**: `Math.round(Number(totalAmount) * 100)`.
- Pagination is uniform: `page`/`limit` query params, `Math.max(1, parseInt(...) || default)`, plus a separate `count()` query.

---

## Known Gaps / TODOs

Derived from TODOs and unfinished wiring in the code - not a roadmap.

1. **Order confirmation email** - `src/app/api/payments/webhook/route.ts:250`. The confirming and confirmation pages both promise the customer an email ("we'll email you once the payment is confirmed"), and nothing sends one. Resend is listed in the stack but is not installed or configured.
2. **`(auth)` layout redirect never fires** - `src/app/(auth)/layout.tsx:10` reads an `x-session` header that nothing in the app sets (`proxy.ts` only sets `x-device-type`). A signed-in user can still open `/sign-in` and `/sign-up`. Contrast `(admin)/layout.tsx`, which now checks the real session.
3. **`product_search_vector` is not in migrations** - product search depends on a DB function that no migration creates. A DB rebuilt from migrations alone will 500 on any `?search=` query.
4. **Video optimization** - `src/lib/optimize.ts:8`. `optimizeVideo()` is a passthrough (`Buffer.from(await file.arrayBuffer())`); the hook exists but does nothing. Videos bypass compression and count against the 4.5MB Vercel body limit.
5. **No Razorpay refund webhook** - `POST /api/payments/webhook` handles only
   `payment.captured` and `payment.failed`. A refund issued in the Razorpay dashboard does not
   reach the app; an admin has to record it with `POST /api/payments/refund`, and a refund
   nobody records leaves the order showing `paymentStatus: "success"`. Handling
   `refund.processed` would close the loop.
6. **Admin sidebar role is hardcoded** - `src/components/admin/AdminSidebar.tsx:250` should read the role from the session.
