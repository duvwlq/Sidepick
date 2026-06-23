import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import BottomNav from '../components/layout/BottomNav';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import { TagChip } from '../components/common/Chip';
import { getAccessToken } from '../lib/session';
import { FAQ_CATEGORIES, FAQ_INTRO } from './faqData';

void FAQ_INTRO;

const ALL_TAG_ID = 'all';
const BUSINESS_CATEGORY_COUNT = 7;
const DEFAULT_PLACEHOLDER_COUNT = 6;
const SEARCH_PLACEHOLDER = '질문이나 키워드로 검색해보세요!';

type GuideCategory = (typeof FAQ_CATEGORIES)[number];
type GuideItem = GuideCategory['items'][number];
type TagDefinition = {
  id: string;
  displayLabel: string;
  sourceLabel?: string;
  tone: 'all' | 'green' | 'orange';
  width: number;
};

type VisibleGuideRow =
  | {
      key: string;
      mode: 'placeholder';
      tone: 'green' | 'orange';
    }
  | {
      key: string;
      mode: 'data';
      category: GuideCategory;
      categoryIndex: number;
      item: GuideItem;
      displayLabel: string;
    };

const TAG_DEFINITIONS: TagDefinition[] = [
  { id: ALL_TAG_ID, displayLabel: '전체', tone: 'all', width: 41 },
  { id: FAQ_CATEGORIES[0]?.id ?? 'online-commerce', displayLabel: '온라인 판매 · 이커머스', sourceLabel: FAQ_CATEGORIES[0]?.label, tone: 'green', width: 126 },
  { id: FAQ_CATEGORIES[1]?.id ?? 'content-sns', displayLabel: '콘텐츠 · SNS 기반', sourceLabel: FAQ_CATEGORIES[1]?.label, tone: 'green', width: 108 },
  { id: FAQ_CATEGORIES[2]?.id ?? 'digital-products', displayLabel: '디지털 상품·지식 판매', sourceLabel: FAQ_CATEGORIES[2]?.label, tone: 'green', width: 123 },
  { id: FAQ_CATEGORIES[3]?.id ?? 'platform-labor', displayLabel: '플랫폼 기반 노동형', sourceLabel: FAQ_CATEGORIES[3]?.label, tone: 'green', width: 109 },
  { id: FAQ_CATEGORIES[4]?.id ?? 'talent-freelance', displayLabel: '재능 판매·프리랜서', sourceLabel: FAQ_CATEGORIES[4]?.label, tone: 'green', width: 110 },
  { id: FAQ_CATEGORIES[5]?.id ?? 'investment', displayLabel: '투자·재테크', sourceLabel: FAQ_CATEGORIES[5]?.label, tone: 'green', width: 76 },
  { id: FAQ_CATEGORIES[6]?.id ?? 'offline-sidejob', displayLabel: '오프라인 기반 부업', sourceLabel: FAQ_CATEGORIES[6]?.label, tone: 'green', width: 109 },
  { id: FAQ_CATEGORIES[7]?.id ?? 'common', displayLabel: '부업 시작 전 공통', sourceLabel: FAQ_CATEGORIES[7]?.label, tone: 'orange', width: 102 },
  { id: FAQ_CATEGORIES[8]?.id ?? 'tax', displayLabel: '세금/사업자', sourceLabel: FAQ_CATEGORIES[8]?.label, tone: 'orange', width: 77 },
  { id: FAQ_CATEGORIES[9]?.id ?? 'day-job', displayLabel: '본업 + 부업', sourceLabel: FAQ_CATEGORIES[9]?.label, tone: 'orange', width: 75 },
  { id: FAQ_CATEGORIES[10]?.id ?? 'marketing', displayLabel: '마케팅/광고 운영', sourceLabel: FAQ_CATEGORIES[10]?.label, tone: 'orange', width: 100 },
  { id: FAQ_CATEGORIES[11]?.id ?? 'tools', displayLabel: '도구/툴 추천', sourceLabel: FAQ_CATEGORIES[11]?.label, tone: 'orange', width: 79 },
  { id: FAQ_CATEGORIES[12]?.id ?? 'mental', displayLabel: '멘탈 관리/번아웃', sourceLabel: FAQ_CATEGORIES[12]?.label, tone: 'orange', width: 100 },
  { id: FAQ_CATEGORIES[13]?.id ?? 'legal', displayLabel: '법률/계약', sourceLabel: FAQ_CATEGORIES[13]?.label, tone: 'orange', width: 66 },
  { id: FAQ_CATEGORIES[14]?.id ?? 'accounting', displayLabel: '회계/장부', sourceLabel: FAQ_CATEGORIES[14]?.label, tone: 'orange', width: 66 },
  { id: FAQ_CATEGORIES[15]?.id ?? 'insight', displayLabel: '부업 인사이트', sourceLabel: FAQ_CATEGORIES[15]?.label, tone: 'orange', width: 86 },
];

