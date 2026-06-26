import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import CrossTopicGuideSection from '../components/guide/CrossTopicGuideSection';
import GuideDetailSection from '../components/guide/GuideDetailSection';
import BottomNav from '../components/layout/BottomNav';
import { getAccessToken } from '../lib/session';
import { FAQ_CATEGORIES, FAQ_INTRO, type FaqCategory, type FaqItem } from './faqData';

const ALL_TAG_ID = 'all';

const BUSINESS_CATEGORY_IDS = new Set([
  'online-commerce',
  'content-sns',
  'digital-products',
  'platform-labor',
  'talent-freelance',
  'investment',
  'offline-sidejob',
]);

type GuideRow = {
  key: string;
  category: FaqCategory;
  item: FaqItem;
};

function isBusinessCategory(categoryId: string) {
  return BUSINESS_CATEGORY_IDS.has(categoryId);
}

function buildIntroLines(value: string[] | string | undefined) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-[64px] items-center justify-between bg-white px-[16px] py-[20px]">
      <button
        type="button"
        onClick={onBack}
        className="flex h-[24px] w-[24px] items-center justify-center active:opacity-60"
        aria-label="뒤로가기"
      >
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
      </button>
      <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">부업 가이드</h1>
      <div className="h-[24px] w-[24px]" aria-hidden="true" />
    </div>
  );
}

function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-[44px] items-center gap-[8px] rounded-[999px] border border-[#EEEEEE] bg-white px-[16px]">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="궁금한 질문을 검색해보세요"
        className="h-full flex-1 bg-transparent font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black outline-none placeholder:text-[#B8B8B8]"
      />
      <img src={searchIcon} alt="" className="h-[20px] w-[20px]" />
    </div>
  );
}

function GuideCategoryChip({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex h-[26px] items-center justify-center whitespace-nowrap rounded-[999px] border px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] ${className}`}
    >
      {label}
    </span>
  );
}

function GuideAccordionRow({
  row,
  expanded,
  onToggle,
  onExploreCategory,
}: {
  row: GuideRow;
  expanded: boolean;
  onToggle: () => void;
  onExploreCategory: () => void;
}) {
  const isBusiness = isBusinessCategory(row.category.id);

  return (
    <div className="overflow-hidden rounded-[12px] bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-[12px] px-[6px] py-[14px] text-left active:opacity-80"
      >
        <div className="min-w-0 flex-1">
          <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#5A876E]">
            {row.category.label}
          </p>
          <p className="pt-[8px] font-['Pretendard'] text-[16px] font-[500] leading-[22px] text-black">
            {row.item.question}
          </p>
        </div>
        <span
          className={`pt-[10px] text-[20px] leading-none text-[#5A876E] transition-transform duration-150 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          ˅
        </span>
      </button>

      {expanded ? (
        isBusiness ? (
          <GuideDetailSection
            categoryId={row.category.id}
            answer={row.item.answer}
            displayLabel={row.category.label}
            onExplore={onExploreCategory}
          />
        ) : (
          <CrossTopicGuideSection answer={row.item.answer} />
        )
      ) : null}
    </div>
  );
}

