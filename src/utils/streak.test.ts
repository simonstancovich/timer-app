import { computeStreak } from './streak';

const wed = new Date('2026-04-15T10:00:00Z');

describe('computeStreak', () => {
  it('returns 0 when no sessions exist', () => {
    expect(computeStreak([], wed)).toBe(0);
  });

  it('returns 0 when today is a weekday but has no session and yesterday had none either', () => {
    expect(computeStreak(['2026-04-10T10:00:00Z'], wed)).toBe(0);
  });

  it('counts a single weekday session today', () => {
    expect(computeStreak(['2026-04-15T09:00:00Z'], wed)).toBe(1);
  });

  it('counts consecutive weekdays', () => {
    const sessions = [
      '2026-04-15T09:00:00Z',
      '2026-04-14T09:00:00Z',
      '2026-04-13T09:00:00Z',
    ];
    expect(computeStreak(sessions, wed)).toBe(3);
  });

  it('skips the preceding weekend without breaking the streak', () => {
    const mon = new Date('2026-04-13T10:00:00Z');
    const sessions = [
      '2026-04-13T09:00:00Z',
      '2026-04-10T09:00:00Z',
      '2026-04-09T09:00:00Z',
    ];
    expect(computeStreak(sessions, mon)).toBe(3);
  });

  it('breaks on a missed weekday even if a weekend follows', () => {
    const mon = new Date('2026-04-13T10:00:00Z');
    const sessions = [
      '2026-04-13T09:00:00Z',
      '2026-04-09T09:00:00Z',
    ];
    expect(computeStreak(sessions, mon)).toBe(1);
  });

  it('walks past a weekend when computing from a Sunday', () => {
    const sun = new Date('2026-04-12T10:00:00Z');
    const sessions = ['2026-04-10T09:00:00Z', '2026-04-09T09:00:00Z'];
    expect(computeStreak(sessions, sun)).toBe(2);
  });

  it('deduplicates multiple sessions on the same day', () => {
    const sessions = [
      '2026-04-15T09:00:00Z',
      '2026-04-15T14:00:00Z',
      '2026-04-14T09:00:00Z',
    ];
    expect(computeStreak(sessions, wed)).toBe(2);
  });
});
