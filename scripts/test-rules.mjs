// Verifies the Firestore security rules against the LOCAL emulator.
// Each check mimics exactly what the site writes (or an abuse attempt that must be blocked).
// Usage (emulators running + seeded): node scripts/test-rules.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  collection, query, where, Bytes, Timestamp, arrayUnion, increment,
} from 'firebase/firestore';

const PASSWORD = 'Test1234!';
let appCount = 0;

async function as(email, { register = false } = {}) {
  const app = initializeApp({ projectId: 'demo-worklog', apiKey: 'demo-api-key' }, `u${appCount++}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const signIn = register ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
  const cred = await signIn(auth, email, PASSWORD);
  return { db, uid: cred.user.uid };
}

let failures = 0;
async function expect(label, shouldSucceed, fn) {
  let ok;
  try { await fn(); ok = true; } catch { ok = false; }
  const pass = ok === shouldSucceed;
  if (!pass) failures++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}  (${ok ? 'allowed' : 'denied'})`);
}
const section = (title) => console.log(`\n--- ${title} ---`);

const dana = await as('dana@test.local');
const avi = await as('avi@test.local');
const manager = await as('manager@test.local');
const office = await as('office@test.local');
const now = () => Timestamp.now();
const day = (offset) => Timestamp.fromDate(new Date(Date.now() + offset * 86400000));
let n = 0;
const newId = (prefix) => `${prefix}-${Date.now()}-${n++}`;

// Same fields as createRequest() in firebaseUtils.ts
const shiftRequest = (uid, id, extra = {}) => ({
  id, type: 'extra_shift', employeeId: uid, managerId: manager.uid, startDate: day(5), projectName: 'Test',
  status: 'pending', createdAt: now(), updatedAt: now(), ...extra,
});
// Same fields as createReport() in reports.ts
const sickReport = (uid, id, extra = {}) => ({
  id, type: 'sick', employeeId: uid, managerId: manager.uid, startDate: day(-2), endDate: day(-1),
  status: 'submitted', attachmentCount: 0, createdAt: now(), updatedAt: now(), ...extra,
});
const fileDoc = (ownerId, requestId, id, bytes = 1000) => ({
  id, ownerId, requestId, fileName: 'אישור מחלה.pdf', contentType: 'application/pdf',
  size: bytes, data: Bytes.fromUint8Array(new Uint8Array(bytes)), createdAt: now(),
});
const R = (db, id) => doc(db, 'requests', id);
const A = (db, id) => doc(db, 'attachments', id);

// ======================================================================
section('Vacation / extra shift requests');
const shift = newId('shift');
await expect('Employee submits an extra shift (pending)', true, () => setDoc(R(dana.db, shift), shiftRequest(dana.uid, shift)));
await expect('Office worker submits her own extra shift', true, async () => { const id = newId('shift'); await setDoc(R(office.db, id), shiftRequest(office.uid, id)); });
const pre = newId('shift');
await expect('Employee submits an already-approved shift', false, () => setDoc(R(dana.db, pre), shiftRequest(dana.uid, pre, { status: 'approved' })));
const other = newId('shift');
await expect('Employee submits a request in someone else\'s name', false, () => setDoc(R(dana.db, other), shiftRequest(avi.uid, other)));
await expect('Employee approves her own request', false, () => updateDoc(R(dana.db, shift), { status: 'approved', updatedAt: now() }));
await expect('Employee changes the date of her pending request', false, () => updateDoc(R(dana.db, shift), { startDate: day(9) }));
await expect('Another employee cancels her request', false, () => updateDoc(R(avi.db, shift), { status: 'cancelled', updatedAt: now() }));
await expect('Employee deletes her request', false, () => deleteDoc(R(dana.db, shift)));
await expect('Manager approves the request', true, () => updateDoc(R(manager.db, shift), { status: 'approved', updatedAt: now(), approvedBy: manager.uid }));
await expect('Employee cancels her approved request (existing feature)', true, () => updateDoc(R(dana.db, shift), { status: 'cancelled', updatedAt: now() }));
const shift2 = newId('shift');
await setDoc(R(dana.db, shift2), shiftRequest(dana.uid, shift2));
await expect('Employee cancels her pending request', true, () => updateDoc(R(dana.db, shift2), { status: 'cancelled', updatedAt: now() }));
const shift3 = newId('shift');
await setDoc(R(dana.db, shift3), shiftRequest(dana.uid, shift3));
await expect('Manager rejects a request', true, () => updateDoc(R(manager.db, shift3), { status: 'rejected', updatedAt: now() }));

