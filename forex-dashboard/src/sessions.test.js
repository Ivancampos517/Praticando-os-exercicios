import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSessionOpen,
  minutesUntilNextTransition,
  getLocalMinutesInTimeZone,
  getFxSessionsStatus,
  getExchangesStatus,
} from './sessions.js';

test('isSessionOpen: true when inside a non-wrapping window', () => {
  // London-style window: 08:00-17:00 UTC, checking 09:00 UTC (540 min)
  assert.equal(isSessionOpen(8 * 60, 17 * 60, 9 * 60), true);
});

test('isSessionOpen: false when before a non-wrapping window', () => {
  assert.equal(isSessionOpen(8 * 60, 17 * 60, 7 * 60), false);
});

test('isSessionOpen: false when at/after a non-wrapping window close (exclusive end)', () => {
  assert.equal(isSessionOpen(8 * 60, 17 * 60, 17 * 60), false);
});

test('isSessionOpen: true when inside a midnight-wrapping window, after midnight', () => {
  // Sydney-style window: 22:00-07:00 UTC, checking 05:00 UTC (300 min)
  assert.equal(isSessionOpen(22 * 60, 7 * 60, 5 * 60), true);
});

test('isSessionOpen: true when inside a midnight-wrapping window, before midnight', () => {
  // Sydney-style window: 22:00-07:00 UTC, checking 23:00 UTC (1380 min)
  assert.equal(isSessionOpen(22 * 60, 7 * 60, 23 * 60), true);
});

test('isSessionOpen: false when outside a midnight-wrapping window', () => {
  // Sydney-style window: 22:00-07:00 UTC, checking 10:00 UTC (600 min)
  assert.equal(isSessionOpen(22 * 60, 7 * 60, 10 * 60), false);
});

test('minutesUntilNextTransition: while open, counts down to close', () => {
  // 08:00-17:00 UTC, now 09:00 -> 8h to close
  assert.equal(minutesUntilNextTransition(8 * 60, 17 * 60, 9 * 60), 8 * 60);
});

test('minutesUntilNextTransition: while closed same-day, counts down to open', () => {
  // 08:00-17:00 UTC, now 07:00 -> 1h to open
  assert.equal(minutesUntilNextTransition(8 * 60, 17 * 60, 7 * 60), 60);
});

test('minutesUntilNextTransition: while closed after close, wraps to next day open', () => {
  // 08:00-17:00 UTC, now 18:00 -> 14h to tomorrow's open
  assert.equal(minutesUntilNextTransition(8 * 60, 17 * 60, 18 * 60), 14 * 60);
});

test('minutesUntilNextTransition: midnight-wrapping session open, counts down to close next day', () => {
  // 22:00-07:00 UTC, now 23:00 -> 8h to close
  assert.equal(minutesUntilNextTransition(22 * 60, 7 * 60, 23 * 60), 8 * 60);
});

test('getLocalMinutesInTimeZone: converts a UTC instant to minutes-since-midnight in a target timezone', () => {
  const utcNoon = new Date('2026-08-28T12:00:00Z');
  // Tokyo is UTC+9 with no DST: 12:00 UTC -> 21:00 local = 1260 minutes
  assert.equal(getLocalMinutesInTimeZone(utcNoon, 'Asia/Tokyo'), 21 * 60);
});

test('getFxSessionsStatus: reports London open and New York closed at 09:00 UTC', () => {
  const nineAmUtc = new Date('2026-08-28T09:00:00Z');
  const statuses = getFxSessionsStatus(nineAmUtc);
  const london = statuses.find((s) => s.name === 'London');
  const newYork = statuses.find((s) => s.name === 'New York');
  assert.equal(london.isOpen, true);
  assert.equal(newYork.isOpen, false);
  assert.equal(typeof london.minutesToNextTransition, 'number');
});

test('getExchangesStatus: reports NYSE closed at 09:00 UTC (04:00/05:00 local, before market open)', () => {
  const nineAmUtc = new Date('2026-08-28T09:00:00Z');
  const statuses = getExchangesStatus(nineAmUtc);
  const nyse = statuses.find((s) => s.name === 'NYSE');
  assert.equal(nyse.isOpen, false);
});
