import type { ReactNode } from 'react';

export type CategoryVisual = {
  id: number;
  label: string;
  descriptionLines: string[];
  icon: ReactNode;
};

function IconWrapper({
  children,
  accentClass,
}: {
  children: ReactNode;
  accentClass: string;
}) {
  return (
    <span
      className={`flex h-[52px] w-[52px] items-center justify-center rounded-[4px] border border-[#F0F0F0] bg-[#FCFCFC] ${accentClass}`}
    >
      {children}
    </span>
  );
}

function CommerceIcon() {
  return (
    <IconWrapper accentClass="text-[#2F6BFF]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <path d="M9 12H27L25.5 24H10.5L9 12Z" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M13 12V10.5C13 8.57 14.57 7 16.5 7H19.5C21.43 7 23 8.57 23 10.5V12"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M14 17H22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </IconWrapper>
  );
}

function ContentIcon() {
  return (
    <IconWrapper accentClass="text-[#FF8A00]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <rect
          x="8.5"
          y="9.5"
          width="19"
          height="17"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M15 14L21 18L15 22V14Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </IconWrapper>
  );
}

function DigitalGoodsIcon() {
  return (
    <IconWrapper accentClass="text-[#7A5CFF]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <path d="M12 9.5H22L25 12.5V26.5H12V9.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M22 9.5V13H25" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15 17H22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 21H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </IconWrapper>
  );
}

function PlatformWorkIcon() {
  return (
    <IconWrapper accentClass="text-[#13A37F]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <path d="M11 14.5H25V24.5H11V14.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M14 14.5V12.5C14 11.12 15.12 10 16.5 10H19.5C20.88 10 22 11.12 22 12.5V14.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M18 18V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </IconWrapper>
  );
}

function FreelanceIcon() {
  return (
    <IconWrapper accentClass="text-[#E64980]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <path
          d="M11 24.5L24.5 11L26.5 13L13 26.5H11V24.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M20 11L25 16" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </IconWrapper>
  );
}

function InvestmentIcon() {
  return (
    <IconWrapper accentClass="text-[#EF4444]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <path
          d="M11 24.5L16 19.5L19 22.5L25 15.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 15.5H25V19.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconWrapper>
  );
}

function OfflineIcon() {
  return (
    <IconWrapper accentClass="text-[#10B981]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <path d="M10.5 14L18 10L25.5 14V24.5H10.5V14Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 24.5V18H22V24.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </IconWrapper>
  );
}

function EtcIcon() {
  return (
    <IconWrapper accentClass="text-[#8B5CF6]">
      <svg viewBox="0 0 36 36" className="h-[32px] w-[32px]" fill="none" aria-hidden="true">
        <circle cx="12.5" cy="18" r="1.5" fill="currentColor" />
        <circle cx="18" cy="18" r="1.5" fill="currentColor" />
        <circle cx="23.5" cy="18" r="1.5" fill="currentColor" />
      </svg>
    </IconWrapper>
  );
}

export const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    id: 1,
    label: '온라인 판매 · 이커머스',
    descriptionLines: [
      '스마트스토어 / 쿠팡, 오픈마켓',
      '/ 구매대행, 위탁판매 (스마트스토어)',
      '/ 해외구매, 수입판매',
      '/ 재고 기반 쇼핑몰 등',
    ],
    icon: <CommerceIcon />,
  },
  {
    id: 2,
    label: '콘텐츠·SNS 기반',
    descriptionLines: [
      '유튜브 / 블로그 / 인스타그램',
      '/ 릴스 / 뉴스레터',
      '/ 개인 브랜딩 기반 등',
    ],
    icon: <ContentIcon />,
  },
  {
    id: 3,
    label: '디지털 상품·지식 판매',
    descriptionLines: [
      '전자책 판매 / 강의 제작 (클래스)',
      '/ 강의 플랫폼, 지식 판매',
      '/ 노션 자료 판매 / PDF 자료 판매 등',
    ],
    icon: <DigitalGoodsIcon />,
  },
  {
    id: 4,
    label: '플랫폼 기반 노동형',
    descriptionLines: [
      '배달 (배민, 쿠팡이츠 등) / 대리운전',
      '/ 쿠팡플렉스 / 단기 알바 플랫폼',
      '/ 설문 참여, 테스트',
    ],
    icon: <PlatformWorkIcon />,
  },
  {
    id: 5,
    label: '재능 판매·프리랜서',
    descriptionLines: [
      '디자인 / 영상 편집 / 글쓰기, 기고',
      '/ 라이팅, 개발 / 번역 / 외주, 레슨',
      '등 플랫폼 활동',
    ],
    icon: <FreelanceIcon />,
  },
  {
    id: 6,
    label: '투자·재테크',
    descriptionLines: ['주식 / 코인 / ETF / P2P 투자', '/ 부동산 소액 투자 등'],
    icon: <InvestmentIcon />,
  },
  {
    id: 7,
    label: '오프라인 기반 부업',
    descriptionLines: ['공방, 핸드메이드 / 플리마켓 판매', '/ 클래스 운영 (오프라인) 등'],
    icon: <OfflineIcon />,
  },
  {
    id: 8,
    label: '기타',
    descriptionLines: [],
    icon: <EtcIcon />,
  },
];

export function getCategoryVisualById(id: number) {
  return CATEGORY_VISUALS.find((item) => item.id === id);
}

export const CATEGORY_TAG_LABELS = CATEGORY_VISUALS.map((item) => item.label);