// ======================================================================
section('Sick / reserve reports');
const report = newId('report');
await expect('Employee submits a sick report', true, () => setDoc(R(dana.db, report), sickReport(dana.uid, report)));
const badReport = newId('report');
await expect('Employee submits a report already marked handled', false, () => setDoc(R(dana.db, badReport), sickReport(dana.uid, badReport, { status: 'handled' })));
await expect('Employee edits dates of her open report', true, () => updateDoc(R(dana.db, report), { startDate: day(-3), endDate: day(-1), updatedAt: now() }));
await expect('Employee marks her own report handled', false, () => updateDoc(R(dana.db, report), { status: 'handled', updatedAt: now() }));
await expect('Employee changes report type', false, () => updateDoc(R(dana.db, report), { type: 'reserve', updatedAt: now() }));

// ======================================================================
section('Attachments');
const f1 = newId('file');
await expect('Employee uploads a file to her open report', true, async () => {
  await setDoc(A(dana.db, f1), fileDoc(dana.uid, report, f1));
  await updateDoc(R(dana.db, report), { attachmentCount: increment(1), updatedAt: now() });
});
const aviReport = newId('report');
await setDoc(R(avi.db, aviReport), sickReport(avi.uid, aviReport));
await expect('Employee uploads a file to someone else\'s report', false, async () => { const id = newId('file'); await setDoc(A(dana.db, id), fileDoc(dana.uid, aviReport, id)); });
await expect('Employee uploads a file in someone else\'s name', false, async () => { const id = newId('file'); await setDoc(A(dana.db, id), fileDoc(avi.uid, report, id)); });
await expect('Upload larger than 1MB', false, async () => { const id = newId('file'); await setDoc(A(dana.db, id), fileDoc(dana.uid, report, id, 1_000_001)); });
await expect('Employee reads her own file', true, () => getDoc(A(dana.db, f1)));
await expect('Employee lists her own files', true, () => getDocs(query(collection(dana.db, 'attachments'), where('requestId', '==', report), where('ownerId', '==', dana.uid))));
await expect('Another employee reads her file', false, () => getDoc(A(avi.db, f1)));
await expect('Manager reads her file', false, () => getDoc(A(manager.db, f1)));
await expect('Manager lists files of a request', false, () => getDocs(query(collection(manager.db, 'attachments'), where('requestId', '==', report))));
await expect('Office reads her file', true, () => getDoc(A(office.db, f1)));
await expect('Office lists files of a request', true, () => getDocs(query(collection(office.db, 'attachments'), where('requestId', '==', report))));
await expect('Anyone edits an existing file', false, () => updateDoc(A(dana.db, f1), { fileName: 'changed.pdf' }));
await expect('Another employee deletes her file', false, () => deleteDoc(A(avi.db, f1)));
const f2 = newId('file');
await setDoc(A(dana.db, f2), fileDoc(dana.uid, report, f2));
await expect('Employee deletes a file from her open report', true, async () => {
  await deleteDoc(A(dana.db, f2));
  await updateDoc(R(dana.db, report), { attachmentCount: increment(-1), updatedAt: now() });
});

