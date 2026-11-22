export const AVG_SERVICE_SECONDS = 120;

export function ticketCode(number) {
  return `A${String(number).padStart(3, '0')}`;
}

export function estimateWaitMinutes(position, averageServiceSeconds = AVG_SERVICE_SECONDS) {
  if (!Number.isInteger(position) || position < 1) return 0;
  return Math.max(1, Math.ceil((position * averageServiceSeconds) / 60));
}

export function nextTicketNumber(rows) {
  const max = rows.reduce((highest, row) => {
    const value = Number(String(row.code).replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return max + 1;
}

export function canServe(status) {
  return status === 'waiting';
}

export function isHealthyResponse(payload) {
  return Boolean(payload) && payload.status === 'ok' && payload.db === 'ok';
}
