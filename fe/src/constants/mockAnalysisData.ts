export type AnalysisGuide = {
  step: number;
  checklist: string[];
};

export type AnalysisSimilarCase = {
  title: string;
  tags: string[];
  similarity: number;
  durationMonths?: number;
  monthlyRevenue?: number;
};

export type AnalysisMockData = {
  keyIssues: string[];
  aiGuides: AnalysisGuide[];
  failurePatterns: string[];
  similarCases: AnalysisSimilarCase[];
};

export const mockAnalysisData: AnalysisMockData = {
  keyIssues: ['실행 경험 부족', '마케팅 부족', '낮은 자본력'],
  aiGuides: [
    {
      step: 1,
      checklist: [
        '경쟁사 3곳의 가격대와 마케팅 채널 파악하기',
        '타겟 고객 5명 이상 인터뷰',
        '월별 매출 목표 명확히 설정',
      ],
    },
    {
      step: 2,
      checklist: [
        '초기 자본 3개월치 운영비 확보',
        '예상 외 비용 20% 버퍼 확보',
        '수익 분기점까지 6개월 견딜 자금 마련',
      ],
    },
    {
      step: 3,
      checklist: [
        '주력 마케팅 채널 1~2개로 압축',
        '고객 후기 수집 및 활용',
        '리텐션 지표 주간 단위로 점검',
      ],
    },
  ],
  failurePatterns: ['자금 부족', '시장 조사 부족', '마케팅 약함'],
  similarCases: [
    {
      title: '온라인 식품몰 6개월 운영기',
      tags: ['이커머스', '식품'],
      similarity: 87,
      durationMonths: 6,
      monthlyRevenue: 800000,
    },
    {
      title: '소품 셀프 브랜드 창업 기록',
      tags: ['이커머스', '브랜드'],
      similarity: 82,
      durationMonths: 4,
      monthlyRevenue: 500000,
    },
    {
      title: '핸드메이드 캔들 부업 시도',
      tags: ['이커머스', '핸드메이드'],
      similarity: 75,
      durationMonths: 3,
      monthlyRevenue: 300000,
    },
  ],
};
