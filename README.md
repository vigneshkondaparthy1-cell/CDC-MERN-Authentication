# GitHub

Repository: https://github.com/vigneshkondaparthy1-cell/CDC-MERN-Authentication

The ZIP paths start at your repository root (the folder containing README.md, client, and server). Replace these existing files:

- client/src/Dashboards.jsx
- client/src/AccountFeatures.jsx
- server/src/models/User.js
- server/src/routes/accountManagement.js
- server/src/routes/profile.js
- server/src/routes/directoryTools.js

Add these new files:

- client/src/StudentCard.jsx
- client/src/student-card.css

Optional test updates included:

- server/test/management.test.js
- server/test/features.test.js
- server/test-ui/smoke.js
- server/test-ui/admin-card.js (new)

On GitHub: open the repository, select Add file > Upload files, and drag the extracted client and server folders into the upload area. Commit the changes. Do not upload the ZIP itself or an extra enclosing project folder. Existing files outside this update stay in place. Alternatively, copy the extracted folders into your local repository, review the diff, commit, and push.

No new packages or environment variables are needed. Restart your backend and rebuild/redeploy the frontend after replacing the files. For local development run npm.cmd run dev in server and client in separate terminals. Existing user records work without migration.

## What changed

- Student and Faculty CSV import buttons use the green primary styling. Add account was removed from the UI; existing API creation endpoints remain compatible.
- Expand a Faculty or Student row and select Delete account. Type the displayed email and confirm. This permanently removes that user and their embedded account-update history; their login and existing sessions stop working. Attendance records are retained. Admin accounts cannot be deleted through this endpoint. No live accounts were deleted while developing this feature.
- Account updates shows the actor and before/after values for future email, name, profile, academic, and status changes. Password changes show a timestamp and action only. Previous events cannot recover before/after values that were never recorded.
- Students see a gradient digital ID pass with their real name, photo/initial, roll number, email, department and QR identifier, plus Print and PNG download. Admin can edit branch, section, study year and valid period in Edit profile. Missing fields show Not set. The QR contains only the student identifier and is not a login credential or proof of live verification.

## Checks

From client: npm.cmd run build
From server: npm.cmd test
For the new UI workflow: node test-ui/admin-card.js (Microsoft Edge required)
The database tests use temporary databases, not your configured app database.
