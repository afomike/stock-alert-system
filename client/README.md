# Stockwatch — Inventory Manifest (React Frontend)

React + Vite + Tailwind frontend for the Automated Stock Alert System.
Consumes the Node.js/Express API (`server/`).

## Design

Built around a "shipping manifest / warehouse signage" visual identity
rather than a generic SaaS dashboard look:

- **Ink** sidebar (`#14181F`) + **paper** content area (`#F5F4F1`)
- Oswald (condensed display headers), Inter (body), IBM Plex Mono (SKUs, quantities, data)
- **Status rail**: a 4px colored left border on every table row/card signaling
  stock health at a glance (green = in stock, amber = low, brick = critical,
  ink = out of stock)
- **Stamp**: the signature element — a rotated, dashed-border tag (like an
  inspection stamp) used for status and risk labels everywhere

## Setup

```bash
cd client
npm install
cp .env.example .env    # set VITE_API_URL if your API isn't on localhost:5000
npm run dev
```

Runs on `http://localhost:3000`. Requires the Node backend (`server/`) running
on `http://localhost:5000` — log in with the seeded demo account
(`admin@stockalert.com` / `admin123`) if you ran `npm run seed` there.

## Pages

- **Login** — JWT auth against `/api/auth/login`
- **Dashboard** — metric tiles, a stock-movement trend chart, and a
  "products requiring attention" table
- **Inventory** — full product list with search/status filters, table/grid
  toggle, a "+ New Product" create form, and a per-product modal with tabs
  to either record a stock movement (restock, sale, damaged, etc.) or edit/
  delete the product
- **Suppliers** — supplier cards (contact info, lead time, linked product
  count) with a create form
- **Reports** — shortage predictions with a Quick (Node heuristic) /
  Detailed (Python AI service, via proxy) toggle, plus auto-generated
  reorder reports
- **Alerts** — notification feed (low stock, critical, out of stock) with
  mark-as-read

## Components

| Component | Purpose |
|---|---|
| `StockTable` | Manifest-style product table with status rail rows |
| `StockAlert` | Single alert/notification ticket |
| `ProductCard` | Grid-view product card with a fill-level bar |
| `SalesChart` | Recharts area chart for stock movement trends |
| `StatusStamp` | The signature rotated stamp tag for status/risk labels |
| `MetricCard` | Dashboard metric tile |
| `Layout` / `Sidebar` / `Topbar` | App chrome and navigation |

## Notes

- Auth token is stored in `localStorage`; a 401 response anywhere redirects
  to `/login` automatically (see `src/services/api.js`).
- The dashboard's trend chart is built client-side from real movement
  history (`GET /api/inventory/movements/:id`) for a sample of low-stock
  products — there's no dedicated trend endpoint on the backend yet, so this
  is a reasonable place to add one if the aggregation should move server-side.
- The Reports page's "Detailed forecast" tab calls
  `GET /api/inventory/ai-predictions`, which the Node backend proxies to the
  Python AI service. If that service is down, the tab shows an inline error
  and the Quick estimate stays available.
- Verified end-to-end: backend + AI service + client all started together
  in a live environment, with real requests exercising login, product
  CRUD, supplier creation, stock movements, both prediction modes, and
  notifications. See the root `README.md` for the full verification log.

## Next steps

- Move the dashboard trend chart's aggregation server-side (dedicated
  `/api/inventory/trend` endpoint) instead of computing it client-side from
  per-product movement history
- Add pagination for large product/supplier lists
- Add a supplier edit/delete form (currently create-only)
