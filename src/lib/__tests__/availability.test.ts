import { describe, it, expect } from 'vitest';
import {
  generateSlots,
  isOverlapping,
  availableSlots,
  getDaySlots,
  findAvailability,
  getStaffAvailability,
  dayOfWeekFromDate,
} from '../availability';

const MONDAY = '2026-08-17';
const TUESDAY = '2026-08-18';
const SUNDAY = '2026-08-23';

const schedule = (dayOfWeek: number, startTime: string, endTime: string, extra: Partial<{ breakStart: string | null; breakEnd: string | null; active: boolean }> = {}) => ({
  dayOfWeek,
  startTime,
  endTime,
  ...extra,
});

const bk = (startTime: string, endTime: string, status?: string) => ({ startTime, endTime, status });

describe('dayOfWeekFromDate', () => {
  it('maps YYYY-MM-DD to 0=Sunday..6=Saturday', () => {
    expect(dayOfWeekFromDate(MONDAY)).toBe(1);
    expect(dayOfWeekFromDate(SUNDAY)).toBe(0);
  });
});

describe('generateSlots', () => {
  it('generates exact slot list for a plain 09:00-17:00 day with 60min service on 30min step', () => {
    expect(generateSlots('09:00', '17:00', 60)).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    ]);
  });

  it('includes a slot that ends exactly at dayEnd', () => {
    expect(generateSlots('08:00', '10:00', 120)).toEqual(['08:00']);
  });

  it('aligns slot starts to the step grid, even when dayStart is off-grid', () => {
    expect(generateSlots('09:15', '12:00', 30)).toEqual(['09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('supports a configurable 15min step', () => {
    expect(generateSlots('09:00', '09:45', 15, 15)).toEqual(['09:00', '09:15', '09:30']);
  });

  it('handles a 24:00 end time', () => {
    const slots = generateSlots('09:00', '24:00', 30);
    expect(slots.length).toBe(30);
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('23:30');
  });

  it('returns no slots when the service does not fit before dayEnd', () => {
    expect(generateSlots('09:00', '09:00', 30)).toEqual([]);
  });
});

describe('isOverlapping', () => {
  it('treats adjacent half-open intervals as NOT overlapping', () => {
    expect(isOverlapping('10:00', '11:00', '11:00', '12:00')).toBe(false);
  });

  it('detects partial overlap', () => {
    expect(isOverlapping('10:00', '11:30', '11:00', '12:00')).toBe(true);
  });

  it('detects containment', () => {
    expect(isOverlapping('10:30', '10:45', '10:00', '11:00')).toBe(true);
    expect(isOverlapping('10:00', '11:00', '10:30', '10:45')).toBe(true);
  });

  it('detects identical intervals', () => {
    expect(isOverlapping('10:00', '11:00', '10:00', '11:00')).toBe(true);
  });
});

describe('availableSlots', () => {
  it('excludes slots overlapping a booking but keeps the slot ending exactly at booking start', () => {
    const slots = availableSlots('09:00', '17:00', 60, [{ start: '11:00', end: '12:00' }]);
    expect(slots).not.toContain('10:30');
    expect(slots).not.toContain('11:00');
    expect(slots).not.toContain('11:30');
    expect(slots).toContain('10:00');
    expect(slots[0]).toBe('09:00');
  });
});

