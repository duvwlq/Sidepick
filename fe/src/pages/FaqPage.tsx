import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../components/common/HorizontalScroll';
import SearchBar from '../components/common/SearchBar';
import Layout from '../components/layout/Layout';
import { FAQ_CATEGORIES, FAQ_INTRO } from './faqData';

const ALL_TAG = '전체';

type SelectedTag = typeof ALL_TAG | (typeof FAQ_CATEGORIES)[number]['label'];

type VisibleFaqItem = {
  categoryId: string;
  categoryLabel: string;
  item: (typeof FAQ_CATEGORIES)[number]['items'][number];
  key: string;
};

const FAQ_DISCLAIMER_LINES = [
  '본 콘텐츠는 일반적인 가이드라인입니다. 개인 상황에 따라 결과가 다를 수 있으며,',
  '법률, 세금, 투자 관련 사항은 전문가 상담을 권장합니다.',
  '총 16개 카테고리로 정리했습니다.',
] as const;

export default function FaqPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<SelectedTag>(ALL_TAG);
  const [searchQuery, setSearchQuery] = useState('');

  const tags = useMemo(() => [ALL_TAG, ...FAQ_CATEGORIES.map((category) => category.label)], []);

  const visibleItems = useMemo<VisibleFaqItem[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const scopedCategories =
      selectedTag === ALL_TAG
        ? FAQ_CATEGORIES
        : FAQ_CATEGORIES.filter((category) => category.label === selectedTag);

    return scopedCategories.flatMap((category) =>
      category.items
        .filter((item) => {
          if (!normalizedQuery) {
            return true;
          }

          const haystack = `${category.label} ${item.question} ${item.answer}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        })
        .map((item) => ({
          categoryId: category.id,
          categoryLabel: category.label,
          item,
          key: `${category.id}-${item.id}`,
        })),
    );
  }, [searchQuery, selectedTag]);

  useEffect(() => {
    setExpandedKey(null);
  }, [searchQuery, selectedTag]);

  return (
    <Layout
      title="FAQ"
      leftType="back"
      rightIcon="search"
      onBack={() => navigate(-1)}
      onRightIconClick={() => searchInputRef.current?.focus()}
    >
      <div className="flex w-full flex-col bg-[#FFFFFF]">
        <section className="flex flex-col gap-3 bg-[#FFFFFF] px-5 pb-[14px] pt-6">
          <div className="flex flex-col gap-1">
            <p className="text-[14px] font-normal leading-[1.2] text-[#494949]">
              {FAQ_INTRO.eyebrow}
            </p>
            <h1 className="whitespace-pre-line text-[20px] font-semibold leading-[1.2] text-[#131416]">
              {FAQ_INTRO.title}
            </h1>
          </div>
          <div className="flex flex-col text-[10px] font-light leading-[1.4] text-[#5D5D5D]">
            <p>{`※ ${FAQ_DISCLAIMER_LINES[0]}`}</p>
            <p>{FAQ_DISCLAIMER_LINES[1]}</p>
            <p>{FAQ_DISCLAIMER_LINES[2]}</p>
          </div>
        </section>

        <section className="px-4 pb-4">
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="질문이나 키워드로 검색해보세요!"
          />
        </section>

        <section className="pb-4">
          <HorizontalScroll
            wrapperClassName="w-full px-4"
            contentClassName="horizontal-scroll-content--tags pr-4"
          >
            {tags.map((tag) => {
              const active = tag === selectedTag;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`flex shrink-0 items-center justify-center rounded-full px-[10px] py-1 ${
                    active ? 'bg-[#131416] text-[#FFFFFF]' : 'bg-[#EEEEEE] text-[#757575]'
                  }`}
                >
                  <span className="whitespace-nowrap text-[12px] font-normal leading-[1.2]">
                    {tag}
                  </span>
                </button>
              );
            })}
          </HorizontalScroll>
        </section>

        <section className="flex w-full flex-col border-t border-[#EEEEEE]">
          {visibleItems.length ? (
            visibleItems.map(({ categoryLabel, item, key }) => {
              const expanded = expandedKey === key;

              return (
                <article key={key} className="border-b border-[#EEEEEE]">
                  <button
                    type="button"
                    onClick={() => setExpandedKey((current) => (current === key ? null : key))}
                    className="flex w-full items-center justify-between bg-[#FFFFFF] px-[20px] py-[12px] text-left"
                    aria-expanded={expanded}
                  >
                    <div className="flex min-w-0 flex-[1_0_0] flex-col items-start justify-center gap-[4px]">
                      <p className="min-w-full text-left text-[12px] font-light leading-[14.4px] tracking-[0px] text-[#5E5E5E]">
                        {categoryLabel}
                      </p>
                      <div className="flex min-w-0 items-start">
                        <p className="break-words text-left text-[14px] font-semibold leading-[16.8px] tracking-[0px] text-[#000000]">
                          {item.question}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[#111111]">
                      {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="flex items-start gap-[4px] overflow-hidden bg-[#EEEEEE] p-[20px] text-left text-[12px] font-normal leading-[16.8px] tracking-[0px] not-italic">
                      <p className="shrink-0 whitespace-nowrap text-[#000000]">A.</p>
                      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-[10px] text-[#5E5E5E]">
                        <p className="w-full">안녕하세요. 사이드픽입니다.</p>
                        <p className="w-full whitespace-pre-line break-words">{item.answer}</p>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <div className="px-5 py-12 text-center text-sm leading-6 text-[#7A7A7A]">
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
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 8L10 13L15 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 12L10 7L15 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
