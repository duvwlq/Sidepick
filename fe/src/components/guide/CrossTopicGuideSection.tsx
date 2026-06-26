import { useMemo } from 'react';

type CrossTopicGuideSectionProps = {
  answer: string;
};

type ParsedCrossTopicSection =
  | {
      type: 'structured';
      steps: string[];
      answer: string;
      warnings: string;
    }
  | {
      type: 'plain';
      paragraphs: string[];
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
    return {
      header: entry.header,
      body: answer.slice(entry.end, next ? next.start : answer.length).trim(),
    };
  });
}

function parseNumberedList(block: string) {
  return splitLines(block)
    .map((line) => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
    .filter(Boolean);
}

function buildParagraphs(answer: string) {
  return answer
    .split(/\n{2,}/)
    .map((paragraph) => normalizeText(paragraph))
    .filter(Boolean);
}

function parseCrossTopic(answer: string): ParsedCrossTopicSection {
  const sections = splitByBoldHeaders(answer);
  if (sections.length >= 3) {
    const [stepsSection, answerSection, warningsSection] = sections;
    const steps = parseNumberedList(stepsSection.body);
    const answerText = normalizeText(answerSection.body);
    const warningText = normalizeText(warningsSection.body);

    if (steps.length && answerText && warningText) {
      return {
        type: 'structured',
        steps,
        answer: answerText,
        warnings: warningText,
      };
    }
  }

  return {
    type: 'plain',
    paragraphs: buildParagraphs(answer),
  };
}

function SectionDivider() {
  return <div className="h-px w-full bg-[#EEEEEE]" />;
}

export default function CrossTopicGuideSection({ answer }: CrossTopicGuideSectionProps) {
  const parsed = useMemo(() => parseCrossTopic(answer), [answer]);

  if (parsed.type === 'plain') {
    return (
      <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
        <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
          <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#131416]">답변</p>
          <div className="mt-[8px]">
            <SectionDivider />
          </div>
          <div className="flex flex-col gap-[10px] pt-[12px]">
            {parsed.paragraphs.map((paragraph, index) => (
              <p
                key={`${paragraph}-${index}`}
                className="font-['Pretendard'] text-[13px] font-[400] leading-[20px] text-[#131416]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[8px] bg-[#F8F8F8] p-[16px]">
      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#131416]">실행 단계</p>
        <div className="pt-[8px]">
          <SectionDivider />
        </div>
        <div className="flex flex-col gap-[8px] pt-[8px]">
          {parsed.steps.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-start gap-[6px]">
              <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full bg-[#F3E1D6] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#D9824E]">
                {index + 1}
              </span>
              <p className="pt-[1px] font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] text-[#131416]">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#131416]">답변</p>
        <div className="pt-[8px]">
          <SectionDivider />
        </div>
        <p className="pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-black">
          {parsed.answer}
        </p>
      </div>

      <div className="rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
        <p className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-[#D9824E]">
          주의사항 / 법적 안내
        </p>
        <div className="pt-[8px]">
          <SectionDivider />
        </div>
        <p className="pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-black">
          {parsed.warnings}
        </p>
      </div>
    </div>
  );
}
