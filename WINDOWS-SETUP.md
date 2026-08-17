# Windows 10 Setup

**Note:** this guide was written for Windows but not run on a real Windows
machine (the environment used to build this project is Linux). Every
command should be correct, but if something doesn't match what you see,
tell me the exact error and I'll fix this guide.

Use **Command Prompt** or **PowerShell** — either works, differences are
called out below.

## 1. Install prerequisites

- **Node.js**: [nodejs.org](https://nodejs.org) — download the LTS installer, run it (defaults are fine)
- **Python**: [python.org/downloads](https://www.python.org/downloads/) — **important**: on the first installer screen, check **"Add python.exe to PATH"** before clicking Install
- **PostgreSQL**: [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) — download the installer (EnterpriseDB)
  - During install, it asks you to **set a password for the `postgres` superuser** — remember this, you'll need it below
  - Keep the default port (5432)
  - Check **"Add PostgreSQL to PATH"** if the installer offers it (Stack Builder screen can be skipped/cancelled)
  - PostgreSQL installs as a Windows service and starts automatically — no separate "start the database" step needed

Verify each installed correctly by opening Command Prompt and running:

```cmd
node --version
python --version
psql --version
```

If `python` isn't recognized, try `py --version` instead (Windows' launcher) — use `py` in place of `python` in the steps below if so. If `psql` isn't recognized, PostgreSQL's `bin` folder (usually `C:\Program Files\PostgreSQL\16\bin`) wasn't added to PATH — add it manually via *System Properties → Environment Variables → Path*, or just use the **SQL Shell (psql)** app from the Start menu instead of Command Prompt for the database steps below.

## 2. Create the database

Open **SQL Shell (psql)** from the Start menu (installed with PostgreSQL). Press Enter to accept each default prompt (Server, Database, Port, Username = `postgres`) until it asks for a password — enter the password you set during install. Then run:

```sql
CREATE DATABASE stock_alert_db;
```

If you want the app's default `.env` files to work without editing them,
also set the postgres password to `postgres` (skip this if you'd rather
just edit the `.env` files later with your actual password):

```sql
ALTER USER postgres PASSWORD 'postgres';
```

Type `\q` and Enter to exit.

## 3. Unzip the project and open 3 terminals

Unzip `stock-alert-system-full.zip` somewhere convenient, e.g. `C:\dev\stock-alert-system`.

Open **3 separate** Command Prompt (or PowerShell) windows — one per service.

## 4. Terminal 1 — Backend (Node API)

```cmd
cd C:\dev\stock-alert-system\server
npm install
copy .env.example .env
```

Open `.env` in Notepad (`notepad .env`) and confirm `DB_PASSWORD` matches
what you set in step 2. Then:

```cmd
npm run migrate
npm run seed
npm run dev
```

Leave this window open. It should print `Stock Alert API running on port 5000`.

## 5. Terminal 2 — AI service (Python)

```cmd
cd C:\dev\stock-alert-system\ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

**PowerShell only**: if `venv\Scripts\activate` fails with a message about
execution policies, run this once (in an Administrator PowerShell window),
then try activating again:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then start the service:

```cmd
uvicorn app.main:app --reload --port 8000
```

Leave this window open.

## 6. Terminal 3 — Frontend (React)

```cmd
cd C:\dev\stock-alert-system\client
npm install
copy .env.example .env
npm run dev
```

It'll print a local URL — open `http://localhost:3000` in your browser.

## 7. Log in

```
Email:    admin@stockalert.com
Password: admin123
```

## Windows-specific troubleshooting

**`'npm' is not recognized as an internal or external command`**
→ Node wasn't added to PATH, or you need to close and reopen your terminal
after installing Node (PATH changes don't apply to already-open windows).

**`venv\Scripts\activate` does nothing / no `(venv)` prefix appears**
→ In Command Prompt, that's the correct command. In PowerShell, if you get
an execution-policy error, see step 5 above. In Git Bash, use
`source venv/Scripts/activate` instead (Linux-style path).

**Port already in use**
```cmd
netstat -ano | findstr :5000
taskkill /PID <the number in the last column> /F
```
(replace 5000 with 8000 or 3000 for the other services)

**`psql` password authentication failed**
→ The password in `server\.env` (`DB_PASSWORD`) doesn't match what you set
during PostgreSQL install. Either update `.env` to match, or reset it via
SQL Shell (psql): `ALTER USER postgres PASSWORD 'postgres';`

**Windows Firewall popup when starting a service**
→ Safe to allow — it's just the local dev server asking for network
access on your own machine.
