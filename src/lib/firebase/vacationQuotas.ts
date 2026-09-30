// Yearly vacation quota per employee (days available that year, including carry-over).
// Set by the office; the employee sees "X days left" on their home page.
// Stored in its own collection (not on the user document) because employees may edit their own user document.
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import { Request } from '../types';
import { countWorkdays } from '../workdays';

const quotaId = (userId: string, year: number) => `${userId}_${year}`;

/** The employee's quota for the year, or null when the office has not set one. */
export const getVacationQuota = async (userId: string, year: number): Promise<number | null> => {
  const snap = await getDoc(doc(db, 'vacationQuotas', quotaId(userId, year)));
  return snap.exists() ? (snap.data().days as number) : null;
};

/** All quotas of a year (office / manager), as userId -> days. */
export const getVacationQuotasForYear = async (year: number): Promise<Map<string, number>> => {
  const snap = await getDocs(query(collection(db, 'vacationQuotas'), where('year', '==', year)));
  return new Map(snap.docs.map((d) => [d.data().userId as string, d.data().days as number]));
};

/** Sets (or, with null, removes) an employee's quota for the year. Office only. */
export const setVacationQuota = async (userId: string, year: number, days: number | null, officeUserId: string) => {
  const ref = doc(db, 'vacationQuotas', quotaId(userId, year));
  if (days === null) {
    await deleteDoc(ref);
    return;
  }
  await setDoc(ref, { userId, year, days, updatedAt: Timestamp.now(), updatedBy: officeUserId });
};

/** Approved vacation workdays that fall inside the year (same count as the office reports). */
export const usedVacationDays = (requests: Request[], employeeId: string, year: number) => {
  const range = { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
  return requests
    .filter((r) => r.employeeId === employeeId && r.type === 'vacation' && r.status === 'approved')
    .reduce((sum, r) => sum + countWorkdays(r.startDate.toDate(), (r.endDate || r.startDate).toDate(), range), 0);
};
