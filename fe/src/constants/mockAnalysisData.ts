export const mockAnalysisData = {
  nickname: 'Goorm',
  title: '실패 경험 분석 리포트',
  summaryTitle: 'AI 요약',
  summaryText:
    '이커머스 분야에서 300만원을 투자하여 3~6개월간 운영한 사례입니다.\n\n주요 실패 원인은 시장 경쟁 과다로 분석되며, 유사한 조건의 유사례 비교 분석을 결과입니다.',
  tags: [
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
    '키워드',
  ],
  patterns: [
    { label: '실패 원인 분류', percent: 0 },
    { label: '실패 요인 종합', percent: 0 },
    { label: '실패 원인 종합', percent: 0 },
    { label: '실패 원인 종합', percent: 0 },
  ],
  actions: [
    {
      title: '추천 행동 타이틀',
      scoreLabel: '우선순위 높음',
      description:
        '추천 행동 상세 내용입니다. 추천 행동 상세 내용입니다. 추천 행동 상세 내용입니다. 추천 행동 상세 내용입니다.',
    },
    {
      title: '추천 행동 타이틀',
      scoreLabel: '우선순위 높음',
      description:
        '유사 사례 중 75%가 시장 조사 부족을 지적했습니다. 향후 사례는 최소 2~3개월 시장 분석 기간을 기준입니다.',
    },
    {
      title: '추천 행동 타이틀',
      scoreLabel: '우선순위 높음',
      description:
        '유사 사례 중 75%가 시장 조사 부족을 지적했습니다. 향후 사례는 최소 2~3개월 시장 분석 기간을 기준입니다.',
    },
  ],
  similarCases: [
    {
      title: '메인 제목',
      tags: ['키워드', '키워드'],
      similarity: 0,
    },
    {
      title: '메인 제목',
      tags: ['키워드', '키워드'],
      similarity: 0,
    },
    {
      title: '메인 제목',
      tags: ['키워드', '키워드'],
      similarity: 0,
    },
    {
      title: '메인 제목',
      tags: ['키워드', '키워드'],
      similarity: 0,
    },
  ],
  // PM-10: 실패→성공 연결 버튼용 (mock)
  caseId: 'case_123',
  relatedSuccessCount: 3,
};
