import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import Layout from '../components/layout/Layout';
import { FAQ_CATEGORIES, FAQ_INTRO } from './faqData';

const ALL_TAG = '전체';

const BUSINESS_FIELD_CATEGORIES = new Set<string>([
  'online-commerce',
  'content-sns',
  'digital-products',
  'platform-labor',
  'talent-freelance',
  'investment',
  'offline-sidejob',
]);

type SelectedTag = typeof ALL_TAG | (typeof FAQ_CATEGORIES)[number]['label'];

type VisibleFaqItem = {
  categoryId: string;
  categoryLabel: string;
  item: (typeof FAQ_CATEGORIES)[number]['items'][number];
  key: string;
};

type CrossTopicSections = {
  type: 'cross_topic';
  steps: string[];
  answer: string;
  warnings: string;
};

type BusinessFieldSections = {
  type: 'business_field';
  tips: string[];
  failures: string[];
  warnings: string;
};

type ParsedSections = CrossTopicSections | BusinessFieldSections | { type: 'plain'; text: string };

const FAQ_DISCLAIMER_LINES = [
  '본 컨텐츠는 일반적인 가이드 라인입니다.',
  '개인 상황에 따라 결과가 다를 수 있으며,',
  '법률, 세금, 투자 관련 사항은 전문가 상담을 권장합니다.',
  '총 16개 카테고리로 정리했습니다.',
] as const;

function parseNumberedList(block: string): string[] {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, ''))
    .filter(Boolean);
}

function splitByHeaders(answer: string): Record<string, string> {
  const result: Record<string, string> = {};
  const headerRe = /\*\*([^*]+)\*\*/g;
  const matches: Array<{ header: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(answer)) !== null) {
    matches.push({ header: m[1].trim(), start: m.index, end: m.index + m[0].length });
  }
  if (!matches.length) return result;
  for (let i = 0; i < matches.length; i += 1) {
    const next = matches[i + 1];
    const bodyStart = matches[i].end;
    const bodyEnd = next ? next.start : answer.length;
    result[matches[i].header] = answer.slice(bodyStart, bodyEnd).trim();
  }
  return result;
}

function parseAnswerSections(categoryId: string, answer: string): ParsedSections {
  const sections = splitByHeaders(answer);
  const isBusiness = BUSINESS_FIELD_CATEGORIES.has(categoryId);

  if (isBusiness) {
    const tips = sections['실전 Tip'];
    const failures = sections['실패 요인 TOP3'];
    const warnings = sections['주의사항'];
    if (tips && failures && warnings) {
      return {
        type: 'business_field',
        tips: parseNumberedList(tips),
        failures: parseNumberedList(failures),
        warnings,
      };
    }
  } else {
    const steps = sections['절차 단계'];
    const ans = sections['답변'];
    const warnings = sections['주의사항·법적 안내'] ?? sections['주의사항'];
    if (steps && ans && warnings) {
      return {
        type: 'cross_topic',
        steps: parseNumberedList(steps),
        answer: ans,
        warnings,
      };
    }
  }

  return { type: 'plain', text: answer };
}

