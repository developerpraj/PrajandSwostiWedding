# Copilot Instructions

## Project Guidelines
- Never compress or resize user-uploaded photos/videos in the wedding app; originals must stay full quality because the owner will use them to make a wedding video.
- Use only 100% free services: static GitHub Pages (vanilla HTML/CSS/JS, no build step), Google Apps Script, Google Sheets and Google Drive. No paid SMS/OTP/PDF/hosting.
- More than 90% of users are on phone browsers: design phone-first (44px touch targets, 16px inputs, no horizontal overflow, safe-area padding).
- Every guest-facing text must work in all three language modes: English (en), Nepali (ne) and Nepanglish (mix, 50/50). Add both values to `js/i18n.js`.
- No real deletes: when `data.softDelete` is TRUE, guests are told items are deleted but rows/files are kept (Status=Deleted or the Archive sheet). Only admin can change this flag.
- Guest activity is logged silently to the Drive "Guest Activity Log"; admin activity goes to the separate "Admin Activity Log". Never log passwords, codes, DOB, keys or tokens. Do not show logging notices to users.
- Vibe engineering / Brahma Bibaha planner is admin-only.
- Invitations are PDFs generated in Apps Script and must be approved by admin unless `invite.autoApprove` is TRUE.
- Prevent duplicate people by normalized name; typeahead may expose names/relations only (never phone/DOB).
- Prefer caching (stale-while-revalidate in `js/api.js`, service worker in `sw.js`) to keep the app fast within free quotas; bump the `CACHE` version in `sw.js` when shell files change.
- Save files as UTF-8 without BOM (Nepali text and emoji); avoid PowerShell commands that re-encode files.
- After changing `apps-script/Code.gs` schema/settings, the admin must redeploy and run `setup()`.
- All app configuration must be admin-controlled from the admin dashboard (every feature toggleable on/off there); every guest/admin action must be recorded in the AuditLog with who/when.

## Anonymous-looking content and gifts
- Guests may post photos/videos, secret notes and gifts "anonymously": public views never show their name/side, but the backend always stores the real GuestId/MemberId/Name/device for admins.
- Anonymous media files are renamed in Drive and stay private-purpose when sent as secret notes; originals are never compressed.
- Cash-envelope ledger and thank-you tracking are admin-only; thank-yous use free `wa.me` / `sms:` links, no paid APIs. Keep the UI uncluttered (modal/sheet, progressive disclosure).

## Multi-admin, thank-yous, Drive-only data
- Admins: owner passcode in Script Properties; other admins live in the `Admins` sheet with their own passcode and role (owner / manager / helper). Enforce roles server-side in `roleAllows_`; log every admin write with the admin's name; writes run under `LockService`.
- All core data stays in My Drive/Wedding (Data, Uploads, Gift QR, Logs, Invites, Proofs, Mom, Backups). Nightly backup copies the spreadsheet to Wedding/Backups (30 kept). No data in third-party services.
- Thank-yous are generated from Gifts + EventRsvp(Attended) with templates in Settings, sent via free wa.me / sms: / mailto: links and logged in `ThankYous`.