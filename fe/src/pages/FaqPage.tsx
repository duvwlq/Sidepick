import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../components/common/HorizontalScroll';
import Layout from '../components/layout/Layout';

const FAQ_TAGS = ['전체', '계정', '경험 등록', '분석', '탐색', 'MY', '신고', '기타'] as const;
type FaqTag = (typeof FAQ_TAGS)[number];

const FAQ_ITEMS: Array<{
  id: number;
  tag: FaqTag;
  question: string;
  answer: string;
}> = [
  {
    id: 1,
    tag: '경험 등록',
    question: '경험 등록은 어떻게 하나요?',
    answer:
      '하단 등록 탭에서 단계별 정보를 입력하고 작성 완료를 누르면 경험 등록과 분석 요청이 함께 진행됩니다.',
  },
  {
    id: 2,
    tag: '분석',
    question: '분석 결과는 어디서 확인하나요?',
    answer:
      '등록이 완료되면 분석 중 화면을 거쳐 사례 상세 페이지로 이동하며, 그곳에서 AI 가이드와 유사 사례를 확인할 수 있습니다.',
  },
  {
    id: 3,
    tag: '탐색',
    question: '검색은 어떤 방식으로 동작하나요?',
    answer:
      '탐색 페이지에서 키워드와 태그를 함께 사용하면 원하는 실패 사례를 더 빠르게 찾을 수 있습니다.',
  },
];

export default function FaqPage() {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [selectedTag, setSelectedTag] = useState<FaqTag>('전체');

  const visibleItems = useMemo(() => {
    if (selectedTag === '전체') {
      return FAQ_ITEMS;
    }

    return FAQ_ITEMS.filter((item) => item.tag === selectedTag);
  }, [selectedTag]);

  return (
    <Layout title="FAQ" leftType="back" rightIcon="none" onBack={() => navigate(-1)}>
      <div className="flex w-full flex-col bg-[#FFFFFF]">
        <HorizontalScroll
          wrapperClassName="h-[42px] w-full px-[16px] py-[10px]"
          contentClassName="horizontal-scroll-content--tags pr-[16px]"
        >
          {FAQ_TAGS.map((tag) => {
            const active = tag === selectedTag;

            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`flex shrink-0 items-center justify-center rounded-[999px] px-[10px] py-[4px] ${
                  active ? 'border border-[#1F1F1F] bg-[#1F1F1F]' : 'border-0 bg-[#EEEEEE]'
                }`}
              >
                <span
                  className={`whitespace-nowrap text-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] [font-feature-settings:'case'_1] ${
                    active ? 'text-[#FFFFFF]' : 'text-[#757575]'
                  }`}
                >
                  {tag}
                </span>
              </button>
            );
          })}
        </HorizontalScroll>

        <section className="flex w-full flex-col items-start pb-[110px]">
          {visibleItems.length ? (
            visibleItems.map((item) => {
              const expanded = expandedId === item.id;

              return (
                <article key={item.id} className="flex w-full flex-col items-start">
                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                    className="flex min-h-[60px] w-full items-center justify-between bg-[#FFFFFF] p-[20px]"
                  >
                    <div className="flex items-start gap-[8px]">
                      <span className="text-left font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
                        Q.
                      </span>
                      <span className="text-left font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
                        {item.question}
                      </span>
                    </div>
                    {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>

                  {expanded ? (
                    <div className="flex w-full items-start gap-[4px] bg-[#F8F8F8] p-[20px]">
                      <span className="shrink-0 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
                        A.
                      </span>
                      <div className="flex min-w-px flex-[1_0_0] flex-col items-start gap-[10px] text-[#5E5E5E]">
                        <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1]">
                          안녕하세요. 사이드픽입니다.
                        </p>
                        <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1]">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="flex w-full items-center justify-center px-[20px] py-[40px] text-center font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#757575]">
              해당 탭에 등록된 FAQ가 없습니다.
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px] shrink-0" fill="none" aria-hidden="true">
      <path
        d="M5 8L10 13L15 8"
        stroke="#111111"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px] shrink-0" fill="none" aria-hidden="true">
      <path
        d="M5 12L10 7L15 12"
        stroke="#111111"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
