# Quickstart — Run This Locally

This gets all three services (PostgreSQL, Node API, Python AI service, React
client) running on your own machine. Written for macOS/Linux; Windows notes
are called out where commands differ.

## 0. Prerequisites

Check you have these installed:

```bash
node --version      # need 18+ (20+ recommended)
python3 --version   # need 3.10+
psql --version      # PostgreSQL 14+ (or use Postgres.app / Docker — see below)
```

Don't have PostgreSQL? Easiest options:
- **macOS**: `brew install postgresql@16 && brew services start postgresql@16`
- **Linux (Ubuntu/Debian)**: `sudo apt install postgresql postgresql-contrib && sudo service postgresql start`
- **Windows**: install from [postgresql.org/download](https://www.postgresql.org/download/windows/), or use Docker (below)
- **Docker (any OS)**: `docker run --name stock-alert-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`

## 1. Unzip and set the database password

If you installed PostgreSQL yourself (not Docker), the `postgres` role
usually has no password set yet on a fresh install, so connecting with
`-h` (which forces password auth) will just hang waiting for input.
Set the password first using the local peer connection instead:

```bash
# Linux (Ubuntu/Debian) — run as a user with sudo access
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# macOS with Homebrew — Homebrew's postgres superuser is usually your
# Mac username, not "postgres". Check with: psql postgres -c "\du"
# Then either set a password on your own role, or create a postgres role:
psql postgres -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
```

If you used the Docker command above, this is already set — skip this.

Create the database:

```bash
# Linux
sudo -u postgres createdb stock_alert_db

# macOS
createdb -U postgres stock_alert_db
```

Verify you can connect the way the app will:

```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d stock_alert_db -c "\dt"
# (empty table list is fine — tables get created in step 2)
```

(`PGPASSWORD` avoids an interactive password prompt for this one check —
without it, `psql` just asks you to type the password, which is normal.)

## 2. Backend (Node API) — Terminal 1

```bash
cd stock-alert-system/server
npm install
cp .env.example .env
```

Open `.env` and check the DB settings match what you set up in step 1
(defaults already assume `postgres`/`postgres`/`localhost:5432`). Then:

```bash
npm run migrate     # creates all tables
npm run seed         # optional — demo admin user + 2 products + sale history
npm run dev           # starts on http://localhost:5000
```

Leave this terminal running. Confirm it worked:

```bash
curl http://localhost:5000/health
# {"status":"ok","timestamp":"..."}
```

## 3. AI forecasting service (Python) — Terminal 2

```bash
cd stock-alert-system/ai-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

The default `.env` already points at the same database from step 1 — no
changes needed unless you customized the DB name/password.

```bash
uvicorn app.main:app --reload --port 8000
```

Leave this terminal running. Confirm it worked:

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"ai-service"}
```

## 4. Frontend (React) — Terminal 3

```bash
cd stock-alert-system/client
npm install
cp .env.example .env
npm run dev
```

This prints a local URL, normally `http://localhost:3000`. Open it in your
browser.

## 5. Log in

If you ran `npm run seed` in step 2:

```
Email:    admin@stockalert.com
Password: admin123
```

If you skipped seeding, register a new account from a `POST` to
`/api/auth/register` (there's no signup page in the UI — it's admin-only by
design) or add the seed step before continuing:

```bash
cd stock-alert-system/server
npm run seed
```

## Troubleshooting

**"Could not load ... Is the API running?" in the browser**
→ Terminal 1 (Node API) isn't running or crashed. Check its terminal for
errors, and confirm `curl http://localhost:5000/health` responds.

**AI forecasting tab in Reports shows an error**
→ Terminal 2 (Python AI service) isn't running. The rest of the app still
works — the "Quick estimate" tab uses the Node backend only and doesn't
need this service.

**`ECONNREFUSED` or `password authentication failed` from the Node API**
→ PostgreSQL isn't running, or the credentials in `server/.env` don't match
what you set up in step 1. Test directly: `psql -U postgres -h localhost -d stock_alert_db`

**Port already in use**
→ Something else is on 3000/5000/8000. Either stop it, or change the port:
`PORT=5001` in `server/.env` (and update `VITE_API_URL` in `client/.env` to
match), `--port 8001` on the uvicorn command, or `npm run dev -- --port 3001`
for the client.

**`npm run migrate` fails with a connection error**
→ PostgreSQL isn't running yet, or the database from step 1 wasn't created.
Run `psql -U postgres -l` to list databases and confirm `stock_alert_db`
is there.

## Stopping everything

`Ctrl+C` in each of the three terminals. PostgreSQL keeps running as a
background service (via `brew services`, `systemctl`, or Docker) — stop it
separately if you want, e.g. `brew services stop postgresql@16` or
`docker stop stock-alert-db`.

## Re-running later

PostgreSQL data persists between restarts. You only need to repeat steps
2–4's `npm run dev` / `uvicorn` / `npm run dev` commands (no need to
`npm install`, `migrate`, or `seed` again unless you want fresh demo data).
