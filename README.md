# Automated Stock Alert System — Full Stack

Three services, wired together and verified working end-to-end:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  client (:3000)  │ ───► │  server (:5000)   │ ◄──► │  PostgreSQL (:5432)  │
│  React + Vite    │      │  Node/Express API │      └─────────────────────┘
└─────────────────┘      └──────────────────┘                 ▲
                                                                 │
                          ┌──────────────────┐                  │
                          │ ai-service (:8000)│ ─────────────────┘
                          │ Python/FastAPI     │  (reads same DB, read-only)
                          └──────────────────┘
```

The Node API owns the database schema (via Sequelize) and handles all
writes. The Python AI service is a read-only consumer of the same
`products` / `suppliers` / `stock_movements` tables, layering real
time-series forecasting on top. The React client talks to the Node API for
everything (auth, CRUD, dashboard, notifications); it can optionally call
the AI service directly for richer predictions (see "Wiring the pieces
together" below).

## What's wired together now

Beyond the three services running side by side, these connections are built and verified:

- **Client → Node → Python AI service (proxied)**: the Node backend exposes
  `GET /api/inventory/ai-predictions` and `GET /api/inventory/ai-reorder`,
  which forward to the Python service on :8000 using Node's built-in
  `fetch` (no extra dependency). The Reports page has a **Quick estimate /
  Detailed forecast** toggle — Quick is the Node heuristic (always
  available, no extra hop), Detailed calls through to the Python
  regression model. If the AI service is down, the client shows a clear
  inline message and the Quick tab still works.
- **Suppliers page**: list view (contact info, lead time, linked product
  count) + a create form, wired to `/api/suppliers`.
- **Product create/edit/delete**: the Inventory page's product modal now
  has "Record Movement" and "Edit Product" tabs, plus a "+ New Product"
  button with a full create form — wired to `POST/PUT/DELETE /api/products`.

All of the above was exercised with real requests against the live stack
(not just written and assumed correct) — see "Verified working" below.

## Alert delivery and user administration

StockWatch now delivers low-stock, critical-stock, and out-of-stock alerts
in three ways: the existing in-app alert feed, SMTP email, and NigeriaBulkSMS
SMS. Delivery is sent to each active system user who has the matching contact
detail configured. Provider failures are logged without interrupting stock
movements or the in-app alert.

- Users update their own name, email, password, and Nigerian phone number in
  **My Profile**.
- Administrators use **Manage users** to add staff, managers, and other
  administrators; update their contacts/roles; reset passwords; or disable
  accounts. User creation is admin-only.
- Enable delivery in `server/.env` only after adding valid SMTP and
  NigeriaBulkSMS credentials. See `server/.env.example` and `server/README.md`.
- Nigerian mobile numbers may be saved as `080...` or `+234...`; the server
  converts valid local numbers to the international format expected by the
  SMS provider.

## Quick start (all three services)

```bash
# 1. Database
createdb stock_alert_db   # requires PostgreSQL running locally

# 2. Backend
cd server
npm install
cp .env.example .env      # edit DB credentials + JWT_SECRET if needed
npm run migrate
npm run seed               # optional demo data — admin@stockalert.com / admin123
npm run dev                # http://localhost:5000

# 3. AI service (separate terminal)
cd ai-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # point DATABASE_URL at the same DB as step 1
uvicorn app.main:app --reload --port 8000   # http://localhost:8000

# 4. Frontend (separate terminal)
cd client
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:3000
```

Then open `http://localhost:3000` and log in with the seeded demo account.

## Verified working (this session)

Every piece below was actually started and exercised with real requests
against a live PostgreSQL database in this environment — not just written
and assumed correct:

- ✅ PostgreSQL 16 installed, `stock_alert_db` created
- ✅ `npm run migrate` — all 5 tables created (users, suppliers, products,
  stock_movements, notifications) with enums and foreign keys
- ✅ `npm run seed` — demo admin, supplier, 2 products, 14 days of sale history
- ✅ Node API started on :5000, `/health` responds
- ✅ Login (`POST /api/auth/login`) returns a valid JWT
- ✅ `GET /api/inventory/dashboard` returns real aggregate metrics
- ✅ `GET /api/inventory/low-stock`, `/predictions`, `/reorder-reports` all
  return correct data derived from seeded stock
- ✅ `POST /api/inventory/movements` correctly updates `current_stock` and
  automatically files a notification when a product crosses into
  LOW_STOCK/CRITICAL/OUT_OF_STOCK
- ✅ `GET /api/notifications` returns that notification
- ✅ Python AI service started on :8000 against the **same** database,
  `/predict/shortage` and `/reorder` return real forecasts computed from
  the Node-seeded movement history
- ✅ React dev server started on :3000, serves the app correctly
- ✅ CORS verified with real preflight + cross-origin requests between
  client (:3000) → API (:5000) and client (:3000) → AI service (:8000)

## Two real bugs this end-to-end test caught

Running all three services together against a live database — rather than
just reading the code — surfaced two issues neither service's own tests
would have caught in isolation:

