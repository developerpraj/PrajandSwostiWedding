# Endpoints

There are two entry points. Every other page is opened from one of them.

## 1. Guests / attendees → `index.html`
Personal link: `index.html?c=<InviteCode>` (or `?g=<GuestId>`). The home page and the left menu link to everything else, and the guest's identity is passed along on every link.

| Page | Purpose | Shown when |
|---|---|---|
| `index.html` | Home, personalized invitation, mantra, A4 card | always |
| `signin.html` | Find yourself without a personal link | not identified |
| `register.html` | Register / RSVP household | `feature.registration` |
| `pass.html` | Entry pass QR | after approval |
| `ceremony.html` | Ritual timeline | `feature.rituals` |
| `photos.html` | Upload + gallery | `feature.media` |
| `games.html` | Games / quiz | `feature.games` |
| `gift.html` | Gift / QR | `feature.gifts` |
| `memorial.html` | In memory of Mom | memorial enabled |
| `whisper.html` | Private message to the couple | from home/photos (feature-toggled) |
| `slideshow.html` | Big-screen live photo show (venue TV) | opened by admin |

## 2. Admin and assigned team → `admin/index.html`
Sign in with a personal passcode. The tabs you see depend on your role and duties: owner sees everything, manager sees everything except Settings/Team, helper sees only their duties (Door, Bar, Gifts, Live).

| Page | Purpose | Who |
|---|---|---|
| `admin/index.html` | Dashboard: guests, review, events, invitations, media, gifts, door, settings, team | by role |
| `admin/nametags.html` | Printable name tags / bands | owner/manager |
| `admin/planner.html` | Brahma Bibaha planner | owner/manager |
| "All pages" menu | Opens every guest page above | owner |

## Backend
One Apps Script `/exec` URL (in `js/config.js`) serves all data. Guest actions are approval-gated; `admin.*` actions require a passcode and are role-checked on the server.
