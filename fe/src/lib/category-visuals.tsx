import type { ReactNode } from 'react';
import deliveryTruckIcon from '../assets/create-wizard-figma/delivery-truck-figma.svg';
import desktopWindowsIcon from '../assets/create-wizard-figma/desktop-windows-figma.svg';
import designServicesIcon from '../assets/create-wizard-figma/design-services-figma.svg';
import financeModeIcon from '../assets/create-wizard-figma/finance-mode-figma.svg';
import groupsIcon from '../assets/create-wizard-figma/groups-figma.svg';
import shoppingCartIcon from '../assets/create-wizard-figma/shopping-cart-figma.svg';
import videocamIcon from '../assets/create-wizard-figma/videocam-figma.svg';

export type CategoryVisual = {
  id: number;
  key: string;
  label: string;
  descriptionLines: string[];
  icon: ReactNode;
};

function createCategoryGlyph(src: string, alt: string): ReactNode {
  return (
    <span className="inline-flex h-[50px] w-[50px] items-center justify-center overflow-hidden bg-white">
      <img src={src} alt={alt} className="h-[32px] w-[32px]" />
    </span>
  );
}

export const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    id: 1,
    key: 'online_sales',
    label: '온라인 판매 · 이커머스',
    descriptionLines: ['스마트스토어, 쿠팡, 오픈마켓', '구매대행, 위탁판매, 재고 기반 쇼핑몰 등'],
    icon: createCategoryGlyph(shoppingCartIcon, '온라인 판매 · 이커머스'),
  },
  {
    id: 2,
    key: 'content_sns',
    label: '콘텐츠 · SNS 기반',
    descriptionLines: ['유튜브, 블로그, 인스타그램', '릴스, 뉴스레터, 개인 브랜딩 기반 활동'],
    icon: createCategoryGlyph(videocamIcon, '콘텐츠 · SNS 기반'),
  },
  {
    id: 3,
    key: 'digital_knowledge',
    label: '디지털 상품·지식 판매',
    descriptionLines: ['전자책, 강의 제작, 클래스', '디자인 판매, 노션, PDF 자료 판매 등'],
    icon: createCategoryGlyph(desktopWindowsIcon, '디지털 상품·지식 판매'),
  },
  {
    id: 4,
    key: 'platform_labor',
    label: '플랫폼 기반 노동형',
    descriptionLines: ['배달, 대리운전, 쿠팡플렉스', '설문 참여, 테스트 작업 등 플랫폼 기반 활동'],
    icon: createCategoryGlyph(deliveryTruckIcon, '플랫폼 기반 노동형'),
  },
  {
    id: 5,
    key: 'freelance',
    label: '재능 판매·프리랜서',
    descriptionLines: ['디자인, 영상 편집, 글쓰기', '번역, 개발, 번역, 운영 등 플랫폼 활동'],
    icon: createCategoryGlyph(designServicesIcon, '재능 판매·프리랜서'),
  },
  {
    id: 6,
    key: 'investment',
    label: '투자·재테크',
    descriptionLines: ['주식, 코인, ETF, P2P 투자', '부동산 소액 투자 등'],
    icon: createCategoryGlyph(financeModeIcon, '투자·재테크'),
  },
  {
    id: 7,
    key: 'offline',
    label: '오프라인 기반 부업',
    descriptionLines: ['공방, 플리마켓, 클래스 운영', '오프라인 소규모 판매 활동'],
    icon: createCategoryGlyph(groupsIcon, '오프라인 기반 부업'),
  },
];

export function getCategoryVisualById(categoryId: number) {
  return CATEGORY_VISUALS.find((item) => item.id === categoryId);
}
