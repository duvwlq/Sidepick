import type { ReactNode } from 'react';
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
  onBack?: () => void;
  onMenuClick?: () => void;
  onRightIconClick?: () => void;
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
  onBack,
  onMenuClick,
  onRightIconClick,
}: Props) {
  return (
    <div
      className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-clip bg-white notranslate"
      translate="no"
    >
      {showHeader ? (
        <HeaderNav
          title={title}
          leftType={leftType}
          showRightIcon={showRightIcon}
          rightIcon={rightIcon}
          showStatusBar={showStatusBar}
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

      {showBottomNav ? <BottomNav /> : null}

      <ChatbotFab />
    </div>
  );
}