export default function FaqPage() {
  const navigate = useNavigate();
  const [selectedTagId, setSelectedTagId] = useState(ALL_TAG_ID);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [fabExpanded, setFabExpanded] = useState(false);
  const introTitleLines = buildIntroLines((FAQ_INTRO as { titleLines?: string[]; title?: string }).titleLines ?? (FAQ_INTRO as { title?: string }).title);
  const introDisclaimerLines = buildIntroLines(
    (FAQ_INTRO as { disclaimerLines?: string[]; disclaimer?: string }).disclaimerLines ??
      (FAQ_INTRO as { disclaimer?: string }).disclaimer,
  );
  const resolvedIntroDisclaimerLines = useMemo(() => {
    const totalLine = `총 ${FAQ_CATEGORIES.length}개 카테고리로 정리했습니다.`;
    return introDisclaimerLines.some((line) => line.includes('카테고리'))
      ? introDisclaimerLines
      : [...introDisclaimerLines, totalLine];
  }, [introDisclaimerLines]);

  const rows = useMemo<GuideRow[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return FAQ_CATEGORIES.filter((category) => selectedTagId === ALL_TAG_ID || category.id === selectedTagId).flatMap((category) =>
      category.items
        .filter((item) => {
          if (!normalizedQuery) {
            return true;
          }

          return `${category.label} ${item.question} ${item.answer}`.toLowerCase().includes(normalizedQuery);
        })
        .map((item) => ({
          key: `${category.id}-${item.id}`,
          category,
          item,
        })),
    );
  }, [searchQuery, selectedTagId]);

  function moveBack() {
    navigate(-1);
  }

  function moveToCreate() {
    setFabExpanded(false);
    const token = getAccessToken();
    if (!token) {
      navigate(`/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`);
      return;
    }

    navigate('/create');
  }

  function getChipTone(categoryId: string, selected: boolean) {
    const business = isBusinessCategory(categoryId);

    if (selected) {
      return business
        ? 'bg-[#5A876E] text-white border-[#5A876E]'
        : 'bg-[#D9824E] text-white border-[#D9824E]';
    }

    return business
      ? 'bg-white text-[#5A876E] border-[#CBE5D8]'
      : 'bg-white text-[#D9824E] border-[#F0C7AF]';
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <div className="fixed left-1/2 top-0 z-30 w-full max-w-[375px] -translate-x-1/2 bg-white">
          <Header onBack={moveBack} />
        </div>

        <main className="px-[16px] pb-[132px] pt-[80px]">
          <section className="rounded-[16px] bg-[#F8F8F8] px-[16px] py-[20px]">
            <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#5A876E]">
              {FAQ_INTRO.eyebrow}
            </p>
            <h2 className="pt-[6px] font-['Pretendard'] text-[22px] font-[600] leading-[30px] text-[#131416]">
              {introTitleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <div className="pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[18px] text-[#6E6E6E]">
              {resolvedIntroDisclaimerLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>

          <section className="pt-[16px]">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </section>

          <section className="flex flex-wrap gap-[8px] pt-[16px]">
            <button type="button" onClick={() => setSelectedTagId(ALL_TAG_ID)} className="shrink-0">
              <GuideCategoryChip
                label="전체"
                className={
                  selectedTagId === ALL_TAG_ID
                    ? 'border-[#5A876E] bg-[#5A876E] text-white'
                    : 'border-[#E6E6E6] bg-white text-[#5D5D5D]'
                }
              />
            </button>
            {FAQ_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedTagId(category.id)}
                className="shrink-0"
              >
                <GuideCategoryChip
                  label={category.label}
                  className={getChipTone(category.id, selectedTagId === category.id)}
                />
              </button>
            ))}
          </section>

          <section className="pt-[20px]">
            <div className="flex items-center justify-between">
              <p className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#131416]">
                질문 {rows.length}개
              </p>
            </div>

            {rows.length ? (
              <div className="flex flex-col gap-[18px] pt-[18px]">
                {rows.map((row) => (
                  <GuideAccordionRow
                    key={row.key}
                    row={row}
                    expanded={expandedKey === row.key}
                    onToggle={() => setExpandedKey((current) => (current === row.key ? null : row.key))}
                    onExploreCategory={() => navigate(`/explore?q=${encodeURIComponent(row.category.label)}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[12px] bg-[#F8F8F8] px-[16px] py-[32px] text-center">
                <p className="font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] text-[#131416]">
                  검색 결과가 없어요.
                </p>
                <p className="pt-[6px] font-['Pretendard'] text-[13px] font-[400] leading-[18px] text-[#8A8A8A]">
                  다른 질문이나 키워드로 다시 찾아보세요.
                </p>
              </div>
            )}
          </section>
        </main>

        <BottomNav
          active="guide"
          showFab
          fabExpanded={fabExpanded}
          onFabToggle={() => setFabExpanded((current) => !current)}
          onCreateClick={moveToCreate}
        />
      </div>
    </div>
  );
}


