"""
18_integrate_and_clean.py — 성공사례 데이터 통합 정제 (AI-08)

[입력]
- ai/data/refined_success_sample.csv (301건, blog/kin/cafe 등 혼합)
- ai/data/success_community_sample.csv (60건, dc/clien/ppomppu)
- ai/data/pd_survey_results.csv (PD 설문 30건 — 수령 시 활용, 없으면 SKIP)

[처리]
1. 카테고리 매핑 통일 — sample csv의 "기타/블로그/스마트스토어/콘텐츠/강의/유튜브/배달" 등 자유 표기
   → PM-03 v1.3의 부업 분야 7개 slug (`online-commerce` / `content-sns` 등) + 기타
2. 필드 통일 — case_id / title / full_text / category / source / link / created_at
3. 중복 제거 — link 우선, 없으면 title 80% 유사도 (difflib)
4. W3 AI007 입력 형식 — `integrated_success_sample.csv` 저장
5. 품질 리포트 — 총 건수 / 카테고리별 분포 / 평균 본문 길이 / source 분포

[산출물]
- ai/data/integrated_success_sample.csv (W3 입력용 최종)
- ai/data/integrated_success_quality_report.md (품질 리포트)

작성: 팀장 (오혜림) — 2026-05-27
"""

import csv
import re
import sys
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT_CSV = DATA_DIR / "integrated_success_sample.csv"
REPORT_MD = DATA_DIR / "integrated_success_quality_report.md"

REFINED_CSV = DATA_DIR / "refined_success_sample.csv"
COMMUNITY_CSV = DATA_DIR / "success_community_sample.csv"
PD_SURVEY_CSV = DATA_DIR / "pd_survey_results.csv"  # 미존재 시 SKIP


# -------------------------------
# 1) 카테고리 매핑 (자유 표기 → PM-03 v1.3 slug)
# -------------------------------
CATEGORY_NAME_TO_SLUG = {
    # 부업 분야 7개 (PM-03 v1.3)
    "온라인 판매·이커머스": "online-commerce",
    "온라인 판매": "online-commerce",
    "스마트스토어": "online-commerce",
    "쇼핑몰": "online-commerce",
    "이커머스": "online-commerce",
    "쿠팡": "online-commerce",
    "쿠팡파트너스": "online-commerce",
    "위탁판매": "online-commerce",

    "콘텐츠·SNS": "content-sns",
    "콘텐츠": "content-sns",
    "유튜브": "content-sns",
    "블로그": "content-sns",
    "인스타": "content-sns",
    "인스타그램": "content-sns",
    "틱톡": "content-sns",
    "SNS": "content-sns",

    "디지털·지식판매": "digital-products",
    "전자책": "digital-products",
    "강의": "digital-products",
    "온라인 강의": "digital-products",
    "클래스101": "digital-products",
    "인프런": "digital-products",

    "플랫폼 노동": "platform-labor",
    "배달": "platform-labor",
    "배민": "platform-labor",
    "쿠팡이츠": "platform-labor",
    "라이더": "platform-labor",
    "대리운전": "platform-labor",

    "재능·프리랜서": "talent-freelance",
    "크몽": "talent-freelance",
    "숨고": "talent-freelance",
    "탈잉": "talent-freelance",
    "프리랜서": "talent-freelance",
    "외주": "talent-freelance",

    "투자·재테크": "investment",
    "주식": "investment",
    "코인": "investment",
    "부동산": "investment",

    "오프라인 부업": "offline-sidejob",
    "공방": "offline-sidejob",
    "플리마켓": "offline-sidejob",

    # 기타
    "기타": "etc",
    "": "etc",
}


def normalize_category(raw: str) -> str:
    """sample.csv의 자유 표기 category를 PM-03 v1.3 slug로 변환."""
    if not raw:
        return "etc"
    key = raw.strip()
    if key in CATEGORY_NAME_TO_SLUG:
        return CATEGORY_NAME_TO_SLUG[key]
    # 부분 일치 시도 (긴 키워드 우선)
    for name, slug in sorted(CATEGORY_NAME_TO_SLUG.items(), key=lambda x: -len(x[0])):
        if name and name in key:
            return slug
    return "etc"


# -------------------------------
# 2) 필드 통일 헬퍼
# -------------------------------
def make_case_id(source: str, idx: int) -> str:
    """case_id 생성 규칙: source_숫자 (예: blog_001, kin_042)"""
    return f"{source}_{idx:03d}"


def is_similar_title(t1: str, t2: str, threshold: float = 0.8) -> bool:
    """두 제목의 유사도가 threshold 이상이면 True."""
    if not t1 or not t2:
        return False
    return SequenceMatcher(None, t1, t2).ratio() >= threshold


