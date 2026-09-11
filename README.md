# shreeforstree

A full-stack storefront for a made-to-order women's clothing label — every piece is cut and
finished after the order is placed, which shapes most of the decisions below.

Built with Next.js 16, PostgreSQL, and Razorpay. Media is self-hosted on Hostinger rather than a
CDN service. Payments are settled by webhook, not by the browser callback.

## Stack

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript              |
| Styling    | Tailwind CSS v4 — `@theme` tokens, no config file          |
| Database   | Neon (PostgreSQL) + Drizzle ORM                            |
| Auth       | Better Auth — email/password, Google OAuth, DB rate limits |
| Payments   | Razorpay Checkout + server SDK + webhooks                  |
| Media      | Hostinger over SFTP, compressed to WebP with Sharp         |
| Validation | Zod v4                                                     |
| Client     | Zustand, Motion, Sonner, Recharts, lucide-react            |
| Hosting    | Vercel (app), Hostinger (media)                            |

---

## Things worth looking at

### Payments are settled by the webhook, never the browser

The obvious way to confirm a payment is to trust what Razorpay hands back to the client and
write `paid` to the database. That breaks the moment a user closes the tab mid-redirect, or
someone replays the callback.

So the client callback (`POST /api/payments/confirm`) verifies the signature, logs the outcome,
and **writes nothing**. The Razorpay webhook is the only thing that moves an order to `placed`.
It runs inside a transaction with `SELECT ... FOR UPDATE` on both the payment and order rows and
refuses to act twice — it bails on already-settled payments, on amount or currency mismatch, and
on a duplicate transaction id. A capture arriving for an order that is already paid flags
`refundRequired` instead of double-crediting.

Meanwhile the customer sits on a polling page that asks `GET /api/orders/[id]/status` every 2
seconds for the first 20, then every 6, and gives up at 60 with an honest "still confirming"
message rather than a spinner that never resolves.

### Guest checkout without accounts

Orders can be placed without signing up. Each guest order gets a random token stored on the row
and set as an httpOnly cookie; ownership checks compare it with `crypto.timingSafeEqual` after a
length check. A failed check returns `400 Invalid order ID` rather than `403`, so someone
guessing UUIDs can't tell a real order from one that isn't theirs.

Shipping details are **snapshotted onto the order row** rather than joined from the address
table. Customers can delete addresses, or their whole account, without corrupting order history
— the foreign keys go null and the order still reads correctly.

### Self-hosted media instead of a CDN service

Product images upload over SFTP to a Hostinger box, resized and converted to WebP by Sharp on
the way through. It costs a fraction of a managed service at this volume, and the trade-off is
that the app owns the failure modes — so storage errors are structurally prevented from
corrupting the database:

- The DB write commits first; storage cleanup happens after and never blocks it.
- Replacements upload the new file, point the DB at it, and only then delete the old one.
- Deleting product media checks whether any order-item snapshot still references the URL, and
  skips those files — a customer's order history keeps its images even after the product changes.
- Any client-supplied path that could reach a delete call is scoped to the caller's own folder
  first, so nobody can hand the server someone else's path and have it deleted for them.

### Search that ranks by how much actually matched

Product search builds a Postgres `tsquery` of prefix terms and ranks results first by how many
distinct terms hit, then by `ts_rank`, then by recency. Drizzle's relational queries can't
express that ordering, so the query runs in two passes — ranked ids, then a hydrating fetch that
is re-sorted in memory to preserve rank.

### Device split on the server

A Next.js proxy (Next 16's rename of middleware) reads the user agent and sets an
`x-device-type` header. Layouts read it and render either the desktop or mobile shell — the
unused one is never sent to the browser. Media queries handle everything below that.

---

## Structure

```
src/
├── app/
│   ├── (shop)/      storefront — catalogue, PDP, cart, checkout, orders, account
│   ├── (admin)/     dashboard — products, categories, orders, users, stats
│   ├── (auth)/      sign in / sign up
│   └── api/         route handlers
├── components/      admin/, shop/, ui/
├── lib/
│   ├── db/          Drizzle schema, client, migrations
│   ├── media/       SFTP upload/delete + path scoping
│   ├── queries/     composed read queries
│   └── validators/  Zod schemas
└── proxy.ts         device detection
```

API responses go through typed helpers so every route returns the same envelope. Anything that
needs to return a result from inside a transaction returns a discriminated union that a single
handler converts to a response — route handlers never throw `Response` objects around.

---

## Running it

Requires **pnpm** (npm and yarn are blocked by a `preinstall` guard), a PostgreSQL database, and
a `.env` file.

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

| Script             | Does                 |
| ------------------ | -------------------- |
| `pnpm dev`         | dev server           |
| `pnpm build`       | production build     |
| `pnpm lint`        | eslint               |
| `pnpm db:generate` | generate a migration |
| `pnpm db:migrate`  | apply migrations     |
| `pnpm db:studio`   | Drizzle Studio       |

Environment variables cover the database, Better Auth (secret, base URLs, Google OAuth), the
SFTP media host, and Razorpay (key pair plus webhook secret). Media uploads need working SFTP
credentials - without them the app runs, but creating products and categories will fail. Reference [.env.example](./.env.example) for all the env vars.

---

## Status

In active development. The storefront, cart, checkout, payment and
order flows are working end to end; the admin dashboard manages products, categories and media.

Not done yet: order confirmation emails, video compression on upload (videos currently upload
untouched), and the home page, which is still a placeholder.

---

No license file — all rights reserved. Built for a family clothing business, not for reuse.
