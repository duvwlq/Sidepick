type ActionCardProps = {
  title: string;
  scoreLabel: string;
  description: string;
};

export default function ActionCard({
  title,
  scoreLabel,
  description,
}: ActionCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold leading-5 text-neutral-950">
          {title}
        </h3>
        <span className="rounded-[999px] bg-black px-2.5 py-0.5 text-xs text-white">
          {scoreLabel}
        </span>
      </div>

      <p className="text-xs leading-5 text-[#7A7A7A]">{description}</p>
    </div>
  );
}