**1. Seed data timestamps were silently ignored.** `server/src/utils/seed.js`
passed `created_at: someDate` to Sequelize's `StockMovement.create()`, but
the model's actual attribute is `createdAt` (camelCase — Sequelize maps it
to the `created_at` column via `underscored: true`). An unrecognized field
is just dropped, so every "backdated" movement was actually timestamped
`now`. All 14 days of intended sale history collapsed onto a single day.
**Fixed** by using `createdAt` in the seed script.

**2. That bad data exposed a real weakness in the forecasting model.** With
14 days of sales all stamped on one day, `ai-service/app/forecasting.py`'s
linear regression saw "0 for 46 days, then a huge spike" and extrapolated
the spike as an ongoing trend — forecasting ~70 units/day for a product
whose real average was ~35/day. Even after fixing the seed bug, the
underlying model weakness was worth closing: a genuine cold-start product
(no sales before it started selling) would trigger the same overshoot.
**Fixed** by trimming leading zero-runs before fitting the regression, so
the model only sees the window where the product was actually active.

Before the fixes: Wireless Mouse forecasted at 12.4 units/day (LOW
confidence). After: 3.95 units/day (MEDIUM confidence) — much closer to
its actual 6/day, with the small dip explained by today (a day with no
recorded sales yet) pulling the short trend down slightly.

The Node backend's own heuristic (`/api/inventory/predictions`, a simple
trailing-30-day average) never had this problem, since it doesn't fit a
trend line — it's a reasonable sanity check to keep alongside the Python
service's output.

## Everything from the original spec is now built

As of this session, all three previously-open items are done and verified:

**1. Pagination (products + suppliers).** `GET /api/products` and
`GET /api/suppliers` now accept `page`, `limit`, and `search` query params
(products also accept `status` and `category`). Suppliers paginate at the
database level (`findAndCountAll`); products paginate in application code
after filtering, since `status` (IN_STOCK/LOW_STOCK/etc.) is computed from
stock levels rather than stored as a column — documented as a tradeoff in
`productController.js` for if the catalog grows large enough to matter.
Verified: seeded 12 extra products and 5 extra suppliers, confirmed
`totalCount`/`totalPages` and page-2 results were correct, confirmed search
(`?search=wireless` → 1 result) and status filtering (`?status=LOW_STOCK` →
4 results) both work.

**2. Supplier edit/delete.** The backend routes already existed; what was
missing was the frontend UI (now on the Suppliers page — Edit/Delete
buttons per card) and, more importantly, a **real bug this surfaced**: the
`Supplier`→`Product` association had no `onDelete` behavior, so deleting a
supplier with linked products would have thrown a foreign-key error instead
of a clean response. Fixed by setting `onDelete: 'SET NULL'` on the
association (`models/index.js`) and re-running the migration. Verified by
actually deleting a supplier with two linked products — got `204`, and
confirmed both products survived with `supplier_id` set to `null` rather
than being deleted or the request failing.

**3. Dashboard trend server-side.** Added `GET /api/inventory/trend?days=N`,
which aggregates `stock_movements` by day directly in SQL (`GROUP BY
DATE(created_at)`) and gap-fills days with no activity to 0, rather than
the client fetching per-product movement history and aggregating in the
browser. The Dashboard page now calls this one endpoint. Verified: 14 days
requested, 14 days returned, correctly summed (41 units/day = 6 + 35 from
the two seeded products) with today correctly showing 0 (no movement
recorded yet).

## Wiring the pieces together

**Done.** The client now calls the Python AI service through the Node
backend rather than talking to it directly:

- `GET /api/inventory/ai-predictions` — Node proxies to the AI service's
  `/predict/shortage` and returns its response as-is
- `GET /api/inventory/ai-reorder` — proxies to `/reorder`

This keeps CORS configuration in one place (the client only ever talks to
`:5000`) and means the AI service can be swapped, scaled, or taken down
independently without the frontend needing to know its address. If the AI
service is unreachable, the proxy returns a clear 503 rather than hanging
or crashing — the Reports page catches this and falls back to the Node
heuristic automatically.

On the **Reports** page, predictions have a **Quick estimate / Detailed
forecast** toggle:
- *Quick* — the Node backend's trailing-30-day average (`/predictions`),
  always available, no dependency on the AI service being up.
- *Detailed* — the Python service's regression-based forecast
  (`/ai-predictions`), fetched lazily only when that tab is opened, with
  its own confidence rating per product.

## Suppliers and product management

- **Suppliers page** (`/suppliers`) — lists suppliers as cards (contact
  info, average lead time, count of linked products) with search,
  pagination, and create/edit/delete, all wired to `/api/suppliers`.
- **Inventory page** supports the full product lifecycle: a "+ New
  Product" button opens a create form; clicking a product opens a modal
  with tabs for recording a stock movement or editing/deleting the
  product; search, status filter, and pagination are all server-side.

## Ports

| Service | Port | .env var |
|---|---|---|
| PostgreSQL | 5432 | `DB_HOST`/`DB_PORT` (server), `DATABASE_URL` (ai-service) |
| Node API | 5000 | `PORT` (server) |
| Python AI service | 8000 | `PORT` (ai-service) |
| React client | 3000 | Vite default, set in `vite.config.js` |
