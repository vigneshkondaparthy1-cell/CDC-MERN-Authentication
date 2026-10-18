# Run the CDC Portal on Windows

1. Install Node.js 22 LTS or newer and have MongoDB available locally or through Atlas.
2. Extract this ZIP. Open PowerShell in the extracted cdc-mern-auth-updated folder.

## Backend (first terminal)

```powershell
cd server
# Skip downloading the optional test database during installation:
$env:MONGOMS_DISABLE_POSTINSTALL = '1'
npm.cmd ci
Copy-Item .env.example .env
notepad .env
```

Set these values in .env, then save the file:

- MONGO_URI: your MongoDB URI. The example uses mongodb://127.0.0.1:27017/cdc_auth; a local MongoDB server must be running for this URI to work. For Atlas, supply its connection URI and configure your database user and network access.
- JWT_SECRET: a random secret of at least 32 characters. Generate one with the command below and paste the output into .env.
- ADMIN_EMAIL: the email you want to use for Admin login.
- ADMIN_PASSWORD: your own strong password, at least 8 characters.
- ADMIN_NAME: your preferred administrator name.

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm.cmd run seed
npm.cmd run dev
```

Keep this terminal running. The API runs on http://localhost:5000.
The seed command creates Admin once and does not change an existing account's password.

## Frontend (second terminal)

Open a second PowerShell terminal in the extracted project folder:

```powershell
cd client
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:5173 and sign in with the ADMIN_EMAIL and ADMIN_PASSWORD you configured. Use the Admin dashboard to create Faculty and Student accounts.

## Later runs

You only need to run `npm.cmd run dev` in server and client, with MongoDB available. Do not copy .env.example over your configured .env again. Stop either process with Ctrl+C.

## Optional verification

From server: `npm.cmd test`. This uses a temporary test database and may download MongoDB the first time. For UI checks on Windows with Edge installed, set `$env:BROWSER_CHANNEL = 'msedge'`, then run `npm.cmd run test:ui`. See VERIFICATION.md for alternatives and details.

From client: `npm.cmd run build` creates a production frontend in client/dist. Public deployment also needs the backend, MongoDB, HTTPS and API routing; see README.md.

## Troubleshooting

- MongoDB connection error: ensure your local MongoDB service is running, or verify the Atlas URI, database credentials and network access.
- Invalid login: use the seeded credentials. Changing ADMIN_PASSWORD in .env does not reset an already-created account.
- Backend unreachable: keep the server terminal running and use backend port 5000 with the supplied Vite proxy.
- Frontend port busy: free port 5173 or deliberately update CLIENT_ORIGIN and use a matching frontend URL.

The ZIP includes source code, lockfiles, tests, and documentation. Private .env files, installed dependencies, build output, and test screenshots are excluded.
