export const formatHoursMinutes = (minutes: number): string => {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

export const formatGoal = (minutes: number): string => {
  const h = Math.max(0, Math.floor(minutes / 60));
  return `${h}h goal`;
};
