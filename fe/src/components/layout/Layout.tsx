import type { ReactNode } from 'react';
import type { BottomNavKey } from './BottomNav';
import ChatbotFab from '../chatbot/ChatbotFab';
import BottomNav from './BottomNav';
import HeaderNav from './HeaderNav';

type HeaderLeftType = 'menu' | 'back' | 'none';

type Props = {
  children: ReactNode;
  title?: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
  rightIcon?: 'bell' | 'search' | 'menu' | 'none';
  showHeader?: boolean;
  showStatusBar?: boolean;
  showBottomNav?: boolean;
  showChatbotFab?: boolean;
  bottomNavActive?: BottomNavKey;
  bottomNavShowFab?: boolean;
  maxWidthClass?: string;
  onBack?: () => void;
  onMenuClick?: () => void;
  onRightIconClick?: () => void;
  onBottomNavCreateClick?: () => void;
};

export default function Layout({
  children,
  title = '사이드픽',
  leftType = 'menu',
  showRightIcon = true,
  rightIcon = 'bell',
  showHeader = true,
  showStatusBar = false,
  showBottomNav = true,
  showChatbotFab = true,
  bottomNavActive,
  bottomNavShowFab = false,
  maxWidthClass = 'max-w-[430px]',
  onBack,
  onMenuClick,
  onRightIconClick,
  onBottomNavCreateClick,
}: Props) {
  return (
    <div
      className={`mx-auto min-h-screen w-full overflow-x-clip bg-white notranslate ${maxWidthClass}`}
      translate="no"
    >
      {showHeader ? (
        <HeaderNav
          title={title}
          leftType={leftType}
          showRightIcon={showRightIcon}
          rightIcon={rightIcon}
          showStatusBar={showStatusBar}
          maxWidthClass={maxWidthClass}
          onBack={onBack}
          onMenuClick={onMenuClick}
          onRightIconClick={onRightIconClick}
        />
      ) : null}

      <main
        translate="no"
        className={`overflow-x-clip ${showHeader ? (showStatusBar ? 'pt-[123px]' : 'pt-[64px]') : ''} ${
          showBottomNav ? 'pb-[110px]' : ''
        }`}
      >
        {children}
      </main>

      {showBottomNav ? (
        <BottomNav active={bottomNavActive} showFab={bottomNavShowFab} onCreateClick={onBottomNavCreateClick} />
      ) : null}

      {showChatbotFab ? <ChatbotFab /> : null}
    </div>
  );
}
