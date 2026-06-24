# FAISS / SBERT Restore Checklist

## Goal

Restore production vector retrieval so the chatbot can use:

- `faiss-cpu`
- `numpy`
- `sentence-transformers`
- cached SBERT model files

## Preconditions

- Confirm enough free disk space on the production Docker host.
- Confirm enough memory for model load and query execution.
- Confirm outbound access to Hugging Face, or prepare a pre-cached model directory.

## Checklist

1. Check free disk space on the host.
   - Verify Docker image build has enough room for `torch` and `sentence-transformers`.
2. Decide runtime strategy.
   - Option A: install full dependencies in the image.
   - Option B: use a prebuilt lighter image or CPU-only optimized dependency set.
3. Update `ai/requirements.txt`.
   - Add `numpy`
   - Add `faiss-cpu`
   - Add `sentence-transformers`
4. Prefer CPU-safe dependency selection.
   - Avoid unnecessary CUDA packages on a CPU-only host.
   - Pin tested versions before production build.
5. Prepare model cache.
   - Either allow first-run download from Hugging Face
   - Or bake/cache `snunlp/KR-SBERT-V40K-klueNLI-augSTS` in advance
6. Rebuild `ai-server` container.
7. Verify import health.
   - `import faiss`
   - `import numpy`
   - `from sentence_transformers import SentenceTransformer`
8. Verify embedder load.
   - Load SBERT model without network failure.
9. Verify FAQ retrieval.
   - Run `online-commerce` FAQ query and confirm `faq_online-commerce_*` citation.
10. Verify cross-topic retrieval.
   - Run `tax-business`, `legal-contract`, `accounting` queries and confirm FAQ citations.
11. Compare quality.
   - Compare lexical fallback vs vector retrieval on a small fixed smoke set.
12. Document rollback.
   - If build or startup fails, revert to the lightweight lexical fallback version.

## Smoke Set

- `스마트스토어 시작하려는데 뭐부터 해야 할까요?`
- `부업하면 세금 어떻게 내?`
- `부업 계약서 꼭 써야 하나요?`
- `매출 매입 장부 어떻게 기록해?`

## Success Criteria

- AI container starts without import errors.
- Vector search returns FAQ-backed citations.
- No regression in existing chatbot API contract.
