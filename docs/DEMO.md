# CDC Portal review walkthrough

Use dedicated demo accounts. Do not record private `.env` files or the private login lists.

## Suggested 3–5 minute demo

1. **0:00–0:40 — Login:** show an invalid-credentials message, the eye toggle, and a successful Admin login. Explain that the server verifies a bcrypt hash and sends an HttpOnly JWT cookie.
2. **0:40–1:30 — Admin:** open the Student creation dialog, suggest an available six-digit roll number, generate an initial password, and create the account. Show search, pagination, and duplicate validation. Create Faculty in the Faculty tab.
3. **1:30–2:20 — Faculty:** sign in and show the self-profile. In Settings, change the email using the current password. Change the password and explain that other sessions become invalid.
4. **2:20–3:10 — Student:** show name, email, roll number, and QR. Download the PNG. The QR contains the stable student UUID, not a password or JWT.
5. **3:10–4:10 — Admin management:** sign in as Admin, open Activity, and show the change notifications. Expand an account to edit its name/email or reset its password with explicit confirmation. Existing passwords are not recoverable or displayed.
6. **4:10–5:00 — Authorization:** show a Faculty/Student request to `/api/admin/students` returning 403; show logout redirecting to Login. Mention responsive layouts, theme persistence, reduced-motion support, and automated verification.

## How the application works

- **Login:** Express validates input, looks up the email, and compares the supplied password with bcrypt. A successful login issues an eight-hour JWT in an HttpOnly cookie.
- **Authorization:** middleware verifies the token, loads the current database user, checks the session version, and enforces the current database role. Frontend guards are only a usability layer.
- **Self-profile:** `/api/profile/me` derives identity from the verified session. It accepts no arbitrary user ID.
- **Credential changes:** current-password confirmation is required for self-service changes. The server increments the session version, invalidating old cookies, and reissues the current user's cookie. Admin resets invalidate all of the target user's sessions.
- **Activity:** the database stores event type, actor, and time; Admin polls the feed and account directory every 15 seconds while visible. No new password or password hash is included in this feed.
- **Uniqueness:** MongoDB unique indexes enforce email, roll number, and student UUID uniqueness. Suggested roll numbers are not reservations; concurrent creation can still produce a conflict that the form reports.
- **QR download:** the browser renders the existing QR into a PNG with the student's name and roll number. Editing the profile does not change the underlying UUID.

## Submission checklist

- Source and lockfiles in your GitHub repository; never include `.env`, `.local`, password lists, or database files.
- README with setup, API contract, security explanation, AI assistance, screenshots, and limitations.
- Share demonstration credentials privately. The exported local login lists are initial snapshots, not a live password directory; later account changes supersede them.
- Include screenshots or record the walkthrough above. GitHub publication and submission are separate actions.
