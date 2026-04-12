import type { ReactNode } from 'react';
import HeaderNav from './HeaderNav';
import BottomNav from './ButtomNav';

type HeaderLeftType = 'menu' | 'back' | 'none';

type Props = {
  children: ReactNode;
  title?: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
  showHeader?: boolean;
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
  showHeader = true,
  showBottomNav = true,
  onBack,
  onMenuClick,
  onRightIconClick,
}: Props) {
  return (
    <div className="max-w-md min-h-screen bg-gray-100">
      {showHeader && (
        <HeaderNav
          title={title}
          leftType={leftType}
          showRightIcon={showRightIcon}
          onBack={onBack}
          onMenuClick={onMenuClick}
          onRightIconClick={onRightIconClick}
        />
      )}

      <main
        className={`${showHeader ? 'pt-16' : ''} ${showBottomNav ? 'pb-26' : ''}`}
      >
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}