// ======================================================================
section('Office handles the report - it is locked for the employee');
await expect('Office marks the report handled', true, () => updateDoc(R(office.db, report), { status: 'handled', handledBy: office.uid, updatedAt: now() }));
await expect('Employee edits dates after it was handled', false, () => updateDoc(R(dana.db, report), { startDate: day(-4), updatedAt: now() }));
await expect('Employee cancels after it was handled', false, () => updateDoc(R(dana.db, report), { status: 'cancelled', updatedAt: now() }));
await expect('Employee uploads a file after it was handled', false, async () => { const id = newId('file'); await setDoc(A(dana.db, id), fileDoc(dana.uid, report, id)); });
await expect('Employee deletes a file after it was handled', false, () => deleteDoc(A(dana.db, f1)));
await expect('Office reopens the report', true, () => updateDoc(R(office.db, report), { status: 'submitted', handledBy: null, updatedAt: now() }));
await expect('Employee cancels her open report', true, () => updateDoc(R(dana.db, report), { status: 'cancelled', updatedAt: now() }));
await expect('Office deletes a file', true, () => deleteDoc(A(office.db, f1)));

// ======================================================================
section('Petty cash');
// Same fields as createReport() for petty cash
const pettyCash = (uid, id, extra = {}) => ({
  id, type: 'petty_cash', employeeId: uid, managerId: '', startDate: day(-1), description: 'Parking',
  totalAmount: 0, status: 'submitted', attachmentCount: 0, createdAt: now(), updatedAt: now(), ...extra,
});
const pc = newId('petty');
await expect('Employee submits a petty cash request', true, () => setDoc(R(dana.db, pc), pettyCash(dana.uid, pc)));
const pcBad = newId('petty');
await expect('Employee submits petty cash with a pre-filled total', false, () => setDoc(R(dana.db, pcBad), pettyCash(dana.uid, pcBad, { totalAmount: 5000 })));
const r1 = newId('receipt');
await expect('Employee adds a receipt with its amount', true, async () => {
  await setDoc(A(dana.db, r1), { ...fileDoc(dana.uid, pc, r1), fileName: 'receipt.jpg', contentType: 'image/jpeg', amount: 125.5 });
  await updateDoc(R(dana.db, pc), { attachmentCount: increment(1), totalAmount: increment(125.5), updatedAt: now() });
});
await expect('Employee changes the description after submitting', false, () => updateDoc(R(dana.db, pc), { description: 'Other', updatedAt: now() }));
await expect('Employee marks her own petty cash as paid', false, () => updateDoc(R(dana.db, pc), { status: 'paid', updatedAt: now() }));
await expect('Manager reads the receipt', false, () => getDoc(A(manager.db, r1)));
await expect('Office reads the receipt', true, () => getDoc(A(office.db, r1)));
await expect('Office marks petty cash as paid', true, () => updateDoc(R(office.db, pc), { status: 'paid', handledBy: office.uid, updatedAt: now() }));
await expect('Employee adds a receipt after it was paid', false, async () => { const id = newId('receipt'); await setDoc(A(dana.db, id), { ...fileDoc(dana.uid, pc, id), amount: 10 }); });
await expect('Employee changes the total after it was paid', false, () => updateDoc(R(dana.db, pc), { totalAmount: increment(100), updatedAt: now() }));
await expect('Employee cancels after it was paid', false, () => updateDoc(R(dana.db, pc), { status: 'cancelled', updatedAt: now() }));

// ======================================================================
section('Notifications');
const nId = newId('notif');
const N = (db) => doc(db, 'notifications', nId);
await expect('Employee sends a notification to the manager', true, () => setDoc(N(dana.db), {
  id: nId, userId: manager.uid, title: 'New request', message: 'x', read: false, createdAt: now(),
  kind: 'request_submitted', params: { type: 'vacation', employeeName: 'Dana', date: '1.10.2026' },
}));
await expect("Employee reads the manager's notification", false, () => getDoc(N(dana.db)));
await expect("Employee marks the manager's notification as read", false, () => updateDoc(N(dana.db), { read: true }));
await expect("Employee deletes the manager's notification", false, () => deleteDoc(N(dana.db)));
await expect('Manager reads his notification', true, () => getDoc(N(manager.db)));
await expect('Manager lists his notifications (bell)', true, () => getDocs(query(collection(manager.db, 'notifications'), where('userId', '==', manager.uid))));
await expect('Manager changes the text of his notification', false, () => updateDoc(N(manager.db), { message: 'changed' }));
await expect('Manager marks his notification as read', true, () => updateDoc(N(manager.db), { read: true }));

