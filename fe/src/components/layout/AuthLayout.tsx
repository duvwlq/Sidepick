import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f6f1f1] flex justify-center">
      <div className="min-h-screen w-full max-w-[430px] bg-white px-4 py-4">
        {children}
      </div>
    </div>
  );
}
