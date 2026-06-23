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

    def test_redirects_cross_topic(self) -> None:
        result = chatbot_process(message="세금 신고는 어떻게 해요?", category_slug="tax-business")
        self.assertEqual("guide_redirect", result.status)
        self.assertEqual("cross_topic", result.plan_b_reason)

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


if __name__ == "__main__":
    unittest.main()
