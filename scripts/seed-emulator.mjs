// Fills the LOCAL Firebase Emulator with fake data. Never touches real Firebase:
// it refuses to run unless the emulator is reachable, and uses the "demo-" project.
// Usage (with emulators running):  node scripts/seed-emulator.mjs
//
// Fake login accounts (all share the password below):
//   office@test.local    - Office (משרד)
//   manager@test.local   - Manager (מנהל)
//   manager2@test.local  - Manager who is also an employee (submits his own requests)
//   dana@test.local      - Employee
//   avi@test.local       - Employee
//   noa@test.local       - Employee

const PROJECT_ID = 'demo-worklog';
const PASSWORD = 'Test1234!';
const AUTH_HOST = '127.0.0.1:9099';
const FIRESTORE_HOST = '127.0.0.1:8080';

process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST;

const { initializeApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore, Timestamp } = await import('firebase-admin/firestore');

// Wipe previous fake data so the script can be re-run any time.
try {
  await fetch(`http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
} catch {
  console.error('Emulator is not running. Start it first: firebase emulators:start');
  process.exit(1);
}

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const people = [
  { key: 'office', email: 'office@test.local', name: 'רותי משרד', phone: '050-0000001', roles: ['office'], department: 'משרד' },
  { key: 'manager', email: 'manager@test.local', name: 'משה מנהל', phone: '050-0000002', roles: ['manager'], department: 'הנהלה' },
  { key: 'manager2', email: 'manager2@test.local', name: 'יעל מנהלת', phone: '050-0000006', roles: ['manager', 'employee'], department: 'הנהלה' },
  { key: 'dana', email: 'dana@test.local', name: 'דנה כהן', phone: '050-0000003', roles: ['employee'], department: 'שטח' },
  { key: 'avi', email: 'avi@test.local', name: 'אבי לוי', phone: '050-0000004', roles: ['employee'], department: 'שטח' },
  { key: 'noa', email: 'noa@test.local', name: 'נועה מזרחי', phone: '050-0000005', roles: ['employee'], department: 'פיקוח' },
];

const ids = {};
const now = Timestamp.now();
for (const p of people) {
  const u = await auth.createUser({ email: p.email, password: PASSWORD, displayName: p.name });
  ids[p.key] = u.uid;
  await db.doc(`users/${u.uid}`).set({
    id: u.uid,
    name: p.name,
    displayName: p.name,
    email: p.email,
    phoneNumber: p.phone,
    photoURL: null,
    roles: p.roles,
    status: 'active',
    department: p.department,
    createdAt: now,
    updatedAt: now,
  });
}

// Dates relative to today, so the current and previous month always have data.
// A number = days from today; a 'YYYY-MM-DD' string = fixed date.
const toDate = (v) => {
  if (typeof v === 'string') {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + v);
  return d;
};
const day = (v) => Timestamp.fromDate(toDate(v));

const requests = [
  { emp: 'dana', type: 'extra_shift', start: 3, project: 'כביש 6 - קטע 18', status: 'pending' },
  { emp: 'avi', type: 'extra_shift', start: 5, project: 'מחלף גלילות', status: 'pending' },
  { emp: 'noa', type: 'vacation', start: 10, end: 14, status: 'pending' },
  { emp: 'dana', type: 'extra_shift', start: -4, project: 'כביש 6 - קטע 18', status: 'approved' },
  { emp: 'avi', type: 'extra_shift', start: -8, project: 'מחלף גלילות', status: 'approved' },
  { emp: 'noa', type: 'extra_shift', start: -12, project: 'רכבת קלה - קו סגול', status: 'approved' },
  { emp: 'avi', type: 'vacation', start: -20, end: -18, status: 'approved' },
  { emp: 'dana', type: 'extra_shift', start: -35, project: 'רכבת קלה - קו סגול', status: 'approved' },
  { emp: 'noa', type: 'extra_shift', start: -40, project: 'מחלף גלילות', status: 'rejected' },
  { emp: 'dana', type: 'vacation', start: 20, end: 22, status: 'cancelled' },
  { emp: 'manager2', type: 'extra_shift', start: 7, project: 'פיקוח עליון', status: 'pending' },
  // Fixed dates for testing the year selector and holiday calculation:
  { emp: 'dana', type: 'extra_shift', start: '2025-12-15', project: 'כביש 6 - קטע 18', status: 'approved' },
  { emp: 'avi', type: 'vacation', start: '2025-12-28', end: '2026-01-01', status: 'approved' },
  { emp: 'noa', type: 'vacation', start: '2026-03-29', end: '2026-04-09', status: 'approved' },
];

for (const r of requests) {
  const ref = db.collection('requests').doc();
  await ref.set({
    id: ref.id,
    type: r.type,
    employeeId: ids[r.emp],
    managerId: ids.manager,
    startDate: day(r.start),
    ...(r.end !== undefined ? { endDate: day(r.end) } : {}),
    ...(r.project ? { projectName: r.project } : {}),
    status: r.status,
    ...(r.status === 'approved' ? { approvedBy: ids.manager } : {}),
    createdAt: Timestamp.fromDate(new Date(Math.min(toDate(r.start).getTime(), Date.now()) - 2 * 86400000)),
    updatedAt: now,
  });
}

// --- Sick leave / reserve duty reports with fake documents ---
// Builds a tiny valid one-page PDF containing the given English text.
const makePdf = (text) => {
  const NL = String.fromCharCode(10);
  const content = `BT /F1 20 Tf 60 740 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    ['<< /Length ' + content.length + ' >>', 'stream', content, 'endstream'].join(NL),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4' + NL;
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += [`${i + 1} 0 obj`, body, 'endobj', ''].join(NL);
  });
  const xref = pdf.length;
  pdf += ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ', ''].join(NL);
  offsets.forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n ` + NL; });
  pdf += ['trailer', `<< /Size ${objects.length + 1} /Root 1 0 R >>`, 'startxref', String(xref), '%%EOF'].join(NL);
  return Buffer.from(pdf, 'latin1');
};

const reports = [
  { emp: 'dana', type: 'sick', start: -3, end: -2, status: 'submitted', file: 'SAMPLE - Sick note (fake) - Dana' },
  { emp: 'avi', type: 'reserve', start: -15, end: -6, status: 'submitted' }, // missing document
  { emp: 'noa', type: 'sick', start: -25, end: -24, status: 'handled', file: 'SAMPLE - Sick note (fake) - Noa' },
  { emp: 'dana', type: 'reserve', start: -45, end: -40, status: 'handled', file: 'SAMPLE - Form 3010 (fake) - Dana' },
];

for (const r of reports) {
  const ref = db.collection('requests').doc();
  await ref.set({
    id: ref.id,
    type: r.type,
    employeeId: ids[r.emp],
    managerId: ids.manager,
    startDate: day(r.start),
    endDate: day(r.end),
    status: r.status,
    attachmentCount: r.file ? 1 : 0,
    ...(r.status === 'handled' ? { handledBy: ids.office } : {}),
    createdAt: day(Math.min(r.end, 0)),
    updatedAt: now,
  });
  if (r.file) {
    const data = makePdf(r.file);
    const att = db.collection('attachments').doc();
    await att.set({
      id: att.id,
      ownerId: ids[r.emp],
      requestId: ref.id,
      fileName: r.type === 'sick' ? 'אישור מחלה.pdf' : 'טופס 3010.pdf',
      contentType: 'application/pdf',
      size: data.length,
      data,
      createdAt: now,
    });
  }
}

// --- Petty cash requests with fake receipts ---
const pettyCash = [
  { emp: 'avi', start: -4, description: 'דלק ושכירות עגלה', project: 'מחלף גלילות', status: 'submitted',
    receipts: [{ amount: 250, name: 'קבלה דלק.pdf' }, { amount: 35.5, name: 'חניה.pdf' }] },
  { emp: 'noa', start: -18, description: 'ציוד משרדי', status: 'paid',
    receipts: [{ amount: 120, name: 'קבלה ציוד.pdf' }] },
];
for (const pc of pettyCash) {
  const ref = db.collection('requests').doc();
  const total = pc.receipts.reduce((sum, r) => sum + r.amount, 0);
  await ref.set({
    id: ref.id,
    type: 'petty_cash',
    employeeId: ids[pc.emp],
    managerId: '',
    startDate: day(pc.start),
    description: pc.description,
    ...(pc.project ? { projectName: pc.project } : {}),
    totalAmount: total,
    status: pc.status,
    attachmentCount: pc.receipts.length,
    ...(pc.status === 'paid' ? { handledBy: ids.office } : {}),
    createdAt: day(pc.start),
    updatedAt: now,
  });
  for (const r of pc.receipts) {
    const data = makePdf(`SAMPLE - Receipt (fake) - ${r.amount} ILS`);
    const att = db.collection('attachments').doc();
    await att.set({
      id: att.id, ownerId: ids[pc.emp], requestId: ref.id, fileName: r.name, contentType: 'application/pdf',
      size: data.length, data, amount: r.amount, createdAt: now,
    });
  }
}

console.log(`Seeded ${people.length} users, ${requests.length} requests, ${reports.length} sick/reserve reports and ${pettyCash.length} petty cash requests into the LOCAL emulator.`);
console.log('Log in at http://localhost:3000 with e.g. manager@test.local (password in scripts/seed-emulator.mjs).');
process.exit(0);
