from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Iterable

SPECIAL_LABELS = {
    "[안내: 사례 0건]",
    "[안내: 추가 정보 필요]",
    "[안내: 가이드 페이지 안내]",
}

ALLOWED_CATEGORIES = {
    "온라인 판매·이커머스",
    "콘텐츠·SNS",
    "디지털·지식판매",
    "플랫폼 노동",
    "재능·프리랜서",
    "투자·재테크",
    "오프라인 부업",
}

ALLOWED_POLICY_DOCS = {
    "사이드픽 서비스 정책",
    "사이드픽 안전 정책",
}

CASE_ID_PATTERN = re.compile(r"\b(?:case|CASE)[-_ ]?0*(\d+)\b")
SOURCE_PATTERN = re.compile(r"\[출처:\s*([^\]]+)\]")
LABEL_PATTERN = re.compile(r"\[안내:\s*[^\]]+\]")


@dataclass(frozen=True)
class GuardrailPayload:
    text: str
    category: str | None = None
    fallback_reason: str | None = None


@dataclass(frozen=True)
class GuardrailValidationResult:
    is_valid: bool
    failure_reason: str | None = None
    case_ids: tuple[str, ...] = field(default_factory=tuple)
    sources: tuple[str, ...] = field(default_factory=tuple)
    labels: tuple[str, ...] = field(default_factory=tuple)
    case_id_validation_skipped: bool = False


def normalize_case_id(raw_case_id: str) -> str:
    match = CASE_ID_PATTERN.search(raw_case_id.strip())
    if not match:
        raise ValueError(f"Unsupported case_id format: {raw_case_id}")
    return f"CASE-{int(match.group(1))}"


def extract_case_ids(text: str) -> list[str]:
    case_ids: list[str] = []
    seen: set[str] = set()
    for match in CASE_ID_PATTERN.finditer(text):
        case_id = f"CASE-{int(match.group(1))}"
        if case_id not in seen:
            case_ids.append(case_id)
            seen.add(case_id)
    return case_ids


def extract_sources(text: str) -> list[str]:
    return [match.group(1).strip() for match in SOURCE_PATTERN.finditer(text)]


def extract_labels(text: str) -> list[str]:
    return [match.group(0).strip() for match in LABEL_PATTERN.finditer(text)]


def validate_agent_c_response(
    payload: GuardrailPayload,
    allowed_case_ids: Iterable[str],
) -> GuardrailValidationResult:
    allowed_case_id_set = {normalize_case_id(case_id) for case_id in allowed_case_ids}
    labels = tuple(extract_labels(payload.text))
    invalid_label = next((label for label in labels if label not in SPECIAL_LABELS), None)
    if invalid_label is not None:
        return GuardrailValidationResult(
            is_valid=False,
            failure_reason=f"invalid_special_label:{invalid_label}",
            labels=labels,
        )

    if payload.category is not None and payload.category not in ALLOWED_CATEGORIES:
        return GuardrailValidationResult(
            is_valid=False,
            failure_reason=f"invalid_category:{payload.category}",
            labels=labels,
        )

    sources = tuple(extract_sources(payload.text))
    invalid_source = next(
        (
            source
            for source in sources
            if not _is_allowed_source(source, allowed_case_id_set)
        ),
        None,
    )
    if invalid_source is not None:
        return GuardrailValidationResult(
            is_valid=False,
            failure_reason=f"invalid_source:{invalid_source}",
            sources=sources,
            labels=labels,
        )

    case_ids = tuple(extract_case_ids(payload.text))
    skip_case_id_validation = payload.fallback_reason == "tool_empty_result" or bool(labels)
    if skip_case_id_validation:
        return GuardrailValidationResult(
            is_valid=True,
            case_ids=case_ids,
            sources=sources,
            labels=labels,
            case_id_validation_skipped=True,
        )

    if not case_ids:
        return GuardrailValidationResult(
            is_valid=False,
            failure_reason="missing_case_id_citation",
            sources=sources,
            labels=labels,
        )

    invalid_case_id = next(
        (case_id for case_id in case_ids if case_id not in allowed_case_id_set),
        None,
    )
    if invalid_case_id is not None:
        return GuardrailValidationResult(
            is_valid=False,
            failure_reason=f"unknown_case_id:{invalid_case_id}",
            case_ids=case_ids,
            sources=sources,
            labels=labels,
        )

    return GuardrailValidationResult(
        is_valid=True,
        case_ids=case_ids,
        sources=sources,
        labels=labels,
    )


def _is_allowed_source(source: str, allowed_case_id_set: set[str]) -> bool:
    if source in ALLOWED_POLICY_DOCS:
        return True

    if source.startswith("업종 통계:"):
        category = source.split(":", 1)[1].strip()
        return category in ALLOWED_CATEGORIES

    if source.startswith("업종 통계 -"):
        category = source.split("-", 1)[1].strip()
        return category in ALLOWED_CATEGORIES

    try:
        normalize_case_id(source)
        return True
    except ValueError:
        return False
