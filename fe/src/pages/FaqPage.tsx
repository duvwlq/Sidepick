import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../components/common/HorizontalScroll';
import Layout from '../components/layout/Layout';
import { FAQ_CATEGORIES, FAQ_INTRO } from './faqData';

const ALL_TAG = '전체';

type SelectedTag = typeof ALL_TAG | (typeof FAQ_CATEGORIES)[number]['label'];

export default function FaqPage() {
  const navigate = useNavigate();
  const [expandedKey, setExpandedKey] = useState<string | null>(`${FAQ_CATEGORIES[0]?.id}-1`);
  const [selectedTag, setSelectedTag] = useState<SelectedTag>(ALL_TAG);
  const [searchQuery, setSearchQuery] = useState('');

  const tags = useMemo(() => [ALL_TAG, ...FAQ_CATEGORIES.map((category) => category.label)], []);

  const visibleCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const scopedCategories =
      selectedTag === ALL_TAG
        ? FAQ_CATEGORIES
        : FAQ_CATEGORIES.filter((category) => category.label === selectedTag);

    if (!normalizedQuery) {
      return scopedCategories;
    }

    return scopedCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const haystack = `${category.label} ${item.question} ${item.answer}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery, selectedTag]);

  return (
    <Layout title="FAQ" leftType="back" rightIcon="none" onBack={() => navigate(-1)}>
      <div className="flex w-full flex-col bg-[#FFFFFF]">
        <section className="border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-6">
          <p className="text-sm font-semibold text-[#555555]">{FAQ_INTRO.eyebrow}</p>
          <h1 className="mt-2 whitespace-pre-line text-[24px] font-bold leading-[1.35] text-[#111111]">
            {FAQ_INTRO.title}
          </h1>
          <p className="mt-4 text-xs leading-5 text-[#666666]">{FAQ_INTRO.disclaimer}</p>
          <p className="mt-4 text-xs font-medium text-[#888888]">
            총 {FAQ_CATEGORIES.length}개 카테고리로 정리했습니다.
          </p>
        </section>

        <section className="border-b border-[#F0F0F0] px-4 py-3">
          <label className="flex items-center gap-3 rounded-[16px] border border-[#E8E8E8] bg-[#FAFAFA] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-[#777777]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="질문이나 키워드로 검색해보세요"
              className="w-full bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9A9A9A]"
            />
          </label>
        </section>

        <HorizontalScroll
          wrapperClassName="h-[54px] w-full border-b border-[#F0F0F0] px-4 py-3"
          contentClassName="horizontal-scroll-content--tags pr-4"
        >
          {tags.map((tag) => {
            const active = tag === selectedTag;

            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`flex shrink-0 items-center justify-center rounded-full border px-3 py-2 ${
                  active
                    ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                    : 'border-[#E4E4E4] bg-[#FFFFFF] text-[#666666]'
                }`}
              >
                <span className="whitespace-nowrap text-sm font-medium">{tag}</span>
              </button>
            );
          })}
        </HorizontalScroll>

        <section className="flex w-full flex-col pb-[110px]">
          {visibleCategories.length ? (
            visibleCategories.map((category) => (
              <div key={category.id} className="border-b border-[#F2F2F2]">
                <div className="sticky top-0 z-[1] flex items-center justify-between bg-[#FFFFFF] px-4 py-4">
                  <h2 className="text-base font-semibold text-[#111111]">{category.label}</h2>
                  <span className="text-xs font-medium text-[#7A7A7A]">{category.items.length}개</span>
                </div>

                {category.items.map((item) => {
                  const itemKey = `${category.id}-${item.id}`;
                  const expanded = expandedKey === itemKey;

                  return (
                    <article key={itemKey} className="border-t border-[#F5F5F5]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedKey((current) => (current === itemKey ? null : itemKey))
                        }
                        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tracking-[0.08em] text-[#444444]">Q</p>
                          <p className="mt-2 break-words text-[15px] font-semibold leading-6 text-[#111111]">
                            {item.question}
                          </p>
                        </div>
                        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </button>

                      {expanded ? (
                        <div className="bg-[#FAFAFA] px-4 pb-5 pt-1">
                          <div className="rounded-[18px] border border-[#EFEFEF] bg-[#FFFFFF] px-4 py-4">
                            <p className="text-xs font-semibold tracking-[0.08em] text-[#666666]">A</p>
                            <p className="mt-3 whitespace-pre-line break-words text-[14px] leading-6 text-[#5E5E5E]">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-sm leading-6 text-[#7A7A7A]">
              검색 결과가 없습니다.
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 20 20" className="mt-1 h-5 w-5 shrink-0" fill="none" aria-hidden="true">
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
