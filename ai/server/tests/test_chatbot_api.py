from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from server.chatbot_api import chatbot_process


class ChatbotApiTest(unittest.TestCase):
    def test_blocks_too_short_message(self) -> None:
        result = chatbot_process(message="안녕")
        self.assertEqual("blocked", result.status)
        self.assertEqual("too_short", result.plan_b_reason)

    def test_allows_guide_category_slug(self) -> None:
        result = chatbot_process(
            message="세금 신고는 어떻게 해요?",
            category_slug="tax-business",
            llm_call=lambda **_: {
                "reply": "종합소득세 신고 일정을 먼저 확인하세요. [case_id: faq_tax-business_3]",
                "cited_case_ids": ["faq_tax-business_3"],
            },
        )
        self.assertEqual("ok", result.status)
        self.assertEqual(["faq_tax-business_3"], result.cited_case_ids)

    def test_fallbacks_on_upstream_error(self) -> None:
        result = chatbot_process(
            message="스마트스토어 시작은 어떻게 해요?",
            category_slug="online-commerce",
            llm_call=lambda **_: {
                "status": "fallback",
                "reply": "지금은 연결이 불안정해요.",
                "error": "upstream_error:RuntimeError:test",
                "cited_case_ids": [],
            },
        )
        self.assertEqual("fallback", result.status)
        self.assertEqual("upstream_error:RuntimeError:test", result.plan_b_reason)

    def test_fallbacks_on_unknown_case_id(self) -> None:
        result = chatbot_process(
            message="스마트스토어 시작은 어떻게 해요?",
            category_slug="online-commerce",
            known_case_ids={"blog_001"},
            llm_call=lambda **_: {
                "status": "ok",
                "reply": "답변",
                "cited_case_ids": ["blog_999"],
            },
        )
        self.assertEqual("fallback", result.status)
        self.assertTrue((result.plan_b_reason or "").startswith("unknown_case_ids:"))

    def test_prefers_backend_route_hint_for_guide_redirect(self) -> None:
        result = chatbot_process(
            message="짧아도 질문 의도가 분명한 예시",
            category_slug="online-commerce",
            preferred_route="guide_redirect",
            llm_call=lambda **_: {
                "status": "ok",
                "reply": "가이드 답변",
                "cited_case_ids": [],
            },
        )
        self.assertEqual("ok", result.status)
        self.assertEqual("guide_redirect", result.route)


if __name__ == "__main__":
    unittest.main()