const TAG_LABEL_MAP = new Map(
  TAG_DEFINITIONS.filter((tag) => tag.id !== ALL_TAG_ID).map((tag) => [tag.id, tag.displayLabel]),
);
const TAG_SOURCE_LABEL_MAP = new Map(
  TAG_DEFINITIONS.filter((tag) => tag.id !== ALL_TAG_ID).map((tag) => [tag.id, tag.sourceLabel ?? '']),
);

void splitSentences;
void summarizeText;

const BUSINESS_GUIDE_FIXTURE = {
  checklist: [
    '스마트스토어 시작하려는데 뭐부터 해야 할까요?',
    '처음에 어떤 상품을 팔아야 잘 팔릴까요?',
    '광고비 얼마부터 시작하면 좋을까요?',
  ],
  failures: [
    '먼저 사업자 등록(간이과세자로 시작해도 OK)부터 하세요.',
    '그 다음엔 팔 상품을 1~2개로 좁혀서 도매 사이트를 먼저 보세요.',
    '한 번에 다 갖추려 하지 말고 단계별로 천천히 가는 게 좋아요.',
  ],
  tips: [
    '먼저 사업자 등록(간이과세자 시작 가능)과 통신판매업 신고 순서부터 익히세요.',
    '도매 사이트에서 경쟁 상품을 3개 정도 비교한 뒤 카테고리를 정하세요.',
  ],
};

const OTHER_GUIDE_FIXTURE = {
  steps: [
    { step: 1, title: '홈택스 접속 후 신청', description: '국세청 홈택스 → 사업자 등록 신청' },
    { step: 2, title: '업종 코드 + 과세 유형 선택', description: '간이과세자 vs 일반과세자 선택' },
    { step: 3, title: '서류 제출 및 완료', description: '신분증 업로드 → 3~5일 내 발급' },
  ],
  faqs: [
    { question: '직장 다니면서 사업자 등록 가능한가요?', answer: '가능합니다. 단, 회사 내 규정 확인 필수.' },
    { question: '간이과세자와 일반과세자 차이는?', answer: '연 매출 8,000만원 기준. 간이가 세금 부담 적음.' },
  ],
  legalLines: [
    '부업 수입이 연 500만원 초과 시 종합소득세 신고 의무 발생.',
    '미신고 시 가산세 부과될 수 있습니다.',
  ],
};

