# AI Pipeline Archive

## 개요

`ai/pipeline/` 은 네이버 지식인 기반 실패 사례를 수집하고 정제하던 과거 파이프라인입니다.
현재 메인 데이터셋은 100건 설문 기반 데이터로 이동했기 때문에, 이 폴더는 운영 기준 문서라기보다 이력 추적용에 가깝습니다.

## 이 폴더가 여전히 유효한 경우

- 예전 49건 데이터가 어떻게 만들어졌는지 확인할 때
- 과거 수집/정제 로직을 다시 참고할 때
- 아카이브 데이터를 재가공할 때

## 현재 기준과의 관계

- 과거 산출물 중심: `failure_cases_49.csv`
- 현재 메인 데이터 기준: `ai/data/README.md` 의 100건 데이터셋 설명

즉 이 파이프라인 설명만 보고 현재 서비스 데이터를 판단하면 안 됩니다.

## 단계 개요

```text
01_collect_naver_kin.py
02_clean_text.py
03_select_top1000.py
04_filter_failures.py
05_expand_fulltext.py
06_clean_fulltext.py
07_filter_failures_final.py
```

## 참고

- 현재 데이터 기준 문서: [ai/data/README.md](/D:/Codex_Folder/Sidepick/ai/data/README.md)
- 과거 작업물 보관: `ai/archive_ai_a/`
