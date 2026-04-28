from llm_analyzer import analyze_experience
import json

# 5개 샘플 케이스
samples = [
    {
        "name": "1. 유튜브 - 마케팅 부족 (정상 케이스)",
        "category": "유튜브",
        "difficulties": ["마케팅/홍보"],
        "difficulty_etc": "",
        "difficulty_extra": "",
        "duration_months": 6,
        "weekly_hours": 10,
        "free_text": "유튜브 채널을 6개월 운영했는데 구독자가 100명에서 안 늘었어요."
    },
    {
        "name": "2. 쇼핑몰 - 자금 부족",
        "category": "온라인 쇼핑몰",
        "difficulties": ["초기 자금"],
        "difficulty_etc": "",
        "difficulty_extra": "광고비를 감당 못함",
        "duration_months": 3,
        "weekly_hours": 20,
        "free_text": "쇼핑몰 시작했다가 초기 비용만 날리고 접었어요. 광고비 부담이 너무 컸습니다."
    },
    {
        "name": "3. 블로그 - 시간 관리",
        "category": "블로그",
        "difficulties": ["시간 관리"],
        "difficulty_etc": "",
        "difficulty_extra": "",
        "duration_months": 12,
        "weekly_hours": 5,
        "free_text": "본업 끝나고 블로그 글 쓰려니 너무 피곤해서 결국 포기했어요."
    },
    {
        "name": "4. 체크 항목 비어있는 케이스 (엣지 케이스)",
        "category": "기타",
        "difficulties": [],
        "difficulty_etc": "잘 모르겠음",
        "difficulty_extra": "",
        "duration_months": 2,
        "weekly_hours": 8,
        "free_text": "그냥 어쩌다 시작했는데 잘 안 됐어요. 돈도 안 벌리고 흥미도 떨어졌습니다."
    },
    {
        "name": "5. 자유서술 짧은 케이스 (최소 10자)",
        "category": "배달",
        "difficulties": ["시간 관리", "운영/관리"],
        "difficulty_etc": "",
        "difficulty_extra": "",
        "duration_months": 1,
        "weekly_hours": 15,
        "free_text": "너무 힘들어서 포기했어요"
    }
]

print("=" * 60)
print("LLM 프롬프트 일관성 테스트 - 5개 샘플")
print("=" * 60)

success_count = 0
fail_count = 0

for i, sample in enumerate(samples, 1):
    print(f"\n[{i}/5] {sample['name']}")
    print(f"입력 (자유서술): {sample['free_text']}")
    print("-" * 60)
    
    try:
        result = analyze_experience(
            category=sample["category"],
            difficulties=sample["difficulties"],
            difficulty_etc=sample["difficulty_etc"],
            difficulty_extra=sample["difficulty_extra"],
            duration_months=sample["duration_months"],
            weekly_hours=sample["weekly_hours"],
            free_text=sample["free_text"]
        )
        
        # 필수 필드 검증
        required_fields = ["keywords", "failure_category", "summary", "risk_level"]
        missing = [f for f in required_fields if f not in result]
        
        if missing:
            print(f"⚠️  필드 누락: {missing}")
            fail_count += 1
        else:
            print("✅ 성공")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            success_count += 1
            
    except Exception as e:
        print(f"❌ 실패: {type(e).__name__}: {e}")
        fail_count += 1

print("\n" + "=" * 60)
print(f"테스트 완료: 성공 {success_count}/5, 실패 {fail_count}/5")
print("=" * 60)