import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExperiences, type Experience } from '../../lib/api';
import RecommendedCaseCard from './RecommendedCaseCard';

type GuideDetailSectionProps = {
  categoryId: string;
  answer: string;
  displayLabel: string;
  onExplore: () => void;
};

type GuideStats = {
  difficulty: string;
  capital: string;
  target: string;
  firstIncome: string;
};

type ParsedGuideSection =
  | {
      type: 'business';
      tips: string[];
      failures: string[];
      warnings: string;
    }
  | {
      type: 'plain';
      paragraphs: string[];
    };

const BUSINESS_CATEGORY_IDS = new Set([
  'online-commerce',
  'content-sns',
  'digital-products',
  'platform-labor',
  'talent-freelance',
  'investment',
  'offline-sidejob',
]);

const TARGET_LABELS: Record<string, string> = {
  'online-commerce': '상품 판매 입문자',
  'content-sns': '콘텐츠 제작 입문자',
  'digital-products': '무형 상품 판매형',
  'platform-labor': '즉시 시작형',
  'talent-freelance': '경험 활용형',
  investment: '소액 투자형',
  'offline-sidejob': '주말 병행형',
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function splitSentences(value: string) {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);
}

function buildParagraphs(answer: string) {
  const sentences = splitSentences(answer);
  if (!sentences.length) {
    return normalizeText(answer) ? [normalizeText(answer)] : [];
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(' '));
  }
  return paragraphs;
}

function parseNumberedList(block: string) {
  return splitLines(block)
    .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
    .filter(Boolean);
}

