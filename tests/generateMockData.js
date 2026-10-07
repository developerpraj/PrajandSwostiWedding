// Generates tests/seed.json: a deterministic database with the same tables as the Google Sheet.
// Usage: node tests/generateMockData.js
const fs = require('fs');
const path = require('path');

let rnd = 42;
const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rand() * a.length)];
const pad = (n, w) => String(n).padStart(w || 3, '0');
const now = new Date();
const iso = (days, h) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h || 10, 0, 0, 0); return d.toISOString().slice(0, 16); };
const ago = mins => new Date(now.getTime() - mins * 60000).toISOString();
// Date of birth for someone who is `years` old today (birthday 30 days ago, so the age is unambiguous).
const dobFor = years => { const d = new Date(now); d.setFullYear(d.getFullYear() - years); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

const S = (k, v, t, g) => ({ Key: k, Value: v, Type: t || 'text', Group: g || 'General', Description: k });
const Settings = [
  S('lang.default', 'en', 'select:en,ne,mix'), S('couple.brideEn', 'Sita'), S('couple.brideNe', 'सीता'),
  S('couple.groomEn', 'Ram'), S('couple.groomNe', 'राम'), S('wedding.date', iso(30, 10), 'datetime'),
  S('wedding.endDate', iso(60, 23), 'datetime'), S('app.keepMemorialAfterEnd', 'TRUE', 'toggle'),
  S('drink.legalAge', '21', 'number', 'Drinking'), S('gift.currency', 'NPR', 'text', 'Gifts'),
  S('registration.open', 'TRUE', 'toggle', 'Registration'), S('accommodation.open', 'TRUE', 'toggle', 'Accommodation'),
  S('memorial.moderation', 'TRUE', 'toggle', 'Memorial'), S('media.moderation', 'FALSE', 'toggle', 'Media'),
  S('media.maxSizeMB', '500', 'number', 'Media'), S('media.maxVideoMB', '250', 'number', 'Media'),
  S('media.categories', 'Candid|BTS|Video Guestbook / Blessing', 'text', 'Media'),
  S('points.upload', '5', 'number', 'Games'), S('points.checkIn', '5', 'number', 'Games'), S('points.onTime', '5', 'number', 'Games'),
  S('app.helpPhone', '+9779800000000'), S('media.largeAlbumUrl', 'https://photos.google.com/', 'text', 'Media'),
  S('engage.promptsEn', 'Share a photo with the couple|Share your outfit', 'text', 'Engagement'),
  S('engage.promptsNe', 'फोटो बाँड्नुहोस्|पहिरन बाँड्नुहोस्', 'text', 'Engagement'),
  S('thanks.tplGift', 'Dear {name}, thank you for the {gift} at {event}. {couple}', 'text', 'Thank-yous'),
  S('thanks.tplPresence', 'Dear {name}, thank you for joining {event}. {couple}', 'text', 'Thank-yous'),
  S('thanks.tplNe', 'प्रिय {name}, धन्यवाद। {couple}', 'text', 'Thank-yous'),
  S('auth.phone', 'TRUE', 'toggle', 'Sign-in'), S('auth.google', 'FALSE', 'toggle', 'Sign-in'),
  S('contact.channels', 'whatsapp,viber,email', 'text', 'Contact'), S('contact.requireEmail', 'FALSE', 'toggle', 'Contact')
].concat(['registration', 'accommodation', 'drinkBand', 'nameTags', 'live', 'memorial', 'media', 'rituals', 'games', 'gifts',
  'venues', 'invites', 'nudges', 'sideThemes', 'attended', 'elderMode'].map(f => S('feature.' + f, 'TRUE', 'toggle', 'Features')));

const Venues = [
  { VenueId: 'V1', NameEn: 'Pashupati Garden', NameNe: 'पशुपति गार्डेन', Address: 'Kathmandu', Country: 'Nepal', MapLink: '', Notes: 'Main', Selectable: 'TRUE', Order: 1 },
  { VenueId: 'V2', NameEn: 'Hotel Yak & Yeti', NameNe: 'होटल याक एण्ड यती', Address: 'Durbar Marg, Kathmandu', Country: 'Nepal', MapLink: '', Notes: 'Sangeet', Selectable: 'TRUE', Order: 2 },
  { VenueId: 'V3', NameEn: 'Minneapolis reception', NameNe: 'मिनियापोलिस', Address: 'Minneapolis, MN', Country: 'USA', MapLink: '', Notes: 'US guests', Selectable: 'TRUE', Order: 3 }
];

const Events = [
  { EventId: 'E1', NameEn: 'Mehendi', NameNe: 'मेहेन्दी', DateTime: iso(27, 16), Venue: 'Pashupati Garden', DressCode: 'Green', Groups: 'All', Order: 1, Visible: 'TRUE' },
  { EventId: 'E2', NameEn: 'Janti', NameNe: 'जन्ती', DateTime: iso(29, 9), Venue: 'Groom house', DressCode: 'Daura suruwal', Groups: 'Groom', Order: 2, Visible: 'TRUE' },
  { EventId: 'E3', NameEn: 'Wedding Ceremony', NameNe: 'विवाह', DateTime: iso(30, 10), Venue: 'Pashupati Garden', DressCode: 'Traditional', Groups: 'All', Order: 3, Visible: 'TRUE' },
  { EventId: 'E4', NameEn: 'Reception', NameNe: 'रिसेप्सन', DateTime: iso(31, 18), Venue: 'Hotel Yak & Yeti', DressCode: 'Formal', Groups: 'All', Order: 4, Visible: 'TRUE' }
];

const first = ['Hari', 'Gita', 'Anil', 'Priya', 'Bikash', 'Sunita', 'Ramesh', 'Kamala', 'Suman', 'Anisha', 'Prakash', 'Rita', 'Dipesh', 'Sabina', 'Rajan'];
const last = ['Sharma', 'Thapa', 'Karki', 'Rai', 'Gurung', 'Adhikari', 'Shrestha', 'Tamang', 'Joshi', 'Bhandari'];
const allergies = ['', '', '', 'Peanut allergy', 'Gluten free', 'Shellfish allergy', 'Lactose intolerant', 'Vegan'];
const sides = ['Bride', 'Groom', 'Both'];

// Named fixtures the E2E tests rely on (keep stable).
const fixed = {
  1: { Name: 'Teen Bride Guest', Side: 'Bride', age: 19, Phone: '+977 9811000001', InviteCode: 'TEEN19' },
  2: { Name: 'Adult Groom Guest', Side: 'Groom', age: 25, Phone: '+977 9811000002', InviteCode: 'ADULT25', AgeVerified: 'TRUE' },
  3: { Name: 'Bride Only Guest', Side: 'Bride', age: 40, Phone: '+977 9811000003', InviteCode: 'BRIDE40', AgeVerified: 'TRUE' },
  4: { Name: 'Revoked Guest', Side: 'Both', age: 33, Phone: '+977 9811000004', InviteCode: 'REVOKED', LinkRevoked: 'TRUE' },
  5: { Name: 'No Email Guest', Side: 'Both', age: 50, Phone: '+977 9811000005', InviteCode: 'NOMAIL', Email: '' }
};

const Guests = [], Members = [], EventRsvp = [];
for (let i = 1; i <= 150; i++) {
  const id = 'G' + pad(i), f = fixed[i] || {};
  const side = f.Side || sides[i % 3];
  const age = f.age || (i % 10 === 0 ? 15 + (i % 6) : 18 + Math.floor(rand() * 60)); // every 10th guest is under 21
  const name = f.Name || pick(first) + ' ' + pick(last);
  const status = i <= 5 ? 'Attending' : pick(['Attending', 'Attending', 'Maybe', 'Not attending', 'Pending']);
  const g = {
    GuestId: id, Name: name, NameNe: '', Family: name.split(' ').pop(), Side: side,
    Relation: pick(['Uncle', 'Aunt', 'Cousin', 'Friend', 'Colleague']), Groups: 'All,' + side,
    Phone: f.Phone || '+977 98' + pad(i + 20000000, 8),
    Email: f.Email !== undefined ? f.Email : (i % 4 === 0 ? '' : 'guest' + i + '@example.com'), // every 4th guest has no email
    DOB: dobFor(age), AdmitCount: 1 + (i % 4), AttendingCount: status === 'Attending' ? 1 + (i % 3) : 0, Status: status,
    Meal: pick(['Veg', 'Non-veg']), Allergies: allergies[i % allergies.length], Registered: status === 'Pending' ? 'FALSE' : 'TRUE',
    RegisteredAt: ago(1000 + i), CheckedIn: 'FALSE', RelationTo: side === 'Both' ? 'Both' : side + "'s family", RelationType: 'Family',
    VenueId: Venues[i % Venues.length].VenueId, InviteCode: f.InviteCode || 'INV' + pad(i), InviteOpened: 'TRUE',
    AgeVerified: f.AgeVerified || (age >= 21 && i % 2 ? 'TRUE' : 'FALSE'), NonDrinker: i % 17 === 0 ? 'TRUE' : '',
    LinkRevoked: f.LinkRevoked || (i % 37 === 0 ? 'TRUE' : ''), LinkExpires: '', AccommodationEligible: i % 5 === 0 ? 'TRUE' : 'FALSE',
    Table: String(1 + (i % 20))
  };
  Guests.push(g);
  Members.push({ MemberId: 'M' + pad(i), GuestId: id, Name: name, RelationTo: g.RelationTo, RelationType: 'Family', Relation: g.Relation,
    DOB: g.DOB, AgeVerified: g.AgeVerified, NonDrinker: g.NonDrinker, Attending: status === 'Attending' ? 'TRUE' : 'FALSE', IsPrimary: 'TRUE' });
  if (status !== 'Pending') EventRsvp.push({ GuestId: id, EventId: 'E3', Response: status === 'Attending' ? 'Yes' : status === 'Maybe' ? 'Maybe' : 'No', Count: g.AttendingCount });
}

const Media = Array.from({ length: 20 }, (_, i) => {
  const g = Guests[i * 7];
  return { MediaId: 'MD' + pad(i + 1), GuestId: g.GuestId, MemberId: 'M' + g.GuestId.slice(1), Name: g.Name, Side: g.Side, EventId: Events[i % 4].EventId,
    DriveFileId: 'demo' + (i + 1), Type: i % 5 === 4 ? 'video' : 'photo', FileName: 'photo' + (i + 1) + '.jpg', Status: i === 19 ? 'Pending' : 'Approved',
    Timestamp: ago(500 - i * 10), SizeBytes: 1000000 + i * 50000, Category: 'Candid', Thumb: 'https://picsum.photos/seed/wed' + (i + 1) + '/600/600' };
});

const Gifts = Array.from({ length: 50 }, (_, i) => {
  const g = Guests[(i * 3) % 150];
  return { GiftId: 'GF' + pad(i + 1), GuestId: g.GuestId, Name: g.Name, Side: g.Side, Method: pick(['Cash envelope', 'eSewa', 'Khalti']),
    Amount: 1001 + i * 100, Currency: 'NPR', Note: 'Salami #' + (i + 1), Status: i % 5 === 0 ? 'Thanked' : 'Received',
    ThankedAt: i % 5 === 0 ? ago(100) : '', Timestamp: ago(2000 - i * 10), Relation: g.Relation, Source: 'cash', EventId: 'E3', EnteredBy: 'Demo Owner' };
});

const MomMemories = Array.from({ length: 15 }, (_, i) => ({
  MemoryId: 'MM' + pad(i + 1), GuestId: Guests[i].GuestId, Name: Guests[i].Name, Relation: 'Family', Type: 'text',
  Text: 'Memory #' + (i + 1) + ': she was always kind.', Status: i % 4 === 3 ? 'Pending' : 'Approved', IsPrivate: 'FALSE', Timestamp: ago(3000 - i)
}));

// Only one banner can be shown at a time, but five are "active" to exercise the newest-wins rule.
const Live = Array.from({ length: 5 }, (_, i) => ({ Timestamp: ago(50 - i * 5), MessageEn: 'Live alert ' + (i + 1), MessageNe: 'सूचना ' + (i + 1), Active: 'TRUE' }));

const Games = [
  { GameId: 'GM1', Type: 'quiz', TitleEn: 'How did they meet?', TitleNe: 'कसरी भेटे?', QuestionEn: 'Where did they meet?', QuestionNe: 'कहाँ भेटे?', OptionsEn: 'College|Temple|Wedding|Online', OptionsNe: 'कलेज|मन्दिर|विवाह|अनलाइन', Answer: 0, Points: 10, Groups: 'All', Active: 'TRUE', Order: 1 },
  { GameId: 'GM2', Type: 'quiz', TitleEn: 'Favourite food', TitleNe: 'खाना', QuestionEn: "Ram's favourite food?", QuestionNe: 'खाना?', OptionsEn: 'Momo|Dal bhat|Pizza', OptionsNe: 'मःम|दाल भात|पिज्जा', Answer: 0, Points: 10, Groups: 'All', Active: 'TRUE', Order: 2 }
];

const db = {
  Settings, Guests, Members, Events, EventRsvp, Venues, Media, Gifts, Live, Games,
  MomProfile: [{ Key: 'name', Value: 'Laxmi Devi' }, { Key: 'nameNe', Value: 'लक्ष्मी देवी' }, { Key: 'years', Value: '1965 - 2020' }, { Key: 'quote', Value: 'Love grows when given.' }, { Key: 'photoId', Value: '' }],
  MomMemories, MomDiyas: MomMemories.slice(0, 5).map(m => ({ GuestId: m.GuestId, Name: m.Name, Blessing: 'Om Shanti', Timestamp: m.Timestamp })),
  Admins: [
    { Email: 'owner@example.com', Name: 'Demo Owner', Role: 'owner', Passcode: '••••mo', Active: 'TRUE', AddedAt: ago(9000), LastSeen: ago(2) },
    { Email: 'helper@example.com', Name: 'Cousin Helper', Role: 'helper', Passcode: '••••42', Active: 'TRUE', AddedAt: ago(4000), LastSeen: ago(300) }
  ],
  Scores: [], Proofs: [], Whispers: [], ThankYous: [], Rooms: [{ RoomId: 'R1', Name: 'Room 101', Location: 'Hotel Yak & Yeti', Capacity: 3, CheckIn: iso(27, 14), CheckOut: iso(32, 11) }],
  Accommodation: [], Invites: [], Vibe: [], Traditions: [], Scenarios: [], AuditLog: [],
  Rituals: [{ RitualId: 'RT1', EventId: 'E3', Order: 1, Icon: '🪔', NameEn: 'Ganesh Puja', NameNe: 'गणेश पूजा', MeaningEn: 'Auspicious start', MeaningNe: 'शुभ सुरुवात', Status: 'now', StartedAt: ago(5), Visible: 'TRUE' }]
};

const out = path.join(__dirname, 'seed.json');
fs.writeFileSync(out, JSON.stringify(db, null, 2));
console.log('Wrote ' + out + ': ' + Guests.length + ' guests, ' + Media.length + ' media, ' + Gifts.length + ' gifts, ' + MomMemories.length + ' memories, ' + Live.length + ' live alerts');
module.exports = db;
