# Production AI Recovery Note

Date: 2026-06-25

## Summary

Production AI chatbot was updated to use the FAQ-integrated metadata set from `feature/ai`.
The service is currently running in a safe fallback mode that does not require `faiss` or `sentence-transformers` at runtime.

## Applied Files

- `ai/server/chatbot_llm.py`
- `ai/server/chatbot_api.py`
- `ai/data/faiss_index_v2_with_faq.bin`
- `ai/data/case_metadata_v2_with_faq.json`

## Current Runtime Mode

- FAQ-integrated metadata is deployed.
- If `faiss` / `sentence-transformers` are unavailable, the server falls back to lexical search.
- This keeps production online without requiring large model dependencies on the current host.

## Verified Production Behavior

- `online-commerce`
  - Query: `스마트스토어 시작하려는데 뭐부터 해야 할까요?`
  - Result: cited `faq_online-commerce_1`
- `tax-business`
  - Query: `부업하면 세금 어떻게 내?`
  - Result: cited `faq_tax-business_3`, `faq_tax-business_5`
- `legal-contract`
  - Query: `부업 계약서 꼭 써야 하나요?`
  - Result: cited `faq_legal-contract_1`, `faq_legal-contract_2`
- `accounting`
  - Query: `매출 매입 장부 어떻게 기록해?`
  - Result: cited `faq_accounting_1`, `faq_accounting_3`

## Important Constraint

The original container image did not include `faiss`, `numpy`, or `sentence-transformers`.
Attempting to add the full vector stack on the current production host failed due to disk exhaustion during image build.

## Operational Decision

- Keep production on lexical fallback mode for stability.
- Restore full FAISS/SBERT vector retrieval only after disk capacity is secured.
