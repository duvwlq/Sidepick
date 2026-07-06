import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAFAFA]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-4 py-4">
        {children}
      </div>
    </div>
  );
}
