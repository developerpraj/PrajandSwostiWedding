# What you can edit (and where)

Everything lives in **My Drive / Wedding**. The spreadsheet is `Wedding/Data/<your sheet>`.
Changes made directly in the spreadsheet show on the website within **~5 minutes** (cache). An admin action (save in dashboard) shows instantly.

> Rules for editing in the sheet: never rename/delete the header row (row 1), never change ID columns (`GuestId`, `EventId`, `MemberId`, …), use `TRUE`/`FALSE` for yes/no, dates as `2027-06-16 18:00`.

## 1. Safe to edit in the spreadsheet

| Tab | What it controls | Notes |
|---|---|---|
| **Settings** | Every feature toggle, couple names, invitation text, mantra, dates, theme | Same as Admin → Settings. Only edit the `Value` column. |
| **Guests** | Households: name, Nepali name, family, side, relation, phone, email, groups, approved/accommodation flags | `InviteCode`, `GuestId` – do not change. Approval is better done from the dashboard (it is audited). |
| **Members** | People inside each household | Keep `GuestId` matching the household. |
| **Events** | Event name, date/time, venue, map link, dress code, unlock time, who it is visible to | Assign days per household from Admin → Events. |
| **Venues** | Venue list / map points | |
| **Rooms** | Accommodation rooms & capacity | |
| **Rituals** | Ritual timeline shown on the live page | `Status`: upcoming / live / done. |
| **Games** | Quiz/game questions | |
| **Live** | Live banner messages (`Active` = TRUE shows it) | |
| **MomProfile / MomMemories** | Mom tribute page text and memories | |
| **Admins** | Who can log into the dashboard | Owner only. `Passcode` is a secret. |
| **Vibe / Traditions / Scenarios** | Planning notes (not shown to guests) | Edit freely. |

## 2. Edit only from the website / dashboard (written by the app)

Editing these by hand can break counts, approvals or links. Use the dashboard instead.

| Tab | Written by | Change it via |
|---|---|---|
| **AuditLog** | Every action | Read-only. Never edit. |
| **EventRsvp** | Guest RSVP + check-in | Guest page / Admin check-in |
| **Accommodation** | Guest requests | Admin → Accommodation (status/room) |
| **Media** | Photo/video uploads | Admin → Media (hide/approve/delete) |
| **Invites** | Invitation requests/PDFs | Admin → Invitations |
| **Proofs, Scores** | Games | Admin → Games |
| **Gifts, ThankYous** | Gift submissions / thank-you notes | Admin → Gifts |
| **Whispers, MomDiyas** | Guest messages | Admin moderation |

## 3. Per-guest Drive folders (`Wedding/Guests/<Full Name> (<GuestId>)/`)

| File | Editable? | How changes apply |
|---|---|---|
| `profile.json` | **Yes** – the `guest` and `members` sections | Admin → Guests → **⬆ Load JSON** on that row. Locked: GuestId, InviteCode, approval/review, check-in. Other sections are rebuilt automatically. |
| `activity-log.json` | No (auto, every interaction) | Mirrors AuditLog for that household. |
| `Invitation - … .pdf` | No (regenerate instead) | Admin → Invitations → Generate PDF. |

## 4. Drive folders (all created by `setup()` / **Sync Drive folders**)

| Folder | Contents |
|---|---|
| `Data` | The spreadsheet |
| `Uploads/<Event name>` | Original guest photos/videos, one subfolder per event (+ `General`) |
| `Guests/<Full Name> (<GuestId>)` | profile.json, activity-log.json, personal invitation PDFs |
| `Invites/General` | General (non-personal) invitation PDFs |
| `Proofs` | Game photo proofs |
| `Gift QR`, `Envelopes` | Gift payment QR images, envelope prints |
| `Mom` | Mom tribute media |
| `Logs` | Silent activity log sheets |
| `Backups` | Nightly copy of the spreadsheet (last 30 kept) |

You may add your own files to these folders; don't rename the folders (the app finds them by name/ID).
A new event gets its own `Uploads/<Event>` folder on the first upload or when you click **Sync Drive folders**.

## 5. Spreadsheet formatting

`formatSheets()` wraps long text, auto-fits column widths (70–320 px so wrapped text stays readable) and bolds/freezes the header on every tab. It runs:
- on `setup()`,
- every night (with the backup),
- on demand: Admin → Guests → **↔ Tidy spreadsheet**.
