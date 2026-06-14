export type SignupMode = 'local' | 'social';

export const REGION_OPTIONS = [
  '서울',
  '경기',
  '인천',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '세종',
  '제주',
];

export const EXPERIENCE_OPTIONS = [
  { value: 'HAS_EXPERIENCE', label: '부업 경험이 있어요' },
  { value: 'NO_EXPERIENCE', label: '부업 경험이 없어요' },
  { value: 'PLANNING', label: '이제 시작해보려 해요' },
];

export const PURPOSE_OPTIONS = [
  '비슷한 부업 사례 탐색',
  '부업 실패 사례 확인',
  '부업 시작 전 정보 탐색',
  '현재 부업 방향 점검',
  '나와 맞는 부업 방향 탐색',
  '부업 시행착오 예방',
  '부업 인사이트 및 팁 확인',
  '다른 사람들과의 경험 비교',
];

export const GENDER_OPTIONS = [
  { value: 'FEMALE', label: '여성' },
  { value: 'MALE', label: '남성' },
  { value: 'PREFER_NOT_TO_SAY', label: '응답 안 함' },
];

export function parseSignupMode(search: string): SignupMode {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'social' ? 'social' : 'local';
}

export function parseNextPath(search: string) {
  const params = new URLSearchParams(search);
  return params.get('next') || '/';
}

export function deriveAgeGroup(birthDate: string) {
  if (!birthDate) {
    return 'UNKNOWN';
  }

  const today = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return 'UNKNOWN';
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dateDiff = today.getDate() - birth.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dateDiff < 0)) {
    age -= 1;
  }

  if (age < 10) {
    return 'UNDER_10';
  }
  if (age >= 70) {
    return '70+';
  }
  return `${Math.floor(age / 10) * 10}s`;
}
