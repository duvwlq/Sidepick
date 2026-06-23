from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from server import chatbot_llm


class ChatbotLlmTest(unittest.TestCase):
    def test_returns_fallback_when_search_raises(self) -> None:
        with patch.object(chatbot_llm, "search_cases", side_effect=RuntimeError("embedder unavailable")):
            result = chatbot_llm.llm_call("스마트스토어 시작은 어떻게 해요?", category_slug="online-commerce")
        self.assertEqual("fallback", result["status"])
        self.assertIn("search_error:RuntimeError:embedder unavailable", result["error"])

    def test_returns_fallback_when_search_results_missing(self) -> None:
        with patch.object(chatbot_llm, "search_cases", return_value=[]):
            result = chatbot_llm.llm_call("스마트스토어 시작은 어떻게 해요?", category_slug="online-commerce")
        self.assertEqual("fallback", result["status"])
        self.assertEqual("no_search_results", result["error"])

    def test_returns_fallback_on_upstream_exception(self) -> None:
        with patch.object(
            chatbot_llm,
            "search_cases",
            return_value=[{"case_id": "blog_001", "title": "제목", "similarity": 0.9, "case_type": "failure"}],
        ), patch.object(chatbot_llm, "_get_client", side_effect=RuntimeError("missing key")):
            result = chatbot_llm.llm_call("스마트스토어 시작은 어떻게 해요?", category_slug="online-commerce")
        self.assertEqual("fallback", result["status"])
        self.assertIn("upstream_error:RuntimeError:missing key", result["error"])

    def test_returns_fallback_on_invalid_json(self) -> None:
        class Usage:
            input_tokens = 10
            output_tokens = 20

        class MessageText:
            text = "not json"

        class Response:
            content = [MessageText()]
            usage = Usage()

        class Client:
            class Messages:
                @staticmethod
                def create(**kwargs):
                    return Response()

            messages = Messages()

        with patch.object(
            chatbot_llm,
            "search_cases",
            return_value=[{"case_id": "blog_001", "title": "제목", "similarity": 0.9, "case_type": "failure"}],
        ), patch.object(chatbot_llm, "_get_client", return_value=Client()):
            result = chatbot_llm.llm_call("스마트스토어 시작은 어떻게 해요?", category_slug="online-commerce")
        self.assertEqual("fallback", result["status"])
        self.assertTrue(result["error"].startswith("json_parse:"))


if __name__ == "__main__":
    unittest.main()
