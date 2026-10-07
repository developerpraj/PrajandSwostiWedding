# Wedding-day operations: audit, duties, phones-down, blast, swipe, themes

All paths below are from the repo root. Nothing here adds a dependency. Everything is vanilla JS plus Apps Script.

## Helper duties (`Admins.Duties`)
- In **Admin, then Team**, tick Door, Bar, Gifts and/or Live for a helper. Leave all of them blank to keep the old behaviour (all helper tools).
- The server enforces duties (`apps-script/Pure.gs`: `DUTY_ACTIONS`, `dutyAllows_`). Hiding a tab is only a UI convenience.
- `admin.me` returns `tabs` (`dutyTabs_`). For example, a Door helper sees only the Door tab.

| Duty | Actions | Tabs |
|---|---|---|
| door | checkIn, checkInMember, undoCheckIn, guests, people, household, setTable | door |
| bar | verifyAge, verifyMember, guests, people, stats, analytics | dash, door |
| gifts | gifts, saveCashGift, auditGift, envelopePhoto, thank* | gifts, thanks |
| live | rituals, ritualNow, stats, analytics | live, dash |

## Salami audit (Gifts tab, then **Start audit**)
- Each cash envelope appears as a card showing the envelope photo, giver and amount. Swipe right or press → to **Verify**. Swipe left or press ← to **Flag**; a flag needs a short note. **Skip** leaves the gift pending.
- Results are stored in `Gifts.AuditStatus` (`Verified`, `Flagged` or blank), along with `AuditedAt`, `AuditedBy` and `AuditNote`. Action: `admin.auditGift {giftId, status, note}`.
- The summary shows totals per currency: logged, verified, flagged and still pending. **Export audit CSV** downloads `salami-audit.csv` (UTF-8 with BOM so Excel opens it correctly).

## Phones down (Live tab)
- **Freeze now** for N minutes, then **Reopen**. Settings: `freeze.on`, `freeze.until`, `freeze.windows` (`startISO>endISO;...`), `freeze.messageEn` and `freeze.messageNe`.
- While frozen, `submitAnswer` and `startUpload` are rejected and the public leaderboard is empty. Guests see a banner on every page. The games and photos pages show a paused card. Schedule, pass and invitation stay available.
- Scheduled windows are re-evaluated on every config read, including cached reads, and in `live.json`.
- **Scheduled freezes** (Live tab, then *Scheduled freezes*): add start and end pairs using date-time pickers. They are validated on the phone and on the server (`freezeWindowsValid_`) and saved with `admin.freeze {windows}`, which leaves the manual switch alone.
- Open pages react when the freeze changes. The live feed fires `app:freeze`. The games page reloads, and the photos page disables or re-enables its pickers. Uploads already in the queue stay on the phone.

## Emergency blast (Live tab)
- **Build list** returns deduplicated phone numbers for guests who are not checked in, not declined and still have an active link. You can filter by side.
- A household is skipped if **any** member has checked in. Phones are normalized by `phoneKey_`: Nepali 10-digit mobiles get the 977 prefix, so `98…` and `+977 98…` count as one number. The output is in `+country` format.
- Copy the numbers and the message into a WhatsApp broadcast. **The app never sends messages.** Action: `admin.blastList {side}`.

## Door swipe (mobile)
- Swipe a row right to check in, with a full-screen flash: green for adults, red for minors, blue when no drink band applies. Swipe left to call the guest. Long-press (550 ms) to edit the table (`admin.setTable`).
- Offline check-ins show a yellow **Sync pending** pill until the queue (`pending_checkins`) syncs.
- **Undo**: every check-in shows an 8-second Undo toast. If it hasn't synced yet, it is simply dropped from the queue (`Door.undo`). Otherwise `admin.undoCheckIn` is called. Door duty is allowed to undo.
- The trigger threshold is 35% of the row width or 90 px. The gesture code is `App.swipe` in `js/app.js` and uses pointer events.

## Group themes and presets
- Settings: `theme.brideFamilyPrimary`, `theme.groomFamilyPrimary` and `theme.friendPrimary` override the side colour for that group. Leave one blank to fall back to the side theme.
- `theme.preset` can be `classic`, `royal`, `garden`, `midnight`, `blush` or `heritage`. It sets `html[data-preset]`, and the styles live in `css/ops.css`.
- Per-group accents: `theme.brideFamilyAccent`, `theme.groomFamilyAccent` and `theme.friendAccent`. `theme.groomAccent` was restored, because its settings row had been damaged.

## Styling and animations
- `css/ops.css` contains swipe rows, Door flash, the audit deck, the freeze banner, paused cards, theme presets and the premium invitation card (gold-foil border, inner rule, ornaments and shimmer). All motion is turned off under `prefers-reduced-motion`.
- `sw.js` cache bumped to `wedding-v10` and precaches `css/ops.css`.

## Tests (written, **not yet run**)
- `tests/backend/admin-ops.test.js` covers duties, `dutyTabs_`, server duty enforcement, `freezeState_`, freeze gates, `auditGift`, `blastList_` and `setTable`. It also covers `phoneKey_`, skipping households that have arrived, `freezeWindowsValid_`, saving a freeze schedule, `undoCheckIn`, and analytics access for Bar and Live duties.
- `tests/backend/door-undo.test.js` covers `Door.undo` for both unsynced and synced check-ins, using a fake `localStorage`.
- Run later with the normal backend suite. Dependencies are installed automatically by `tests/Run-Tests.ps1`.
