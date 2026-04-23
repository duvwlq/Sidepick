import type { ReactNode } from 'react';

interface SignupSectionProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SignupSection({
  step,
  title,
  description,
  children,
}: SignupSectionProps) {
  return (
    <section className="rounded-2xl border border-[#eeeeee] bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold text-[#888]">STEP {step}</p>
        <h2 className="text-lg font-semibold leading-7">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-[#777]">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}