const FIGMA_FAQ_INTRO = {
  eyebrow: '사이드픽 부업 가이드',
  titleLines: ['부업, 정답은 없어요.', '먼저 걸어본 사람들의 이야기를 모았어요.'],
  disclaimerLines: [
    '본 컨텐츠는 일반적인 가이드 라인입니다.',
    '개인 상황에 따라 결과가 다를 수 있으며,',
    '법률, 세금, 투자 관련 사항은 전문가 상담을 권장합니다.',
    '총 16개 카테고리로 정리했습니다.',
  ],
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeSearchText(value: string) {
  return normalizeText(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.,!?/()[\]{}:;'"`~|<>@#$%^&*_+=\\-]+/g, ' ');
}

function splitSentences(value: string) {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+|(?<=다\.)\s+|(?<=요\.)\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);
}

function summarizeText(value: string, maxLength: number) {
  const normalized = normalizeText(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

function isBusinessCategory(categoryIndex: number) {
  return categoryIndex < BUSINESS_CATEGORY_COUNT;
}

function getDisplayLabel(category: GuideCategory) {
  return TAG_LABEL_MAP.get(category.id) ?? category.label;
}

function buildVisibleRows(selectedTagId: string, searchQuery: string) {
  const normalizedQuery = normalizeSearchText(searchQuery);

  const scopedCategories =
    selectedTagId === ALL_TAG_ID
      ? FAQ_CATEGORIES
      : FAQ_CATEGORIES.filter((category) => category.id === selectedTagId);

  return scopedCategories.flatMap((category, scopedIndex) => {
    const categoryIndex = FAQ_CATEGORIES.findIndex((entry) => entry.id === category.id);
    const displayLabel = getDisplayLabel(category);
    const sourceLabel = TAG_SOURCE_LABEL_MAP.get(category.id) ?? '';

    return category.items
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = normalizeSearchText([
          displayLabel,
          sourceLabel,
          category.label,
          item.question,
          item.answer,
        ]
          .join(' '));

        return haystack.includes(normalizedQuery);
      })
      .map((item) => ({
        key: `${category.id}-${item.id}-${scopedIndex}`,
        mode: 'data' as const,
        category,
        categoryIndex,
        item,
        displayLabel,
      }));
  }).slice(0, selectedTagId === ALL_TAG_ID && !normalizedQuery ? DEFAULT_PLACEHOLDER_COUNT : undefined);
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
      <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
        부업 가이드
      </h1>
      <div className="h-[24px] w-[24px]" aria-hidden="true" />
    </div>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block h-[36px] w-full cursor-text">
      <span className="absolute inset-0 flex items-center justify-between rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[8px]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="질문이나 키워드 검색"
          placeholder={SEARCH_PLACEHOLDER}
          className="h-full w-full bg-transparent font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#131416] outline-none placeholder:text-[#BABABA]"
        />
        <img src={searchIcon} alt="" className="h-[20px] w-[20px] shrink-0" />
      </span>
    </label>
  );
}

function CategoryChip({
  active,
  tone,
  label,
  width,
  onClick,
}: {
  active: boolean;
  tone: 'all' | 'green' | 'orange';
  label: string;
  width: number;
  onClick: () => void;
}) {
  const toneClassName = active
    ? tone === 'all'
      ? 'border border-[#494949] bg-[#494949] text-white'
      : tone === 'orange'
        ? 'border border-[#C06D43] bg-[#FFF4EE] text-[#C06D43]'
        : 'border border-[#5A876E] bg-[#EDF6F0] text-[#5A876E]'
    : tone === 'orange'
      ? 'border border-[#EEEEEE] bg-white text-[#C06D43]'
      : tone === 'all'
        ? 'border border-[#E6E6E6] bg-[#E6E6E6] text-[#8A8A8A]'
        : 'border border-[#EEEEEE] bg-white text-[#5A876E]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 overflow-hidden active:scale-[0.98]"
      style={{ width }}
      aria-pressed={active}
    >
      <span
        className={`inline-flex h-[26px] w-full items-center justify-center overflow-hidden rounded-[999px] px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] ${toneClassName}`}
      >
        <span className="whitespace-nowrap">{label}</span>
      </span>
    </button>
  );
}

function Chevron({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-[20px] w-[20px] shrink-0 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 8L10 13L15 8"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionDivider() {
  return <div className="h-px w-full bg-[#EEEEEE]" />;
}

function GuideStatBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[4px] bg-white px-[10px] py-[8px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <span className="font-['Pretendard'] text-[10px] font-[400] leading-[12px] tracking-[0px] text-[#5E5E5E]">
        {title}
      </span>
      <span className="pt-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-black">
        {value}
      </span>
    </div>
  );
}

function BulletRow({ text, color }: { text: string; color: 'green' | 'orange' }) {
  return (
    <div className="flex items-start gap-[6px]">
      <span
        className={`pt-[1px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] ${
          color === 'green' ? 'text-[#5A876E]' : 'text-[#C06D43]'
        }`}
      >
        ✓
      </span>
      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-black">
        {text}
      </p>
    </div>
  );
}

