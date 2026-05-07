type ActionCardProps = {
  step: number;
  checklist: string[];
};

export default function ActionCard({ step, checklist }: ActionCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="mb-3 text-base font-semibold text-neutral-950">
        {step}.
      </div>
      <ul className="space-y-2">
        {checklist.map((item, index) => (
          <li
            key={`${step}-${index}`}
            className="flex gap-2 text-xs leading-5 text-[#3A3A3A]"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white"
            >
              ✓
            </span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
