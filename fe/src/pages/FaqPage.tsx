import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

type FaqCategory =
  | '전체'
  | '계정'
  | '경험 등록'
  | '분석 결과'
  | '탐색'
  | '신고/문의'
  | '운영 정책'
  | '기타';

type FaqItem = {
  id: number;
  category: Exclude<FaqCategory, '전체'>;
  question: string;
  answer: string;
};

const FAQ_CATEGORIES: FaqCategory[] = [
  '전체',
  '계정',
  '경험 등록',
  '분석 결과',
  '탐색',
  '신고/문의',
  '운영 정책',
  '기타',
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    category: '계정',
    question: '로그인이 되지 않아요.',
    answer:
      '이메일과 비밀번호를 다시 확인해 주세요. 소셜 로그인 사용자인 경우 가입했던 동일한 제공자(카카오, 구글)로 로그인해야 합니다.',
  },
  {
    id: 2,
    category: '경험 등록',
    question: '실패 경험은 어떤 방식으로 작성하나요?',
    answer:
      '경험 등록 화면에서 카테고리, 투자금, 운영 기간, 실패 이유와 같은 기본 정보를 입력한 뒤 본문 내용을 작성하면 됩니다.',
  },
  {
    id: 3,
    category: '분석 결과',
    question: 'AI 분석 결과는 언제 확인할 수 있나요?',
    answer:
      '분석은 경험 등록 후 순차적으로 처리됩니다. 분석이 아직 준비되지 않았다면 결과 화면에서 잠시 후 다시 확인해 주세요.',
  },
  {
    id: 4,
    category: '탐색',
    question: '원하는 사례만 따로 모아서 볼 수 있나요?',
    answer:
      '탐색 화면 상단 태그와 검색 기능을 함께 사용하면 특정 실패 이유나 키워드에 맞는 사례만 빠르게 확인할 수 있습니다.',
  },
  {
    id: 5,
    category: '신고/문의',
    question: '부적절한 사례는 어디서 신고하나요?',
    answer:
      '현재는 운영 문의 채널을 통해 접수받고 있습니다. 추후 사례별 신고 기능이 추가될 예정입니다.',
  },
  {
    id: 6,
    category: '운영 정책',
    question: '작성한 사례를 삭제할 수 있나요?',
    answer:
      '본인이 작성한 사례는 사례 상세 화면 우측 상단 더보기 메뉴에서 삭제할 수 있습니다.',
  },
  {
    id: 7,
    category: '기타',
    question: '서비스 이용 중 오류가 발생했어요.',
    answer:
      '잠시 후 다시 시도해도 동일한 문제가 반복되면 사용 환경과 함께 운영팀에 알려주세요. 빠르게 확인하겠습니다.',
  },
];

export default function FaqPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('전체');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === '전체' || item.category === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  return (
    <Layout
      title="FAQ"
      leftType="back"
      rightIcon="search"
      onBack={() => navigate(-1)}
      onRightIconClick={() => setSearchOpen((current) => !current)}
    >
      <div className="bg-white">
        {searchOpen ? (
          <div className="px-4 pb-3">
            <label className="flex items-center gap-2 rounded-[14px] bg-[#F8F8F8] px-4 py-3">
              <Search className="h-4 w-4 text-[#8A8A8A]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="질문을 검색해보세요"
                className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#8A8A8A]"
              />
            </label>
          </div>
        ) : null}

        <section className="overflow-x-auto px-4 py-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2 pr-4">
            {FAQ_CATEGORIES.map((category) => {
              const active = category === selectedCategory;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setExpandedId(null);
                  }}
                  className={`rounded-[999px] px-[10px] py-1 text-xs leading-[14.4px] ${
                    active
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#EEEEEE] text-[#757575]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="pb-[110px]">
          {filteredItems.map((item) => {
            const expanded = expandedId === item.id;

            return (
              <article key={item.id} className="w-full">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((current) => (current === item.id ? null : item.id))
                  }
                  className="flex w-full items-center justify-between bg-white px-5 py-5 text-left"
                >
                  <div className="flex items-start gap-2 text-base font-semibold leading-[19.2px] text-black">
                    <span>Q.</span>
                    <span>{item.question}</span>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-[#111111]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#111111]" />
                  )}
                </button>

                {expanded ? (
                  <div className="flex gap-1 bg-[#EEEEEE] px-5 py-5 text-xs leading-[16.8px]">
                    <span className="shrink-0 text-black">A.</span>
                    <div className="text-[#5E5E5E]">
                      <p>안녕하세요. 사이드픽입니다.</p>
                      <p className="mt-[10px]">{item.answer}</p>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}

          {!filteredItems.length ? (
            <div className="px-5 py-10 text-center text-sm text-[#757575]">
              조건에 맞는 FAQ가 없습니다.
            </div>
          ) : null}
        </section>
      </div>
    </Layout>
  );
}
