import unittest

from server.guardrail import GuardrailPayload
from server.guardrail import validate_agent_c_response


ALLOWED_CASE_IDS = ["CASE-42", "case_077", "CASE-108"]


class GuardrailValidationTest(unittest.TestCase):

    def test_ten_sample_responses(self) -> None:
        samples = [
            {
                "name": "valid standard response",
                "payload": GuardrailPayload(
                    text=(
                        "비슷한 실패 사례로 CASE-42와 case_077이 확인됩니다. "
                        "[출처: CASE-42] [출처: case_077]"
                    ),
                    category="콘텐츠·SNS",
                ),
                "expected_valid": True,
                "expected_skipped": False,
            },
            {
                "name": "valid with policy source",
                "payload": GuardrailPayload(
                    text=(
                        "플랫폼 수수료 구조를 먼저 확인해보세요. CASE-108도 참고할 수 있습니다. "
                        "[출처: CASE-108] [출처: 사이드픽 서비스 정책]"
                    ),
                    category="플랫폼 노동",
                ),
                "expected_valid": True,
                "expected_skipped": False,
            },
            {
                "name": "valid statistics source",
                "payload": GuardrailPayload(
                    text=(
                        "온라인 판매·이커머스 업종 통계상 초기 광고비 부담이 잦습니다. "
                        "CASE-42도 함께 보세요. [출처: 업종 통계: 온라인 판매·이커머스] [출처: CASE-42]"
                    ),
                    category="온라인 판매·이커머스",
                ),
                "expected_valid": True,
                "expected_skipped": False,
            },
            {
                "name": "invalid unknown case id",
                "payload": GuardrailPayload(
                    text="CASE-999가 유사합니다. [출처: CASE-999]",
                    category="콘텐츠·SNS",
                ),
                "expected_valid": False,
                "expected_reason": "unknown_case_id:CASE-999",
            },
            {
                "name": "invalid missing case id",
                "payload": GuardrailPayload(
                    text="꾸준함이 중요합니다. [출처: 사이드픽 서비스 정책]",
                    category="재능·프리랜서",
                ),
                "expected_valid": False,
                "expected_reason": "missing_case_id_citation",
            },
            {
                "name": "invalid special label",
                "payload": GuardrailPayload(
                    text="[안내: 존재하지 않는 라벨] 다시 질문해주세요.",
                    category="투자·재테크",
                ),
                "expected_valid": False,
                "expected_reason": "invalid_special_label:[안내: 존재하지 않는 라벨]",
            },
            {
                "name": "guide label skips case id validation",
                "payload": GuardrailPayload(
                    text=(
                        "[안내: 가이드 페이지 안내] 이 질문은 세금·사업자 가이드에서 먼저 확인해주세요. "
                        "[출처: 사이드픽 서비스 정책]"
                    ),
                    category="디지털·지식판매",
                ),
                "expected_valid": True,
                "expected_skipped": True,
            },
            {
                "name": "additional info label skips case id validation",
                "payload": GuardrailPayload(
                    text=(
                        "[안내: 추가 정보 필요] 투자금과 주당 시간을 알려주시면 더 정확히 볼 수 있어요. "
                        "[출처: 사이드픽 서비스 정책]"
                    ),
                    category="오프라인 부업",
                ),
                "expected_valid": True,
                "expected_skipped": True,
            },
            {
                "name": "tool empty result skips case id validation",
                "payload": GuardrailPayload(
                    text=(
                        "[안내: 사례 0건] 지금은 비슷한 사례가 없습니다. "
                        "[출처: 사이드픽 서비스 정책]"
                    ),
                    category="플랫폼 노동",
                    fallback_reason="tool_empty_result",
                ),
                "expected_valid": True,
                "expected_skipped": True,
            },
            {
                "name": "invalid category rename mismatch",
                "payload": GuardrailPayload(
                    text="CASE-42를 참고하세요. [출처: CASE-42]",
                    category="디지털 상품·지식",
                ),
                "expected_valid": False,
                "expected_reason": "invalid_category:디지털 상품·지식",
            },
        ]

        for sample in samples:
            with self.subTest(sample["name"]):
                result = validate_agent_c_response(sample["payload"], ALLOWED_CASE_IDS)
                self.assertEqual(sample["expected_valid"], result.is_valid)
                if result.is_valid:
                    self.assertEqual(sample["expected_skipped"], result.case_id_validation_skipped)
                else:
                    self.assertEqual(sample["expected_reason"], result.failure_reason)


if __name__ == "__main__":
    unittest.main()