# -------------------------------
# 3) 데이터 로드 + 통합
# -------------------------------
def load_csv(path: Path, default_source: str = "") -> list:
    if not path.exists():
        return []
    with open(path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        if not r.get("source"):
            r["source"] = default_source
    return rows


def main():
    print("=" * 70)
    print("AI-08: 성공사례 데이터 통합 정제")
    print("=" * 70)

    # 1. 로드
    refined = load_csv(REFINED_CSV, default_source="blog")  # default source 모르면 blog
    community = load_csv(COMMUNITY_CSV, default_source="community")
    pd_survey = load_csv(PD_SURVEY_CSV, default_source="survey") if PD_SURVEY_CSV.exists() else []

    print(f"\n[1] 입력 로드")
    print(f"  refined_success_sample.csv: {len(refined)}건")
    print(f"  success_community_sample.csv: {len(community)}건")
    print(f"  pd_survey_results.csv: {len(pd_survey)}건 {'(미수령)' if not pd_survey else ''}")

    all_rows = refined + community + pd_survey
    print(f"  통합 전: {len(all_rows)}건")

    # 2. 필드 통일 + 카테고리 매핑
    print(f"\n[2] 필드 통일 + 카테고리 매핑")
    normalized = []
    source_counters = Counter()
    for r in all_rows:
        source = r.get("source", "") or "unknown"
        source_counters[source] += 1
        norm = {
            "case_id": make_case_id(source, source_counters[source]),
            "title": (r.get("title") or "").strip(),
            "full_text": (r.get("full_text") or "").strip(),
            "description": (r.get("description") or "").strip(),
            "category_raw": r.get("category", ""),
            "category_slug": normalize_category(r.get("category", "")),
            "source": source,
            "link": (r.get("link") or "").strip(),
            "postdate": r.get("postdate", "") or r.get("pubDate", ""),
        }
        normalized.append(norm)

    # 3. 중복 제거 (link 우선, 없으면 title 80% 유사도)
    print(f"\n[3] 중복 제거")
    seen_links = set()
    seen_titles = []
    deduped = []
    for r in normalized:
        link = r["link"]
        title = r["title"]

        # link 중복
        if link and link in seen_links:
            continue
        # title 유사도 중복
        is_dup = False
        for stitle in seen_titles[-200:]:  # 최근 200개만 비교 (성능)
            if is_similar_title(title, stitle):
                is_dup = True
                break
        if is_dup:
            continue

        if link:
            seen_links.add(link)
        if title:
            seen_titles.append(title)
        deduped.append(r)

    dup_removed = len(normalized) - len(deduped)
    print(f"  중복 제거: {dup_removed}건 (link {len(normalized) - len(seen_links) if False else 'N/A'} + 제목 유사)")
    print(f"  최종: {len(deduped)}건")

    # 4. 저장
    fieldnames = ["case_id", "title", "full_text", "description", "category_raw", "category_slug", "source", "link", "postdate"]
    with open(OUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(deduped)
    print(f"\n[4] 저장 완료: {OUT_CSV.name} ({len(deduped)}건)")

    # 5. 품질 리포트
    print(f"\n[5] 품질 리포트 생성")
    cat_dist = Counter(r["category_slug"] for r in deduped)
    src_dist = Counter(r["source"] for r in deduped)
    fulltext_lens = [len(r["full_text"]) for r in deduped if r["full_text"]]
    fulltext_count = sum(1 for r in deduped if r["full_text"] and len(r["full_text"]) > 100)

    report_lines = [
        "# AI-08 통합 정제 데이터 품질 리포트",
        "",
        f"**작성일**: 2026-05-27",
        f"**산출물**: `ai/data/integrated_success_sample.csv`",
        f"**총 건수**: {len(deduped)}건",
        "",
        "## 1. 입력 → 출력 흐름",
        "",
        f"| 입력 | 건수 |",
        f"|---|---|",
        f"| refined_success_sample.csv | {len(refined)} |",
        f"| success_community_sample.csv | {len(community)} |",
        f"| pd_survey_results.csv | {len(pd_survey)} {'(미수령)' if not pd_survey else ''} |",
        f"| **통합 전** | **{len(all_rows)}** |",
        f"| 중복 제거 | -{dup_removed} |",
        f"| **최종** | **{len(deduped)}** |",
        "",
        "## 2. 카테고리 분포 (PM-03 v1.3 slug)",
        "",
        "| slug | 건수 | 비율 |",
        "|---|---|---|",
    ]
    for slug, n in cat_dist.most_common():
        report_lines.append(f"| `{slug}` | {n} | {n*100/len(deduped):.1f}% |")

    report_lines.extend([
        "",
        "## 3. Source 분포",
        "",
        "| source | 건수 | 비율 |",
        "|---|---|---|",
    ])
    for src, n in src_dist.most_common():
        report_lines.append(f"| {src} | {n} | {n*100/len(deduped):.1f}% |")

    report_lines.extend([
        "",
        "## 4. 본문 (full_text) 보유율",
        "",
        f"- 본문 보유 (>100자): **{fulltext_count}건 ({fulltext_count*100/len(deduped):.1f}%)**",
        f"- 본문 미보유: {len(deduped) - fulltext_count}건",
        "",
    ])

    if fulltext_lens:
        report_lines.extend([
            "## 5. 본문 길이 통계",
            "",
            f"- 평균: {sum(fulltext_lens)/len(fulltext_lens):.0f}자",
            f"- 최소: {min(fulltext_lens)}자",
            f"- 최대: {max(fulltext_lens)}자",
            "",
        ])

    report_lines.extend([
        "## 6. 다음 단계 (W3 인계)",
        "",
        "- AI007 (성공사례 AI 분석글) 파이프라인 입력으로 사용",
        "- 카테고리별 분포 편향 보완 필요 시 추가 크롤링/설문",
        "- PD 설문 30건 수령 시 재실행하여 통합 데이터셋 업데이트",
        "",
    ])

    with open(REPORT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"  리포트: {REPORT_MD.name}")

    print("\n" + "=" * 70)
    print(f"AI-08 통합 정제 완료 — 총 {len(deduped)}건")
    print("=" * 70)


if __name__ == "__main__":
    main()
