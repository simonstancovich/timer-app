import { formatGoal, formatHoursMinutes } from './time';

describe('formatHoursMinutes', () => {
  it('returns 0:00 for zero minutes', () => {
    expect(formatHoursMinutes(0)).toBe('0:00');
  });
  it('pads single-digit minutes', () => {
    expect(formatHoursMinutes(5)).toBe('0:05');
    expect(formatHoursMinutes(65)).toBe('1:05');
  });
  it('formats hours and minutes', () => {
    expect(formatHoursMinutes(135)).toBe('2:15');
  });
  it('handles values past 24 hours', () => {
    expect(formatHoursMinutes(60 * 30 + 7)).toBe('30:07');
  });
  it('floors fractional minutes', () => {
    expect(formatHoursMinutes(10.9)).toBe('0:10');
  });
  it('clamps negatives to 0:00', () => {
    expect(formatHoursMinutes(-15)).toBe('0:00');
  });
});

describe('formatGoal', () => {
  it('renders whole hours', () => {
    expect(formatGoal(540)).toBe('9h goal');
  });
  it('floors partial hours', () => {
    expect(formatGoal(125)).toBe('2h goal');
  });
  it('clamps negatives to 0h', () => {
    expect(formatGoal(-30)).toBe('0h goal');
  });
});
