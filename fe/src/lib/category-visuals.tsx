import type { ReactNode } from 'react';
import shoppingCartIcon from '../assets/create-wizard-figma/shopping-cart-figma.svg';
import videocamIcon from '../assets/create-wizard-figma/videocam-figma.svg';
import desktopWindowsIcon from '../assets/create-wizard-figma/desktop-windows-figma.svg';
import deliveryTruckIcon from '../assets/create-wizard-figma/delivery-truck-figma.svg';
import designServicesIcon from '../assets/create-wizard-figma/design-services-figma.svg';
import financeModeIcon from '../assets/create-wizard-figma/finance-mode-figma.svg';
import groupsIcon from '../assets/create-wizard-figma/groups-figma.svg';

export type CategoryVisual = {
  id: number;
  label: string;
  descriptionLines: string[];
  icon: ReactNode;
};

function CategoryGlyph({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="inline-flex h-[50px] w-[50px] items-center justify-center overflow-hidden bg-white">
      <img src={src} alt={alt} className="h-[32px] w-[32px]" />
    </span>
  );
}

export const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    id: 1,
    label: '온라인 판매 · 이커머스',
    descriptionLines: [
      '스마트스토어/ 쿠팡, 오픈마켓',
      '/구매대행/ 위탁판매 (드롭쉬핑)',
      '/해외구매, 수입판매',
      '/재고 기반 쇼핑몰 등',
    ],
    icon: <CategoryGlyph src={shoppingCartIcon} alt="온라인 판매 · 이커머스" />,
  },
  {
    id: 2,
    label: '콘텐츠·SNS 기반',
    descriptionLines: [
      '유튜브/ 블로그/ 인스타그램',
      '/틱톡/ 뉴스레터',
      '/개인 브랜딩 기반 등',
    ],
    icon: <CategoryGlyph src={videocamIcon} alt="콘텐츠·SNS 기반" />,
  },
  {
    id: 3,
    label: '디지털 상품·지식 판매',
    descriptionLines: [
      '전자책 판매/ 강의 제작 (클래스, 인강)',
      '/템플릿, 디자인 판매',
      '/노션, 자료 판매/ PDF 자료 판매 등',
    ],
    icon: <CategoryGlyph src={desktopWindowsIcon} alt="디지털 상품·지식 판매" />,
  },
  {
    id: 4,
    label: '플랫폼 기반 노동형',
    descriptionLines: [
      '배달 (배민, 쿠팡이츠 등)/ 대리운전',
      '/쿠팡플렉스/ 단기 알바 플랫폼',
      '/설문 참여, 앱테크',
    ],
    icon: <CategoryGlyph src={deliveryTruckIcon} alt="플랫폼 기반 노동형" />,
  },
  {
    id: 5,
    label: '재능 판매·프리랜서',
    descriptionLines: [
      '디자인/ 영상 편집/ 글쓰기, 카피라이팅',
      '/개발/ 번역/ 크몽, 탈잉 등 플랫폼 활동',
    ],
    icon: <CategoryGlyph src={designServicesIcon} alt="재능 판매·프리랜서" />,
  },
  {
    id: 6,
    label: '투자·재테크',
    descriptionLines: [
      '주식/ 코인/ ETF/ P2P 투자',
      '/부동산 소액 투자 등',
    ],
    icon: <CategoryGlyph src={financeModeIcon} alt="투자·재테크" />,
  },
  {
    id: 7,
    label: '오프라인 기반 부업',
    descriptionLines: [
      '공방, 핸드메이드/ 플리마켓 판매',
      '/클래스 운영 (오프라인) 등',
    ],
    icon: <CategoryGlyph src={groupsIcon} alt="오프라인 기반 부업" />,
  },
];

export function getCategoryVisualById(categoryId: number) {
  return CATEGORY_VISUALS.find((item) => item.id === categoryId);
}