describe('getDaySlots', () => {
  it('returns [] when there is no schedule for the staff on that date', () => {
    expect(getDaySlots({ date: MONDAY, schedule: null, serviceMinutes: 30 })).toEqual([]);
    expect(getDaySlots({ date: MONDAY, schedule: schedule(2, '09:00', '17:00'), serviceMinutes: 30 })).toEqual([]);
  });

  it('excludes the whole break window', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '17:00', { breakStart: '12:00', breakEnd: '13:00' }),
      serviceMinutes: 30,
    });
    expect(slots).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ]);
  });

  it('allows a slot ending exactly at break start and starting exactly at break end', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '12:00', { breakStart: '10:00', breakEnd: '10:30' }),
      serviceMinutes: 30,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:30', '11:00', '11:30']);
  });

  it('does NOT block slots on CANCELLED or COMPLETED bookings', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '12:00'),
      bookings: [bk('10:00', '10:30', 'CANCELLED'), bk('11:00', '11:30', 'COMPLETED')],
      serviceMinutes: 30,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('blocks slots on PENDING and CONFIRMED bookings', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '12:00'),
      bookings: [bk('10:00', '10:30', 'PENDING'), bk('11:00', '11:30', 'CONFIRMED')],
      serviceMinutes: 30,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:30', '11:30']);
  });

  it('requires the full service duration to fit before the next booking starts (no partial fit)', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '13:00'),
      bookings: [bk('11:00', '12:00')],
      serviceMinutes: 60,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00', '12:00']);
  });

  it('requires the full service duration to fit before schedule end', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '12:00'),
      serviceMinutes: 60,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('supports non-30min service durations on the 30min grid', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '13:00'),
      serviceMinutes: 90,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('treats a booking that starts before the schedule window as blocking early slots', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '17:00'),
      bookings: [bk('08:00', '09:30')],
      serviceMinutes: 30,
    });
    expect(slots[0]).toBe('09:30');
    expect(slots).not.toContain('09:00');
  });

  it('unions multiple schedules for the same staff/day', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: [schedule(1, '09:00', '12:00'), schedule(1, '13:00', '17:00')],
      serviceMinutes: 30,
    });
    expect(slots).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ]);
  });

  it('honours schedule.active=false as no availability', () => {
    expect(getDaySlots({ date: MONDAY, schedule: schedule(1, '09:00', '17:00', { active: false }), serviceMinutes: 30 })).toEqual([]);
  });

  it('treats null breakStart/breakEnd as no break', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '12:00', { breakStart: null, breakEnd: null }),
      serviceMinutes: 30,
    });
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
    const mixed = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '12:00', { breakStart: null, breakEnd: '10:30' }),
      serviceMinutes: 30,
    });
    expect(mixed).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('uses a configurable stepMinutes', () => {
    const slots = getDaySlots({
      date: MONDAY,
      schedule: schedule(1, '09:00', '10:30'),
      bookings: [bk('09:00', '09:30')],
      serviceMinutes: 30,
      stepMinutes: 15,
    });
    expect(slots).toEqual(['09:30', '09:45', '10:00']);
  });
});

describe('findAvailability', () => {
  const weekSchedules = [0, 1, 2, 3, 4, 5, 6].map((dow) => schedule(dow, '09:00', '10:00'));

  it('skips a fully-booked day and returns the next available dates', () => {
    const dates = findAvailability({
      dateRangeStart: MONDAY,
      dateRangeEnd: SUNDAY,
      staffSchedules: weekSchedules,
      bookingsByDate: { [MONDAY]: [bk('09:00', '09:30'), bk('09:30', '10:00')] },
      serviceMinutes: 30,
    });
    expect(dates).toEqual([
      TUESDAY, '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', SUNDAY,
    ]);
  });

  it('respects the limit', () => {
    const dates = findAvailability({
      dateRangeStart: MONDAY,
      dateRangeEnd: SUNDAY,
      staffSchedules: weekSchedules,
      serviceMinutes: 30,
      limit: 2,
    });
    expect(dates).toEqual([MONDAY, TUESDAY]);
  });

  it('returns [] when there is no availability at all', () => {
    const dates = findAvailability({
      dateRangeStart: MONDAY,
      dateRangeEnd: SUNDAY,
      staffSchedules: [],
      serviceMinutes: 30,
    });
    expect(dates).toEqual([]);
  });
});

describe('getStaffAvailability', () => {
  it('returns per-date slot lists for one staff over a range', () => {
    const result = getStaffAvailability({
      staffId: 'staff-1',
      serviceId: 'svc-1',
      dateRangeStart: MONDAY,
      dateRangeEnd: TUESDAY,
      staffSchedules: [schedule(1, '09:00', '10:00')],
      serviceMinutes: 30,
    });
    expect(result).toEqual([
      { staffId: 'staff-1', serviceId: 'svc-1', date: MONDAY, slots: ['09:00', '09:30'] },
    ]);
  });
});
