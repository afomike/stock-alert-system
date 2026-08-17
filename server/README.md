# Automated Stock Alert System — Backend API

Node.js / Express / PostgreSQL backend for the Stock Alert System. Covers
authentication, product & supplier management, stock movement tracking,
low-stock detection, reorder point / shortage prediction, and notifications.

This is Phase 1 of the full spec (backend + DB + auth). The React frontend
and the Python FastAPI ML service are separate, later pieces — this API is
built so both can plug into it.

## Stack

- Express.js (REST API)
- PostgreSQL + Sequelize ORM
- JWT auth + bcrypt password hashing
- node-cron for scheduled low-stock sweeps

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit DB credentials + JWT_SECRET
```

Make sure PostgreSQL is running and the database in `DB_NAME` exists:

```bash
createdb stock_alert_db
```

Sync the schema:

```bash
npm run migrate
```

(Optional) Load demo data — an admin user, a supplier, two products, and
14 days of sale history so the prediction endpoints have something to work with:

```bash
npm run seed
```

This creates:
- Admin login: `admin@stockalert.com` / `admin123`
- Products: Wireless Mouse (WM-001), Bottled Water (BW-050)

Run the API:

```bash
npm run dev     # nodemon, auto-restart
# or
npm start
```

Server runs on `http://localhost:5000` by default. Health check: `GET /health`.

## Auth

All routes except `/api/auth/register` and `/api/auth/login` require:

```
Authorization: Bearer <token>
```

Roles: `admin`, `manager`, `staff`. Some write routes are role-restricted
(see route files) — e.g. only `admin`/`manager` can create products, only
`admin` can delete them.

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a user, returns JWT |
| POST | `/api/auth/login` | Public | Returns JWT |
| POST | `/api/auth/logout` | Authenticated | Stateless no-op (client discards token) |
| GET | `/api/auth/me` | Authenticated | Current user profile |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Authenticated | List, filter by `?category=` `?status=IN_STOCK\|LOW_STOCK\|CRITICAL\|OUT_OF_STOCK` `?search=` (matches name or SKU), paginate with `?page=` `?limit=` (default 20, max 100) — response includes `totalCount`/`totalPages` |
| GET | `/api/products/:id` | Authenticated | Single product with computed status |
| POST | `/api/products` | admin, manager | Create product |
| PUT | `/api/products/:id` | admin, manager | Update product |
| DELETE | `/api/products/:id` | admin | Delete product |

### Inventory
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inventory/dashboard` | Aggregate metrics: total products, units, low/critical/out-of-stock counts, inventory value |
| GET | `/api/inventory/trend?days=N` | Daily stock-movement totals over the trailing N days (default 14, max 90), gap-filled so inactive days show 0 |
| GET | `/api/inventory/ai-predictions` | Proxies to the Python AI service's shortage predictions (see `ai-service/`); 503 if that service is unreachable |
| GET | `/api/inventory/ai-reorder?only_needed=true` | Proxies to the Python AI service's reorder recommendations |
| GET | `/api/inventory/low-stock` | Products at/below their minimum stock, with status |
| GET | `/api/inventory/predictions` | AI-lite shortage prediction per product (avg daily demand, est. days to stockout, risk level) |
| GET | `/api/inventory/reorder-reports` | Auto-generated reorder recommendations for at-risk products |
| POST | `/api/inventory/movements` | Record a stock movement (see below) |
| GET | `/api/inventory/movements/:id` | Movement history for a product |

`POST /api/inventory/movements` body:
```json
{
  "productId": "uuid",
  "type": "SALE",
  "quantityChange": -5,
  "note": "Customer purchase"
}
```
`type` is one of `STOCK_IN`, `STOCK_OUT`, `SALE`, `RETURN`, `DAMAGED`, `ADJUSTMENT`, `RESTOCK`.
Use a negative `quantityChange` for anything that removes stock.

Recording a movement automatically updates `current_stock` and fires an
in-app notification if the product crosses into `LOW_STOCK` / `CRITICAL` /
`OUT_OF_STOCK`.

### Suppliers
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/suppliers` | Authenticated | Paginate/search with `?page=` `?limit=` `?search=` (matches name) |
| POST | `/api/suppliers` | admin, manager | |
| PUT | `/api/suppliers/:id` | admin, manager | |
| DELETE | `/api/suppliers/:id` | admin | Products linked to this supplier are kept; their `supplier_id` is set to `null` (`onDelete: SET NULL`) rather than the request failing |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Latest 100 notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |

## How the prediction logic works

- **Average daily demand**: sum of `SALE`/`STOCK_OUT` movement quantities
  over the trailing 30 days, divided by 30.
- **Reorder point**: `(avgDailyDemand × supplierLeadTimeDays) + safetyStock`.
- **Estimated days until stockout**: `currentStock / avgDailyDemand`.
- **Risk level**: `HIGH` if days-until-stockout ≤ supplier lead time,
  `MEDIUM` if ≤ 1.5× lead time, else `LOW`.

This is a simple heuristic model, not the full ML forecasting service —
it's meant to work standalone and to be swapped out or complemented later
by the Python FastAPI service (time-series forecasting on the same
`stock_movements` table).

## Project structure

```
server/
├── src/
│   ├── config/db.js          # Sequelize connection
│   ├── models/                # User, Product, Supplier, StockMovement, Notification
│   ├── middleware/            # JWT auth, role guard, error handler
│   ├── controllers/           # Route handlers
│   ├── routes/                # Express routers
│   ├── services/stockService.js  # Core business logic (status, prediction, reorder, movements)
│   ├── utils/migrate.js       # Dev schema sync
│   ├── utils/seed.js          # Demo data
│   ├── app.js                 # Express app
│   └── server.js              # Entrypoint + cron scheduler
├── .env.example
└── package.json
```

## Next steps

1. **React frontend** — Dashboard, Inventory, Reports, Alerts pages consuming this API.
2. **Python FastAPI ML service** — proper time-series forecasting (e.g.
   moving average / regression on `stock_movements`), swap into
   `/api/inventory/predictions` or run alongside it.
3. **Real notification delivery** — wire the `Notification` records to an
   email/SMS provider (the model + trigger logic is already in place;
   only the delivery channel is stubbed).
4. **Sequelize migrations** — replace `sync({ alter: true })` with
   versioned migrations before production use.
