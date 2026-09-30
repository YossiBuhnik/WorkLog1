// Workday calculation shared by the office reports and documents pages.
// Workdays are Sunday-Thursday, excluding holidays and their eves.

const jewishHolidays: { [year: number]: string[] } = {
  2024: [
    '2024-04-23', '2024-04-24', '2024-04-29', '2024-04-30', '2024-06-12',
    '2024-10-03', '2024-10-04', '2024-10-12', '2024-10-17', '2024-10-18',
    '2024-10-24', '2024-10-25',
  ],
  2025: [
    '2025-04-13', '2025-04-14', '2025-04-19', '2025-04-20', '2025-06-02',
    '2025-09-23', '2025-09-24', '2025-10-02', '2025-10-07', '2025-10-08',
    '2025-10-14', '2025-10-15',
  ],
  // Israeli holidays (eves are added automatically below).
  // Next update due for 2028-2029 (reminder set for end of 2027).
  2026: [
    '2026-04-02', '2026-04-08', '2026-05-22',
    '2026-09-12', '2026-09-13', '2026-09-21', '2026-09-26', '2026-10-03',
  ],
  2027: [
    '2027-04-22', '2027-04-28', '2027-06-11',
    '2027-10-02', '2027-10-03', '2027-10-11', '2027-10-16', '2027-10-23',
  ],
};

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const holidaysWithEves: { [year: string]: string[] } = (() => {
  const holidaysByYear = JSON.parse(JSON.stringify(jewishHolidays));
  for (const year in holidaysByYear) {
    const eves = new Set<string>();
    holidaysByYear[year].forEach((holidayStr: string) => {
      const [y, m, d] = holidayStr.split('-').map(Number);
      const holidayUTC = new Date(Date.UTC(y, m - 1, d));
      holidayUTC.setUTCDate(holidayUTC.getUTCDate() - 1);
      const eveStr = holidayUTC.toISOString().slice(0, 10);
      eves.add(eveStr);
    });
    const originalHolidays = new Set(holidaysByYear[year]);
    const combinedHolidays = new Set([...Array.from(originalHolidays), ...Array.from(eves)]);
    holidaysByYear[year] = Array.from(combinedHolidays);
  }
  return holidaysByYear;
})();

const isWorkday = (date: Date, holidays: string[]): boolean => {
  const day = date.getDay();
  if (day > 4) return false;
  const dateStr = toLocalDateString(date);
  return !holidays.includes(dateStr);
};

/** Counts workdays between start and end (inclusive), optionally only inside `filter`. */
export const countWorkdays = (
  start: Date,
  end: Date,
  filter?: { start: Date; end: Date }
): number => {
  let count = 0;
  let current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const inclusiveEnd = new Date(end);
  inclusiveEnd.setHours(23, 59, 59, 999);

  while (current <= inclusiveEnd) {
    const year = current.getFullYear();
    const holidaysForYear = holidaysWithEves[year] || [];
    const isInFilter = filter
      ? current >= filter.start && current <= filter.end
      : true;

    if (isInFilter && isWorkday(current, holidaysForYear)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/** Counts calendar days between start and end (inclusive), optionally only inside `filter`. */
export const countCalendarDays = (
  start: Date,
  end: Date,
  filter?: { start: Date; end: Date }
): number => {
  const from = new Date(start);
  from.setHours(0, 0, 0, 0);
  const to = new Date(end);
  to.setHours(0, 0, 0, 0);
  if (filter) {
    const fStart = new Date(filter.start);
    fStart.setHours(0, 0, 0, 0);
    const fEnd = new Date(filter.end);
    fEnd.setHours(0, 0, 0, 0);
    if (from < fStart) from.setTime(fStart.getTime());
    if (to > fEnd) to.setTime(fEnd.getTime());
  }
  if (to < from) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
};
