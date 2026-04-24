import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F6F1F1]">
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-5 py-4">
        {children}
      </div>
    </div>
  );
}
