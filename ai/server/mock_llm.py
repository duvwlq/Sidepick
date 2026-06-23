"""
Mock LLM 응답 모듈 (AI-03)

USE_MOCK_LLM=true 환경 변수가 설정되면 실제 LLM 호출 없이
미리 정의된 가짜 응답을 반환한다.

용도:
- 개발 초기 UI/플로우 개발 (비용 0원)
- 통합 테스트 (LLM 호출 비용 없이 분기 검증)
- BE 연동 테스트 (응답 형식만 확인)

사용법:
  ai/.env 에 USE_MOCK_LLM=true 추가
  → analyze_experience() 호출 시 자동으로 mock 응답 반환

작성: 팀장 (오혜림) — 2026-05-19
"""

from typing import Optional


# 카테고리별 Mock 응답 시나리오 (7개 부업 카테고리)
MOCK_SCENARIOS = {
    "스마트스토어": {
        "keywords": ["초기투자과다", "마케팅부족", "재고관리실패"],
        "failure_category": "마케팅부족",
        "summary": "초기 자금 과다 투자 + 마케팅 부재로 재고 누적",
        "risk_level": "high",
    },
    "유튜브": {
        "keywords": ["콘텐츠일관성부족", "타겟불명확", "업로드빈도낮음"],
        "failure_category": "타겟분석실패",
        "summary": "타겟층 불명확 + 업로드 빈도 부족으로 구독자 정체",
        "risk_level": "medium",
    },
    "배달": {
        "keywords": ["체력부담", "수익률낮음", "시간관리실패"],
        "failure_category": "시간관리",
        "summary": "본업과 병행 시 체력 한계 + 시간당 수익 부족",
        "risk_level": "medium",
    },
    "블로그": {
        "keywords": ["SEO부족", "유입정체", "수익화실패"],
        "failure_category": "마케팅부족",
        "summary": "SEO 전략 부재로 유입 정체 + 광고 수익 미미",
        "risk_level": "low",
    },
    "강의": {
        "keywords": ["콘텐츠경쟁심화", "타겟분석부족", "가격책정실패"],
        "failure_category": "경쟁분석부족",
        "summary": "포화 시장 진입 + 차별화 포인트 부재",
        "risk_level": "high",
    },
    "콘텐츠": {
        "keywords": ["수익화지연", "플랫폼의존도", "꾸준함부족"],
        "failure_category": "운영관리부족",
        "summary": "수익화 시점 늦음 + 꾸준한 업로드 어려움",
        "risk_level": "medium",
    },
    "기타": {
        "keywords": ["시장조사부족", "준비미흡", "지속성부족"],
        "failure_category": "기타",
        "summary": "사전 조사 부족 + 진입 후 빠른 포기",
        "risk_level": "medium",
    },
}


# Default fallback (매칭되는 카테고리 없을 때)
DEFAULT_MOCK_RESPONSE = {
    "keywords": ["준비부족", "마케팅부족", "지속성부족"],
    "failure_category": "기타",
    "summary": "[MOCK] 일반적인 부업 실패 패턴",
    "risk_level": "medium",
}


def get_mock_analysis(category: str, free_text: Optional[str] = None) -> dict:
    """
    카테고리 기반 Mock 분석 결과 반환.

    Args:
        category: 부업 카테고리 (예: "유튜브", "스마트스토어")
        free_text: 자유서술 (현재 미사용, 추후 시나리오 분기에 활용 가능)

    Returns:
        analyze_experience()와 동일한 형식의 dict
    """
    if category in MOCK_SCENARIOS:
        result = dict(MOCK_SCENARIOS[category])
    else:
        result = dict(DEFAULT_MOCK_RESPONSE)

    result["summary"] = f"[MOCK] {result['summary']}"
    return result


if __name__ == "__main__":
    import json

    print("=" * 60)
    print("Mock LLM 응답 테스트 — 7개 카테고리")
    print("=" * 60)

    for cat in list(MOCK_SCENARIOS.keys()) + ["없는카테고리"]:
        print(f"\n[{cat}]")
        print(json.dumps(get_mock_analysis(cat), ensure_ascii=False, indent=2))
    print("=" * 60)