function splitByBoldHeaders(answer: string) {
  const headerRe = /\*\*([^*]+)\*\*/g;
  const matches: Array<{ header: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = headerRe.exec(answer)) !== null) {
    matches.push({
      header: normalizeText(match[1]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches.map((entry, index) => {
    const next = matches[index + 1];
    const body = answer.slice(entry.end, next ? next.start : answer.length).trim();
    return { header: entry.header, body };
  });
}

function parseGuideSection(categoryId: string, answer: string): ParsedGuideSection {
  const sections = splitByBoldHeaders(answer);

  if (BUSINESS_CATEGORY_IDS.has(categoryId) && sections.length >= 3) {
    const [tipsSection, failuresSection, warningsSection] = sections;
    const tips = parseNumberedList(tipsSection.body);
    const failures = parseNumberedList(failuresSection.body);
    const warningText = normalizeText(warningsSection.body);

    if (tips.length && failures.length && warningText) {
      return {
        type: 'business',
        tips,
        failures,
        warnings: warningText,
      };
    }
  }

  return {
    type: 'plain',
    paragraphs: buildParagraphs(answer),
  };
}

function average(values: number[]) {
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatMoney(amount: number | null) {
  if (amount === null || Number.isNaN(amount) || amount <= 0) {
    return '데이터 부족';
  }

  if (amount >= 100000000) {
    return `${Math.round(amount / 10000000)}천만 원`;
  }

  if (amount >= 10000) {
    return `${Math.round(amount / 10000)}만 원`;
  }

  return `${Math.round(amount).toLocaleString()}원`;
}

function formatMonths(months: number | null) {
  if (months === null || Number.isNaN(months) || months <= 0) {
    return '데이터 부족';
  }

  if (months < 1) {
    return '1개월 이내';
  }

  return `${Math.round(months * 10) / 10}개월`;
}

function estimateDifficulty(experiences: Experience[]) {
  const averageHours =
    average(
      experiences
        .map((experience) => experience.weeklyHours)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ) ?? 0;

  const averageCapital =
    average(
      experiences
        .map((experience) => experience.investmentAmount)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ) ?? 0;

  const score =
    (averageHours >= 20 ? 2 : averageHours >= 10 ? 1 : 0) +
    (averageCapital >= 1000000 ? 2 : averageCapital >= 300000 ? 1 : 0);

  if (score >= 3) {
    return '높음';
  }

  if (score >= 1) {
    return '중간';
  }

  return '낮음';
}

function estimateTarget(categoryId: string, experiences: Experience[]) {
  const concurrentCount = experiences.filter((experience) => experience.isConcurrentWithMainJob === true).length;
  if (concurrentCount >= Math.ceil(experiences.length / 2) && concurrentCount > 0) {
    return '직장인 병행형';
  }

  return TARGET_LABELS[categoryId] ?? '입문자';
}

function buildStats(experiences: Experience[], categoryId: string): GuideStats {
  const averageCapital = average(
    experiences
      .map((experience) => experience.investmentAmount)
      .filter((value): value is number => typeof value === 'number' && value > 0),
  );

  const averageFirstIncome = average(
    experiences
      .filter((experience) => (experience.monthlyRevenue ?? 0) > 0)
      .map((experience) => experience.durationMonths)
      .filter((value): value is number => typeof value === 'number' && value > 0),
  );

  return {
    difficulty: estimateDifficulty(experiences),
    capital: formatMoney(averageCapital),
    target: estimateTarget(categoryId, experiences),
    firstIncome: formatMonths(averageFirstIncome),
  };
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
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone: 'green' | 'orange';
}) {
  return (
    <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-[4px]">
        <span
          className={`flex h-[14px] w-[14px] items-center justify-center rounded-full text-[10px] leading-none text-white ${
            tone === 'green' ? 'bg-[#5A876E]' : 'bg-[#C06D43]'
          }`}
        >
          {tone === 'green' ? '✓' : '!'}
        </span>
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

export default function GuideDetailSection({
  categoryId,
  answer,
  displayLabel,
  onExplore,
}: GuideDetailSectionProps) {
  const navigate = useNavigate();
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const parsed = useMemo(() => parseGuideSection(categoryId, answer), [categoryId, answer]);

  useEffect(() => {
    let cancelled = false;

    async function loadExperiences() {
      try {
        const payload = await getExperiences({ page: 0, size: 100, sort: 'popular' });
        if (!cancelled) {
          setExperiences(payload.experiences);
        }
      } catch {
        if (!cancelled) {
          setExperiences([]);
        }
      }
    }

    void loadExperiences();

    return () => {
      cancelled = true;
    };
  }, []);

  const matchedExperiences = useMemo(
    () => experiences.filter((experience) => experience.category.slug?.trim() === categoryId),
    [categoryId, experiences],
  );

  const stats = useMemo(() => buildStats(matchedExperiences, categoryId), [matchedExperiences, categoryId]);

  const recommendedExperience = useMemo(
    () =>
      [...matchedExperiences].sort((left, right) => {
        if (right.likeCount !== left.likeCount) {
          return right.likeCount - left.likeCount;
        }

        return right.viewCount - left.viewCount;
      })[0] ?? null,
    [matchedExperiences],
  );

  function handleOpenExperience() {
    if (!recommendedExperience) {
      onExplore();
      return;
    }

    navigate(`/experiences/${recommendedExperience.id}`);
  }

  if (parsed.type !== 'business') {
    return (
      <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
        <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
          <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
            답변
          </p>
          <div className="pt-[12px]">
            <SectionDivider />
          </div>
          <div className="flex flex-col gap-[10px] pt-[12px]">
            {parsed.paragraphs.map((entry, index) => (
              <p
                key={`${categoryId}-${index}`}
                className="font-['Pretendard'] text-[13px] font-[400] leading-[20px] tracking-[0px] text-[#131416]"
              >
                {entry}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
          <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
            추천 사례
          </p>
          <div className="pt-[12px]">
            <RecommendedCaseCard
              categoryLabel={displayLabel}
              experience={recommendedExperience}
              onOpenExperience={handleOpenExperience}
              onExplore={onExplore}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
      <div className="flex gap-[8px]">
        <GuideStatBox title="난이도" value={stats.difficulty} />
        <GuideStatBox title="추천 자본금" value={stats.capital} />
      </div>
      <div className="flex gap-[8px]">
        <GuideStatBox title="추천 대상" value={stats.target} />
        <GuideStatBox title="평균 첫 수익" value={stats.firstIncome} />
      </div>

      <NoteCard title="시작 전 체크리스트" tone="green">
        <div className="flex flex-col gap-[8px]">
          {parsed.tips.map((entry, index) => (
            <BulletRow key={`${entry}-${index}`} text={entry} color="green" />
          ))}
        </div>
      </NoteCard>

      <NoteCard title="주요 실패 원인" tone="orange">
        <div className="flex flex-col gap-[8px]">
          {parsed.failures.map((entry, index) => (
            <BulletRow key={`${entry}-${index}`} text={entry} color="orange" />
          ))}
        </div>
      </NoteCard>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
          주의사항
        </p>
        <div className="pt-[12px]">
          <SectionDivider />
        </div>
        <p className="pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-black">
          {parsed.warnings}
        </p>
      </div>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
          추천 사례
        </p>
        <div className="pt-[12px]">
          <RecommendedCaseCard
            categoryLabel={displayLabel}
            experience={recommendedExperience}
            onOpenExperience={handleOpenExperience}
            onExplore={onExplore}
          />
        </div>
      </div>
    </div>
  );
}
