"""
BE import용 CSV 전처리 스크립트

failure_cases_100_tagged.csv 의 duration / daily_hours / risk_level 을
BE 표준에 맞게 변환하고 *_display 컬럼을 추가한다.

변환:
    duration       (VARCHAR) -> duration_months (INT) + duration_display (VARCHAR)
    daily_hours    (VARCHAR) -> daily_hours    (INT) + daily_hours_display (VARCHAR)
    risk_level     (소문자)   -> 대문자 ("HIGH" / "MEDIUM" / "LOW")

입력: ai/data/failure_cases_100_tagged.csv
출력: ai/data/failure_cases_100_for_be.csv
"""

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "failure_cases_100_tagged.csv"
DST = ROOT / "data" / "failure_cases_100_for_be.csv"

# ---- 매핑 정의 ----
# duration: "Xㅇ개월" / "X~Y개월" / "1년 이상" 등 -> 정수 개월
DURATION_TO_INT = {
    "1개월 미만": 0,
    "1~3개월": 2,
    "3~6개월": 4,
    "6개월~1년": 9,
    "1년 이상": 12,
}

# daily_hours: "X시간 미만" / "X~Y시간" / "X시간 이상" -> 정수 시간
# NOTE: "5시간 이상"의 INT 값은 BE 결정 대기 중. 옵션 A(=5) 기본값.
#       BE가 옵션 B로 결정하면 아래 한 줄만 수정.
DAILY_HOURS_OPEN_TOP = 5  # "5시간 이상"의 정수 표현 (옵션 A)
DAILY_HOURS_TO_INT = {
    "1시간 미만": 0,
    "1~3시간": 2,
    "3~5시간": 4,
    "5시간 이상": DAILY_HOURS_OPEN_TOP,
}


def main() -> None:
    df = pd.read_csv(SRC)
    print(f"입력 행 수: {len(df)}")

    # --- duration 처리 ---
    unmapped_dur = set(df["duration"].unique()) - set(DURATION_TO_INT.keys())
    if unmapped_dur:
        raise ValueError(f"duration 매핑 누락: {unmapped_dur}")
    df["duration_display"] = df["duration"]
    df["duration_months"] = df["duration"].map(DURATION_TO_INT).astype(int)

    # --- daily_hours 처리 ---
    unmapped_hours = set(df["daily_hours"].unique()) - set(DAILY_HOURS_TO_INT.keys())
    if unmapped_hours:
        raise ValueError(f"daily_hours 매핑 누락: {unmapped_hours}")
    df["daily_hours_display"] = df["daily_hours"]
    df["daily_hours_int"] = df["daily_hours"].map(DAILY_HOURS_TO_INT).astype(int)

    # --- 원본 VARCHAR 컬럼 제거 + INT 컬럼을 정식 이름으로 ---
    df = df.drop(columns=["duration", "daily_hours"])
    df = df.rename(columns={"daily_hours_int": "daily_hours"})

    # --- risk_level 대문자 통일 ---
    df["risk_level"] = df["risk_level"].str.upper()
    expected_risk = {"HIGH", "MEDIUM", "LOW"}
    actual_risk = set(df["risk_level"].unique())
    if not actual_risk.issubset(expected_risk):
        raise ValueError(f"risk_level 예상 외 값: {actual_risk - expected_risk}")

    # --- 컬럼 순서 정리 (가독성용) ---
    column_order = [
        "id",
        "source",
        "category",
        "duration_months",
        "duration_display",
        "daily_hours",
        "daily_hours_display",
        "invest_amount",
        "invest_display",
        "revenue_amount",
        "revenue_display",
        "has_main_job",
        "failure_reasons",
        "difficulties",
        "free_text",
        "keywords",
        "failure_category",
        "summary",
        "risk_level",
    ]
    missing = set(column_order) - set(df.columns)
    if missing:
        raise ValueError(f"기대 컬럼 누락: {missing}")
    df = df[column_order]

    # --- 검증 ---
    assert len(df) == 100, f"행 수 변경됨: {len(df)}"
    assert df["duration_months"].notna().all()
    assert df["daily_hours"].notna().all()
    assert df["risk_level"].isin(expected_risk).all()

    # --- 저장 (BOM 포함 UTF-8 — 엑셀 호환) ---
    df.to_csv(DST, index=False, encoding="utf-8-sig")
    print(f"출력: {DST}")
    print(f"출력 행 수: {len(df)}")
    print("\n=== duration_months 분포 ===")
    print(df["duration_months"].value_counts().sort_index().to_string())
    print("\n=== daily_hours 분포 ===")
    print(df["daily_hours"].value_counts().sort_index().to_string())
    print("\n=== risk_level 분포 ===")
    print(df["risk_level"].value_counts().to_string())


if __name__ == "__main__":
    main()