// ======================================================================
section('Users - nobody may change their own roles');
const danaRef = (db) => doc(db, 'users', dana.uid);
await expect('Employee gives herself the office role', false, () => updateDoc(danaRef(dana.db), { roles: arrayUnion('office') }));
await expect('Employee replaces her roles with manager', false, () => updateDoc(danaRef(dana.db), { roles: ['manager'] }));
await expect('Employee updates her own phone (profile page)', true, () => updateDoc(danaRef(dana.db), { phoneNumber: '050-9999999' }));
await expect('Employee updates another employee', false, () => updateDoc(doc(dana.db, 'users', avi.uid), { phoneNumber: '1' }));
await expect('Manager gives himself the office role', false, () => updateDoc(doc(manager.db, 'users', manager.uid), { roles: arrayUnion('office') }));
await expect("Office changes an employee's roles", true, () => updateDoc(danaRef(office.db), { roles: ['employee', 'manager'] }));
await updateDoc(danaRef(office.db), { roles: ['employee'] });

const newbie = await as(`new-${Date.now()}@test.local`, { register: true });
const newUserDoc = (roles) => ({ id: newbie.uid, displayName: 'New', email: 'n@test.local', photoURL: null, roles });
await expect('New registration creates itself as office', false, () => setDoc(doc(newbie.db, 'users', newbie.uid), newUserDoc(['office'])));
await expect('New registration creates itself as employee', true, () => setDoc(doc(newbie.db, 'users', newbie.uid), newUserDoc(['employee'])));

// ======================================================================
section('Vacation quotas - set by the office, each employee sees only their own');
const Q = (db, uid, year = 2026) => doc(db, 'vacationQuotas', `${uid}_${year}`);
const quota = (uid, days, year = 2026) => ({ userId: uid, year, days, updatedAt: now(), updatedBy: office.uid });
await expect('Office sets a quota for an employee', true, () => setDoc(Q(office.db, dana.uid), quota(dana.uid, 18)));
await expect('Office changes the quota', true, () => setDoc(Q(office.db, dana.uid), quota(dana.uid, 20.5)));
await expect('Employee reads her own quota', true, () => getDoc(Q(dana.db, dana.uid)));
await expect('Employee reads her own quota that was never set', true, () => getDoc(Q(dana.db, dana.uid, 2030)));
await expect("Employee reads another employee's quota", false, () => getDoc(Q(avi.db, dana.uid)));
await expect('Employee lists all quotas', false, () => getDocs(collection(avi.db, 'vacationQuotas')));
await expect('Employee raises her own quota', false, () => setDoc(Q(dana.db, dana.uid), quota(dana.uid, 99)));
await expect('Employee deletes her own quota', false, () => deleteDoc(Q(dana.db, dana.uid)));
await expect('Manager reads a quota', true, () => getDoc(Q(manager.db, dana.uid)));
await expect('Manager sets a quota', false, () => setDoc(Q(manager.db, avi.uid), quota(avi.uid, 30)));
await expect('Office lists the quotas of a year', true, () => getDocs(query(collection(office.db, 'vacationQuotas'), where('year', '==', 2026))));
await expect('Office saves a quota under the wrong id', false, () => setDoc(Q(office.db, avi.uid), quota(dana.uid, 10)));
await expect('Office saves a negative quota', false, () => setDoc(Q(office.db, avi.uid), quota(avi.uid, -1)));
await expect('Office saves a quota with extra fields', false, () => setDoc(Q(office.db, avi.uid), { ...quota(avi.uid, 10), roles: ['office'] }));
await expect('Office removes a quota', true, () => deleteDoc(Q(office.db, dana.uid)));

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
