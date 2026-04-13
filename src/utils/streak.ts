const isoDay = (d: Date): string => d.toISOString().slice(0, 10);

const isWeekend = (d: Date): boolean => {
  const day = d.getDay();
  return day === 0 || day === 6;
};

const prevDay = (d: Date): Date => {
  const next = new Date(d);
  next.setDate(d.getDate() - 1);
  return next;
};

export const computeStreak = (sessionStartIsoDates: string[], now: Date = new Date()): number => {
  const daysWithSessions = new Set(sessionStartIsoDates.map((s) => s.slice(0, 10)));
  let streak = 0;
  let cursor = new Date(now);

  while (true) {
    if (isWeekend(cursor)) {
      cursor = prevDay(cursor);
      continue;
    }
    if (daysWithSessions.has(isoDay(cursor))) {
      streak += 1;
      cursor = prevDay(cursor);
    } else {
      return streak;
    }
  }
};
