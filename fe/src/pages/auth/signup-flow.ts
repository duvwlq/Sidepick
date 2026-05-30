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
  '실패 이유를 찾아보고 싶어요',
  '부업 시작 전에 공부해보고 싶어요',
  '다른 사람들의 시행착오를 참고하고 싶어요',
  '내 경험을 기록하고 공유하고 싶어요',
  '비슷한 상황의 사람과 공감하고 싶어요',
  '부업 아이디어를 탐색하고 싶어요',
  '투자 결정 참고가 필요해요',
  '서비스를 가볍게 둘러보고 싶어요',
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
