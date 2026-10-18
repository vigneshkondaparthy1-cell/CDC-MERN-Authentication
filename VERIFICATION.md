# Verification results

Verified on 16 October 2026 using Node.js 24.21.0, an isolated MongoDB 8.2.6 instance, and headless Microsoft Edge on Windows.

## Results

| Check | Result |
|---|---|
| Frontend production build | Passed |
| Backend integration suite | 5 tests passed |
| Browser workflow | Passed |
| Desktop Admin and mobile Student screenshots | Visually reviewed |
| Frontend dependency audit | 0 reported vulnerabilities |
| Backend dependency audit | 0 reported vulnerabilities |

The API tests cover repeat Admin seeding without password reset, health checks, malformed/oversized request bodies, invalid credentials, session restoration, Admin account creation, duplicate emails and roll numbers, password hashing and response filtering, self-profile isolation, Faculty/Student authorization, stable student UUIDs, logout, and invalid/expired/deleted-user sessions.

The browser workflow creates Faculty and Student accounts through the Admin dashboard, signs in as each role, reloads sessions, checks redirects from the Admin route, verifies protected API responses, checks Student QR rendering and mobile horizontal overflow, and verifies successful logout and failed-logout recovery. Browser runtime errors fail the check. Screenshots are written to `server/test-artifacts/`.

## Reproduce

Install dependencies with `npm ci` in both `client/` and `server/`. From `server/`:

```powershell
npm test
# Use installed Microsoft Edge on Windows:
$env:BROWSER_CHANNEL = 'msedge'
npm run test:ui
```

Alternatively, run `npx playwright install chromium` from `server/` and omit `BROWSER_CHANNEL`. Tests create and stop their own temporary databases; they do not use `server/.env` or the configured application database. The seed subprocess receives only the temporary test URI through its environment.

`mongodb-memory-server` downloads MongoDB on first use. If that download is blocked or slow, set `$env:MONGOMS_SYSTEM_BINARY` to an existing compatible `mongod.exe` path. This verification used an official MongoDB 8.2.6 executable downloaded separately. Running database/browser processes may require permission outside a restricted sandbox.

From `client/`, run `npm run build`. Run `npm audit` in each package directory to refresh the dependency findings, which may change over time.

## Changes made

- Kept the UI signed in when logout fails and displayed the failure so the user can retry.
- Reset creation forms and lists when switching Admin tabs, and cleared stale list errors on retries.
- Associated form labels with their inputs for accessible interaction.
- Trimmed login email input, returned appropriate malformed-body and oversized-body errors, and distinguished database failures from invalid sessions.
- Waited for User indexes before accepting application requests.
- Replaced personal example configuration with generic placeholders.
- Added reproducible API/browser tests and dependency lockfiles.
- Updated React Router and Tailwind/PostCSS integration to resolve reported frontend dependency advisories.

## Remaining environment steps

The existing private `server/.env` was preserved. Its `MONGO_URI`, `JWT_SECRET`, and `ADMIN_PASSWORD` need configuration before the normal application startup/seed flow can be used. No credentials are included in this report. Set a real MongoDB URI, a random JWT secret of at least 32 characters, and a private Admin password of at least 8 characters; then run the documented seed/start commands.

The configured Atlas connection and public deployment were not verified. No hosting destination was provided. Production HTTPS, reverse-proxy configuration, and checks against the deployed URL remain environment-specific steps. QR rendering and UUID stability were checked; scanning with a physical device was not tested.

## Dashboard refresh — 16 October 2026
Production build and isolated browser checks passed after the dashboard redesign. Additional checks cover the account creation dialog, search/no-results feedback, expandable account details, and next/previous pagination. Desktop and mobile screenshots were reviewed. Existing local account credentials and records were not modified. The required profile fields, student QR, and role protections remain in place.


## Interface and login update — 17 October 2026
Build, five integration tests, and browser workflow passed. Browser checks include password show/hide, role navigation, account creation with six-digit roll numbers, search, pagination, profile isolation, QR display, and mobile layout. All 120 updated faculty/student password hashes were verified against the regenerated private login lists. Ninety unique six-digit student roll numbers were verified; Admin credentials and student QR identifiers were preserved.


## Appearance update — 17 October 2026
Production build and isolated browser regression checks passed. Verified persistent light/dark switching across reload and login, keyboard activation of interactive objects, pause/resume control, mobile width, designer credit, password eye toggle, account creation in light mode, and switching back to dark mode. Reviewed login, dashboard, mobile, and light account-dialog screenshots. No live account or credential changes were made.


## Account management update — 18 October 2026

Production build passed, all nine backend integration tests passed, and the isolated Edge browser workflow passed. Added coverage for self-service email/password changes, current-password confirmation, duplicate email rejection, old-session invalidation, Admin profile edits and confirmed password resets, role restrictions, secret-free activity responses, and unchanged student QR identity. Browser checks exercise both roles' Settings, Admin activity/edit/reset controls, password generation, QR PNG download, and session-expiry feedback. The running local API's activity and next-roll endpoints were also verified.

New screenshots are in docs/screenshots: faculty-settings.png, student-settings.png, admin-management.png, and student-qr.png. The QR download and Faculty settings screenshots were visually reviewed. Tests used isolated databases; this update did not change existing local user credentials. Existing passwords remain hash-only. Only a newly entered/generated reset password is displayed in the reset dialog.

Earlier dependency-audit results above are historical and were not rerun for this update. The earlier pause/resume control was subsequently removed as requested. Local MongoDB is now configured; the original environment-setup notes above describe the initial verification state.