export default function FaqPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<SelectedTag>(ALL_TAG);
  const [searchQuery, setSearchQuery] = useState('');

  const tags = useMemo(
    () => [
      { label: ALL_TAG, type: 'all' as const },
      ...FAQ_CATEGORIES.map((category) => ({
        label: category.label,
        type: BUSINESS_FIELD_CATEGORIES.has(category.id)
          ? ('business' as const)
          : ('cross' as const),
      })),
    ],
    [],
  );

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
      showChatbotFab={false}
      bottomNavActive="guide"
      bottomNavShowFab
      maxWidthClass="max-w-[375px]"
      onBack={() => navigate(-1)}
      onBottomNavCreateClick={() => navigate('/chatbot')}
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
          <div className="flex flex-col text-[12px] font-light leading-[1.4] text-[#8A8A8A]">
            <p>{`※ ${FAQ_DISCLAIMER_LINES[0]}`}</p>
            <p>{FAQ_DISCLAIMER_LINES[1]}</p>
            <p>{FAQ_DISCLAIMER_LINES[2]}</p>
            <p>{FAQ_DISCLAIMER_LINES[3]}</p>
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

        <section className="w-full px-4 pb-4">
          <div className="flex flex-wrap gap-[8px]">
            {tags.map(({ label, type }) => {
              const active = label === selectedTag;
              const activeBg =
                type === 'business'
                  ? 'bg-[#5A876E]'
                  : type === 'cross'
                    ? 'bg-[#C06D43]'
                    : 'bg-[#494949]';
              const inactiveText =
                type === 'business'
                  ? 'text-[#5A876E]'
                  : type === 'cross'
                    ? 'text-[#C06D43]'
                    : 'text-[#131416]';

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedTag(label)}
                  className={`flex h-[26px] items-center justify-center rounded-[999px] px-[10px] ${
                    active
                      ? `${activeBg} text-[#FFFFFF]`
                      : `border border-[#EEEEEE] bg-[#FFFFFF] ${inactiveText}`
                  }`}
                >
                  <span className="whitespace-nowrap text-[12px] font-[500] leading-[14px]">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex w-full flex-col border-t border-[#EEEEEE]">
          {visibleItems.length ? (
            visibleItems.map(({ categoryId, categoryLabel, item, key }) => {
              const expanded = expandedKey === key;
              const sections = parseAnswerSections(categoryId, item.answer);
              const isBusiness = BUSINESS_FIELD_CATEGORIES.has(categoryId);

              return (
                <article key={key} className="border-b border-[#EEEEEE]">
                  <button
                    type="button"
                    onClick={() => setExpandedKey((current) => (current === key ? null : key))}
                    className="flex w-full items-center justify-between bg-[#FFFFFF] px-[20px] py-[12px] text-left"
                    aria-expanded={expanded}
                  >
                    <div className="flex min-w-0 flex-[1_0_0] flex-col items-start justify-center gap-[4px]">
                      <p
                        className={`min-w-full text-left text-[12px] font-semibold leading-[1.2] tracking-[0px] ${
                          isBusiness ? 'text-[#5A876E]' : 'text-[#C06D43]'
                        }`}
                      >
                        {categoryLabel}
                      </p>
                      <div className="flex items-start">
                        <p className="truncate text-left text-[16px] font-normal leading-[1.2] tracking-[0px] text-[#131416]">
                          {item.question}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[#111111]">
                      {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </span>
                  </button>

                  {expanded ? <ExpandedSections sections={sections} /> : null}
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

function ExpandedSections({ sections }: { sections: ParsedSections }) {
  if (sections.type === 'cross_topic') {
    return (
      <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
        <SectionCard title="답변">
          <p className="whitespace-pre-line text-[13px] font-normal leading-[20px] text-[#131416]">
            {sections.answer}
          </p>
        </SectionCard>

        <SectionCard title="절차 단계">
          <ol className="flex flex-col gap-[8px]">
            {sections.steps.map((step, index) => (
              <li key={`step-${index}`} className="flex items-start gap-[6px]">
                <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#CBE5D8] text-[12px] font-semibold leading-[14.4px] text-[#5A876E]">
                  {index + 1}
                </span>
                <p className="pt-[1px] text-[12px] font-medium leading-[16.8px] text-[#131416]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </SectionCard>

        <NoteCard iconTone="orange" title="법적 안내 / 주의사항">
          <div className="flex items-start gap-[4px]">
            <span className="text-[12px] font-normal leading-[16.8px] text-[#C06D43]">*</span>
            <p className="whitespace-pre-line text-[12px] font-normal leading-[16.8px] text-[#C06D43]">
              {sections.warnings}
            </p>
          </div>
        </NoteCard>
      </div>
    );
  }

  if (sections.type === 'business_field') {
    return (
      <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
        <SectionCard title="실전 Tip" titleColor="#5A876E">
          <ol className="flex flex-col gap-[6px]">
            {sections.tips.map((tip, index) => (
              <li key={`tip-${index}`} className="flex items-start gap-[6px]">
                <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#CBE5D8] text-[12px] font-semibold leading-[14.4px] text-[#5A876E]">
                  {index + 1}
                </span>
                <p className="pt-[1px] text-[12px] font-normal leading-[16.8px] text-[#131416]">
                  {tip}
                </p>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="실패 요인 TOP3" titleColor="#C06D43">
          <ol className="flex flex-col gap-[6px]">
            {sections.failures.map((fail, index) => (
              <li key={`fail-${index}`} className="flex items-start gap-[6px]">
                <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#FFD9C6] text-[12px] font-semibold leading-[14.4px] text-[#C06D43]">
                  {index + 1}
                </span>
                <p className="pt-[1px] text-[12px] font-normal leading-[16.8px] text-[#131416]">
                  {fail}
                </p>
              </li>
            ))}
          </ol>
        </SectionCard>

        <NoteCard iconTone="orange" title="주의사항">
          <p className="whitespace-pre-line text-[12px] font-normal leading-[16.8px] text-[#C06D43]">
            {sections.warnings}
          </p>
        </NoteCard>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-[4px] overflow-hidden bg-[#EEEEEE] p-[20px] text-left text-[12px] font-normal leading-[16.8px] tracking-[0px] not-italic">
      <p className="shrink-0 whitespace-nowrap text-[#000000]">A.</p>
      <div className="flex min-w-0 flex-[1_0_0] flex-col items-start gap-[10px] text-[#5E5E5E]">
        <p className="w-full">안녕하세요. 사이드픽입니다.</p>
        <p className="w-full whitespace-pre-line break-words">{sections.text}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  titleColor,
  children,
}: {
  title: string;
  titleColor?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <p
        className="text-[12px] font-semibold leading-[14.4px]"
        style={{ color: titleColor ?? '#131416' }}
      >
        {title}
      </p>
      <div className="my-[8px] h-px w-full bg-[#EEEEEE]" />
      {children}
    </div>
  );
}

function NoteCard({
  iconTone,
  title,
  children,
}: {
  iconTone: 'green' | 'orange';
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-[4px]">
        <span
          className={`flex h-[14px] w-[14px] items-center justify-center rounded-full text-[10px] leading-none text-white ${
            iconTone === 'green' ? 'bg-[#5A876E]' : 'bg-[#C06D43]'
          }`}
        >
          {iconTone === 'green' ? '✓' : '!'}
        </span>
        <p className="text-[12px] font-semibold leading-[14.4px] text-[#131416]">{title}</p>
      </div>
      <div className="my-[8px] h-px w-full bg-[#EEEEEE]" />
      {children}
    </div>
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