function NoteCard({
  iconTone,
  title,
  children,
}: {
  iconTone?: 'green' | 'orange';
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-[4px]">
        {iconTone ? (
          <span
            className={`flex h-[14px] w-[14px] items-center justify-center rounded-full text-[10px] leading-none ${
              iconTone === 'green' ? 'bg-[#5A876E] text-white' : 'bg-[#C06D43] text-white'
            }`}
          >
            {iconTone === 'green' ? '✓' : '!'}
          </span>
        ) : null}
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#131416]">
          {title}
        </p>
      </div>
      <div className="pt-[8px]">
        <SectionDivider />
      </div>
      <div className="pt-[8px]">{children}</div>
    </div>
  );
}

function TagBadge({ label, tone }: { label: string; tone: 'orange' | 'green' | 'gray' }) {
  return (
    <TagChip
      label={label}
      tone={tone === 'orange' ? 'primary' : tone === 'green' ? 'secondary' : 'gray'}
      className="h-[18px] rounded-[4px] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px]"
    />
  );
}

function SimilarCaseCard({
  categoryLabel,
  onClick,
}: {
  categoryLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <button
        type="button"
        onClick={onClick}
        className="rounded-[4px] bg-[#F8F8F8] px-[12px] py-[8px] text-left active:opacity-80"
      >
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-wrap gap-[4px]">
            <TagBadge label="타입" tone="orange" />
            <TagBadge label={categoryLabel} tone="green" />
            <TagBadge label="키워드" tone="gray" />
            <TagBadge label="키워드" tone="gray" />
          </div>
          <div className="flex items-center gap-[4px] pt-[1px]">
            <div className="h-[4px] w-[30px] rounded-[999px] bg-[#EEEEEE]">
              <div className="h-[4px] w-[30px] rounded-[999px] bg-[#5A876E]" />
            </div>
            <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#5A876E]">
              99%
            </span>
          </div>
        </div>

        <div className="pt-[8px]">
          <p className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
            제목
          </p>
          <p className="pt-[4px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
            본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기
          </p>
        </div>

        <div className="flex items-center justify-between pt-[16px]">
          <p className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            닉네임 • 2026.00.00 • 조회 999
          </p>
          <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            999
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onClick}
        className="rounded-[10px] bg-[#5A876E] px-[10px] py-[12px] text-left active:brightness-95"
      >
        <p className="font-['Pretendard'] text-[10px] font-[400] leading-[12px] tracking-[0px] text-[#CBE5D8]">
          비슷한 사례 더 보기
        </p>
        <div className="flex items-center justify-between pt-[5px]">
          <div className="flex items-center gap-[4px]">
            <img src={searchIcon} alt="" className="h-[14px] w-[14px]" />
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#F8F8F8]">
              ({categoryLabel}) 사례 탐색하기
            </span>
          </div>
          <span className="font-['Pretendard'] text-[18px] font-[400] leading-none text-white">›</span>
        </div>
      </button>
    </div>
  );
}

