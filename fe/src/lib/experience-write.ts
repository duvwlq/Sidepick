export function parseNumber(value: string) {
  const onlyDigits = value.replace(/[^\d]/g, '');
  return onlyDigits ? Number(onlyDigits) : undefined;
}

export function mapPeriodToMonths(value: string) {
  if (value === '1媛쒖썡 誘몃쭔') {
    return 1;
  }
  if (value === '1???댁긽') {
    return 12;
  }

  const months = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(months) && months > 0 ? months : undefined;
}

export function mapDailyHours(value: string) {
  if (value === '1?쒓컙 誘몃쭔') {
    return 'UNDER_1_HOUR';
  }

  const hours = Number(value.replace(/[^\d]/g, ''));
  if (!hours) {
    return undefined;
  }
  if (hours <= 3) {
    return '1_TO_3_HOURS';
  }
  if (hours <= 5) {
    return '3_TO_5_HOURS';
  }

  return 'OVER_FIVE_HOURS';
}

export function mapDailyHoursToWeeklyHours(value: string) {
  if (value === '1?쒓컙 誘몃쭔') {
    return 3;
  }
  if (value === '8?쒓컙 ?댁긽') {
    return 40;
  }

  const hours = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(hours) && hours > 0 ? Math.min(hours * 7, 40) : undefined;
}
