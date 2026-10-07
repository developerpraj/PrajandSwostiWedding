# demo-data (local preview only)

Fake wedding data so you can click through every screen before the Google Apps Script backend is deployed.

- `demo-api.js` – an in-browser stand-in for `apps-script/Code.gs`. It holds the dummy guests, events, RSVPs, gifts,
  media, rituals, games, memorial, admins, thank-yous, rooms, venues, and other records, and answers every `API.call`.
- Used automatically on `localhost` / `127.0.0.1` / `file:`; real backend everywhere else. Override with `?mode=demo` or `?mode=prod` (remembered in this browser). A green "Demo data" pill shows on every page.
- Admin passcode in demo mode: **demo**
- The demo guest is signed in as *Hari Sharma* (invite code `DEMO01`). Other codes: `DEMO02` … `DEMO06`.
- Edits are saved in this browser only (`localStorage.demoDB`). Click **Reset** on the pill to start fresh.
- Uploads are disabled in demo mode (they need Google Drive).

**Before going live:** paste your Apps Script `/exec` URL into `API_URL` in `js/config.js`. If you previously used `?mode=demo` on the live site, open it once with `?mode=prod`.
