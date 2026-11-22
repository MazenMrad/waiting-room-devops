import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVG_SERVICE_SECONDS,
  canServe,
  estimateWaitMinutes,
  isHealthyResponse,
  nextTicketNumber,
  ticketCode,
} from '../src/lib/queue.js';

test('ticketCode pads the number to three digits', () => {
  assert.equal(ticketCode(1), 'A001');
  assert.equal(ticketCode(42), 'A042');
  assert.equal(ticketCode(1234), 'A1234');
});

test('estimateWaitMinutes rounds up from the average service time', () => {
  assert.equal(estimateWaitMinutes(0), 0);
  assert.equal(estimateWaitMinutes(1), 2);
  assert.equal(estimateWaitMinutes(3), 6);
  assert.equal(estimateWaitMinutes(2, 60), 2);
});

test('estimateWaitMinutes rejects invalid positions', () => {
  assert.equal(estimateWaitMinutes(-1), 0);
  assert.equal(estimateWaitMinutes(1.5), 0);
  assert.equal(estimateWaitMinutes(undefined), 0);
});

test('nextTicketNumber reads the highest existing code', () => {
  assert.equal(nextTicketNumber([]), 1);
  assert.equal(nextTicketNumber([{ code: 'A001' }, { code: 'A007' }]), 8);
  assert.equal(nextTicketNumber([{ code: 'bad' }]), 1);
});

test('canServe only accepts waiting tickets', () => {
  assert.equal(canServe('waiting'), true);
  assert.equal(canServe('served'), false);
  assert.equal(canServe('cancelled'), false);
});

test('isHealthyResponse requires ok status and ok database', () => {
  assert.equal(isHealthyResponse({ status: 'ok', db: 'ok' }), true);
  assert.equal(isHealthyResponse({ status: 'ok', db: 'down' }), false);
  assert.equal(isHealthyResponse(null), false);
});

test('average service time is two minutes', () => {
  assert.equal(AVG_SERVICE_SECONDS, 120);
});
