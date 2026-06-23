export function parseNumber(value: string) {
  const onlyDigits = value.replace(/[^\d]/g, '');
  return onlyDigits ? Number(onlyDigits) : undefined;
}

export function mapPeriodToMonths(value: string) {
  if (value === '1개월 미만') {
    return 0;
  }
  if (value === '1년 이상') {
    return 12;
  }

  const months = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(months) && months > 0 ? months : undefined;
}

export function mapDailyHours(value: string) {
  if (value === '1시간 미만') {
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
  if (value === '1시간 미만') {
    return 3;
  }
  if (value === '8시간 이상') {
    return 40;
  }

  const hours = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(hours) && hours > 0 ? Math.min(hours * 7, 40) : undefined;
}