function BusinessExpandedContent({
  category,
  item,
  displayLabel,
  onExplore,
}: {
  category: GuideCategory;
  item: GuideItem;
  displayLabel: string;
  onExplore: () => void;
}) {
  const checklistItems = BUSINESS_GUIDE_FIXTURE.checklist;
  const failureItems = BUSINESS_GUIDE_FIXTURE.failures;
  const tipItems = BUSINESS_GUIDE_FIXTURE.tips;
  void category;
  void item;

  return (
    <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
      <div className="flex gap-[8px]">
        <GuideStatBox title="난이도" value="---" />
        <GuideStatBox title="추천 자본금" value="---" />
      </div>
      <div className="flex gap-[8px]">
        <GuideStatBox title="추천 대상" value="---" />
        <GuideStatBox title="평균 첫 수익" value="---" />
      </div>

      <NoteCard iconTone="green" title="시작 전 체크리스트">
        <div className="flex flex-col gap-[8px]">
          {checklistItems.map((entry, index) => (
            <BulletRow key={`${entry}-${index}`} text={entry} color="green" />
          ))}
        </div>
      </NoteCard>

      <NoteCard iconTone="orange" title="주요 실패 원인">
        <div className="flex flex-col gap-[8px]">
          {failureItems.length ? (
            failureItems.map((entry, index) => (
              <BulletRow key={`${entry}-${index}`} text={entry} color="orange" />
            ))
          ) : (
            <BulletRow
              text="광고비, 운영비, 시간 대비 효율을 먼저 점검하세요."
              color="orange"
            />
          )}
        </div>
      </NoteCard>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
          실전 Tip
        </p>
        <div className="pt-[12px]">
          <SectionDivider />
        </div>
        <div className="flex flex-col gap-[4px] pt-[12px]">
          {tipItems.map((entry, index) => (
            <div key={`${entry}-${index}`} className="flex items-start gap-[4px]">
              <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5A876E]">
                *
              </span>
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-black">
                {entry}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
          추천 사례
        </p>
        <div className="pt-[12px]">
          <SimilarCaseCard categoryLabel={displayLabel} onClick={onExplore} />
        </div>
      </div>
    </div>
  );
}

function OtherExpandedContent({
  category,
  item,
}: {
  category: GuideCategory;
  item: GuideItem;
}) {
  const steps = OTHER_GUIDE_FIXTURE.steps;
  const faqs = OTHER_GUIDE_FIXTURE.faqs;
  const legalLines = OTHER_GUIDE_FIXTURE.legalLines;
  void item;

  return (
    <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#131416]">
          절차 단계
        </p>
        <div className="pt-[8px]">
          <SectionDivider />
        </div>
        <div className="flex flex-col gap-[8px] pt-[8px]">
          {steps.map((entry) => (
            <div key={`${category.id}-${entry.step}`} className="flex items-start gap-[6px]">
              <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#CBE5D8] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
                {entry.step}
              </span>
              <div className="pt-[1px]">
                <p className="font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
                  {entry.title}
                </p>
                <p className="font-['Pretendard'] text-[10px] font-[300] leading-[14px] tracking-[0px] text-[#5E5E5E]">
                  {entry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#131416]">
          FAQ
        </p>
        <div className="flex flex-col gap-[8px] pt-[8px]">
          {faqs.map((entry, index) => (
            <div key={`${category.id}-${index}`} className="rounded-[4px] bg-[#F8F8F8] px-[12px] py-[8px]">
              <div className="flex items-start gap-[2px]">
                <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#C06D43]">
                  Q.
                </span>
                <p className="font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
                  {entry.question}
                </p>
              </div>
              <p className="pt-[4px] font-['Pretendard'] text-[10px] font-[300] leading-[14px] tracking-[0px] text-[#5E5E5E]">
                {entry.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      <NoteCard iconTone="orange" title="법적 안내 / 주의사항">
        <div className="flex flex-col gap-[2px]">
          {legalLines.map((entry, index) => (
            <div key={`${entry}-${index}`} className="flex items-start gap-[4px]">
              <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#C06D43]">
                *
              </span>
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#C06D43]">
                {entry}
              </p>
            </div>
          ))}
        </div>
      </NoteCard>
    </div>
  );
}

function PlaceholderAccordionRow({ tone }: { tone: 'green' | 'orange' }) {
  const accentColor = tone === 'green' ? '#5A876E' : '#C06D43';

  return (
    <div className="w-full">
      <button
        type="button"
        className="flex min-h-[61px] w-full items-center justify-between bg-white px-[20px] py-[12px] text-left"
        aria-expanded="false"
      >
        <div className="min-w-0 flex-1">
          <p
            className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px]"
            style={{ color: accentColor }}
          >
            카테고리
          </p>
          <p className="pt-[4px] font-['Pretendard'] text-[16px] font-[400] leading-[19.2px] tracking-[0px] text-black">
            제목
          </p>
        </div>
        <Chevron expanded={false} color={accentColor} />
      </button>
    </div>
  );
}

function GuideAccordionRow({
  row,
  expanded,
  onToggle,
  onExploreCategory,
}: {
  row: VisibleGuideRow;
  expanded: boolean;
  onToggle: () => void;
  onExploreCategory: () => void;
}) {
  if (row.mode === 'placeholder') {
    return <PlaceholderAccordionRow tone={row.tone} />;
  }

  const business = isBusinessCategory(row.categoryIndex);
  const accentColor = business ? '#5A876E' : '#C06D43';

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[61px] w-full items-center justify-between bg-white px-[20px] py-[12px] text-left active:bg-[#FAFAFA]"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p
            className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px]"
            style={{ color: accentColor }}
          >
            {row.displayLabel}
          </p>
          <p className="pt-[4px] font-['Pretendard'] text-[16px] font-[400] leading-[19.2px] tracking-[0px] text-black">
            {row.item.question}
          </p>
        </div>
        <Chevron expanded={expanded} color={accentColor} />
      </button>

      {expanded ? (
        business ? (
          <BusinessExpandedContent
            category={row.category}
            item={row.item}
            displayLabel={row.displayLabel}
            onExplore={onExploreCategory}
          />
        ) : (
          <OtherExpandedContent category={row.category} item={row.item} />
        )
      ) : null}
    </div>
  );
}

/* function FabMenu({
  expanded,
  onToggle,
  onCreate,
}: {
  expanded: boolean;
  onToggle: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="absolute right-[24px] top-[16px]">
      {expanded ? (
        <button
          type="button"
          onClick={onCreate}
          className="absolute right-0 top-[-49px] flex h-[41px] min-w-[122px] items-center gap-[8px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0_0_4px_rgba(0,0,0,0.15)] active:opacity-80"
        >
          <img src={editIcon} alt="" className="h-[17px] w-[17px]" />
          <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-black">
            경험 작성
          </span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-[36px] w-[36px] items-center justify-center rounded-full ${
          expanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
        } shadow-[0_0_2px_rgba(0,0,0,0.15)] active:brightness-95`}
        aria-label={expanded ? '경험 작성 닫기' : '경험 작성'}
      >
        <img
          src={plusIcon}
          alt=""
          className={`transition-transform duration-150 ${expanded ? 'h-[18px] w-[18px] rotate-45' : 'h-[18px] w-[18px]'}`}
        />
      </button>
    </div>
  );
}

function BottomNavigation({
  expanded,
  onToggleFab,
  onCreate,
}: {
  expanded: boolean;
  onToggleFab: () => void;
  onCreate: () => void;
}) {
  const navigate = useNavigate();
  const token = getAccessToken();

  function move(path: string, requiresAuth?: boolean) {
    if (requiresAuth && !token) {
      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent('마이페이지는 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }
    navigate(path);
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[375px] -translate-x-1/2">
      <div className="relative h-[68px]">
        <FabMenu expanded={expanded} onToggle={onToggleFab} onCreate={onCreate} />
      </div>
      <nav className="flex h-[84px] items-start justify-between rounded-t-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => move('/')}
          className="flex flex-col items-center gap-[4px] active:opacity-70"
        >
          <img src={homeIcon} alt="" className="h-[22px] w-[20px] opacity-30" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[12px] tracking-[0px] text-[rgba(0,0,0,0.3)]">
            홈
          </span>
        </button>
        <button
          type="button"
          onClick={() => move('/explore')}
          className="flex flex-col items-center gap-[4px] active:opacity-70"
        >
          <img src={searchNavIcon} alt="" className="h-[20px] w-[20px] opacity-30" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[12px] tracking-[0px] text-[rgba(0,0,0,0.3)]">
            탐색
          </span>
        </button>
        <button
          type="button"
          onClick={() => move('/faq')}
          className="flex flex-col items-center gap-[4px] active:opacity-70"
          aria-current="page"
        >
          <img src={guideIcon} alt="" className="h-[22px] w-[18px]" />
          <span className="font-['Pretendard'] text-[12px] font-[600] leading-[12px] tracking-[0px] text-[#5A876E]">
            가이드
          </span>
        </button>
        <button
          type="button"
          onClick={() => move('/mypage', true)}
          className="flex flex-col items-center gap-[4px] active:opacity-70"
        >
          <img src={userIcon} alt="" className="h-[20px] w-[18px] opacity-30" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[12px] tracking-[0px] text-[rgba(0,0,0,0.3)]">
            MY
          </span>
        </button>
      </nav>
    </div>
  );
}

void BottomNavigation; */

export default function FaqPage() {
  const navigate = useNavigate();
  const [selectedTagId, setSelectedTagId] = useState(ALL_TAG_ID);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [fabExpanded, setFabExpanded] = useState(false);

  const visibleRows = useMemo(
    () => buildVisibleRows(selectedTagId, searchQuery),
    [selectedTagId, searchQuery],
  );

  function moveBack() {
    if (window.history.length <= 1 || document.referrer === '' || !document.referrer.startsWith(window.location.origin)) {
      navigate('/');
      return;
    }

    navigate(-1);
  }

  function moveToCreate() {
    setFabExpanded(false);
    const token = getAccessToken();
    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }
    navigate('/create');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <div className="fixed left-1/2 top-0 z-30 w-full max-w-[375px] -translate-x-1/2 bg-white">
          <Header onBack={moveBack} />
        </div>

        <main className="px-[20px] pb-[168px] pt-[143px]">
          <section>
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5A876E]">
              {FIGMA_FAQ_INTRO.eyebrow}
            </p>
            <h2 className="pt-[4px] font-['Pretendard'] text-[20px] font-[600] leading-[24px] tracking-[0px] text-[#131416]">
              {FIGMA_FAQ_INTRO.titleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h2>
            <div className="flex gap-[4px] pt-[12px]">
              <span className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
                ※
              </span>
              <div className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
                {FIGMA_FAQ_INTRO.disclaimerLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </section>
          <section className="hidden">
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5A876E]">
              사이드픽 부업 가이드
            </p>
            <h2 className="pt-[4px] font-['Pretendard'] text-[20px] font-[600] leading-[24px] tracking-[0px] text-[#131416]">
              부업, 정답은 없어요.
              <br />
              먼저 걸어본 사람들의 이야기를 모았어요.
            </h2>
            <div className="flex gap-[4px] pt-[12px]">
              <span className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
                ※
              </span>
              <div className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
                <p>본 컨텐츠는 일반적인 가이드 라인입니다.</p>
                <p>개인 상황에 따라 결과가 다를 수 있으며,</p>
                <p>법률, 세금, 투자 관련 사항은 전문가 상담을 권장합니다.</p>
                <p>총 16개 카테고리로 정리했습니다.</p>
              </div>
            </div>
          </section>

          <section className="-mx-[20px] px-[16px] pt-[16px]">
            <SearchField
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setExpandedKey(null);
              }}
            />
          </section>

          <section className="-mx-[20px] px-[16px] pt-[16px]">
            <div className="flex w-[343px] max-w-full flex-wrap content-start gap-x-[6px] gap-y-[6px]">
              {TAG_DEFINITIONS.map((tag) => (
                <CategoryChip
                  key={tag.id}
                  active={selectedTagId === tag.id}
                  tone={tag.tone}
                  label={tag.displayLabel}
                  width={tag.width}
                  onClick={() => {
                    setSelectedTagId(tag.id);
                    setExpandedKey(null);
                  }}
                />
              ))}
            </div>
          </section>

          <section className="-mx-[20px] pt-[16px]">
            {visibleRows.length ? (
              <div className="flex flex-col">
                {visibleRows.map((row) => (
                  <GuideAccordionRow
                    key={row.key}
                    row={row}
                    expanded={row.mode === 'data' && expandedKey === row.key}
                    onToggle={() => {
                      setExpandedKey((current) => (current === row.key ? null : row.key));
                    }}
                    onExploreCategory={() => {
                      if (row.mode !== 'data') {
                        return;
                      }
                      navigate(`/explore?q=${encodeURIComponent(row.displayLabel)}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="px-[20px] py-[48px] text-center">
                <p className="font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#8A8A8A]">
                  검색 결과가 없어요. 다른 질문이나 키워드로 찾아보세요.
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
