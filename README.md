# WorkLog - TSK יומן עבודה

Work-log web app for TSK civil engineering: extra shifts, vacation, sick leave, reserve duty and petty cash,
with manager approvals and an office area (reports, documents, Excel export, vacation quotas).
Installable on phones as an app (PWA).

- **Live:** https://work-log1.vercel.app  ·  employees install the app from https://work-log1.vercel.app/install
- **Hosting:** Vercel project `work-log1`, deploys automatically from the `main` branch of this repo
- **Database / login:** Firebase project `worckshifts` (Firestore + Auth, free plan)
- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Firebase · ExcelJS

## איך ממשיכים לעבוד (בעברית)

1. **מריצים מקומית:** לחיצה כפולה על `start-local.cmd`. נפתח אתר מקומי עם נתונים מדומים בכתובת http://localhost:3000
   (שום דבר לא נוגע באתר החי). משתמשי הדמה והסיסמה - בראש הקובץ `scripts/seed-emulator.mjs`.
2. **משנים ובודקים** מקומית, כולל בדיקת תצוגת נייד (F12 ואז Ctrl+Shift+M).
3. **העלאה לאוויר:** דחיפה ל-`main` ב-GitHub. Vercel מעדכן את האתר תוך 1-3 דקות, והאפליקציה בטלפונים מתעדכנת לבד.
4. **אם שיניתם את `firestore.rules`:** מריצים `node scripts/test-rules.mjs` (כל הבדיקות חייבות לעבור),
   ומדביקים את הקובץ ב-Firebase Console ← Firestore ← Rules **לפני** העלאת הקוד.
5. **חזרה לגרסה קודמת:** Vercel ← Deployments ← בוחרים גרסה קודמת ← "Promote to Production".

## Local development

Requirements: Node.js, Firebase CLI, Java 21 (for the Firestore emulator).

| Command | What it does |
| --- | --- |
| `start-local.cmd` | Starts the Firebase emulators, seeds fake data, runs `npm run dev` |
| `node scripts/seed-emulator.mjs` | Re-creates the fake users and requests (emulator must be running) |
| `node scripts/test-rules.mjs` | Checks `firestore.rules` against the emulator (all checks must pass) |
| `npm run build` | Production build (needs `.env.local` with the real Firebase web config) |

Environment files (not in git):
- `.env.local` - real Firebase web config (used by production builds; Vercel has its own copy in project settings)
- `.env.development.local` - points `npm run dev` at the local emulator (project `demo-worklog`)

## Where things are

| Path | Contents |
| --- | --- |
| `src/app/employee` | Employee home, new request (2 steps), report details |
| `src/app/manager` | Pending approvals, all requests, schedule |
| `src/app/office` | Overview, employees (roles + vacation quotas), reports + Excel, documents |
| `src/app/install`, `src/app/manifest.ts`, `public/sw.js`, `public/icons` | Phone app (PWA) |
| `src/app/components` | Header, phone bottom navigation, sub-tabs, notification bell |
| `src/lib/translations/index.ts` | All UI texts (Hebrew / English / Arabic) |
| `src/lib/requestTypeMeta.ts` | Icon and colors of each request type and status |
| `src/lib/workdays.ts` | Workday count and Israeli holidays - **add 2028-29 holidays by end of 2027** |
| `src/lib/firebase` | Firestore access: requests, reports, attachments, vacation quotas |
| `firestore.rules` | Database permissions (office / manager / employee) |

Roles: `employee` submits requests; `manager` approves shifts and vacations; `office` handles reports, documents,
employees and vacation quotas (office users can also submit their own requests).
