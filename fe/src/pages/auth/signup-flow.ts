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

export const EMPLOYMENT_OPTIONS = [
  '현재 본업이 있어요',
  '지금은 본업 없이 준비 중이에요',
];

export const PURPOSE_OPTIONS = [
  '실패 사례를 찾아보고 싶어요',
  '부업 시작 전에 미리 공부하고 싶어요',
  '다른 사람들의 시행착오를 참고하고 싶어요',
  '내 실패 경험을 공유하고 싶어요',
  '비슷한 상황의 사람들과 공감하고 싶어요',
  '부업 아이디어를 탐색하고 싶어요',
  '재도전할 때 참고할 자료가 필요해요',
  '서비스가 궁금해서 둘러보고 있어요',
];

export function parseSignupMode(search: string): SignupMode {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'social' ? 'social' : 'local';
}

export function parseNextPath(search: string) {
  const params = new URLSearchParams(search);
  return params.get('next') || '/';
}
