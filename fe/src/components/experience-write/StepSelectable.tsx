type Props = {
  title: string;
  explain?: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
};

export default function StepSelectable({
  title,
  explain,
  options,
  selected,
  onSelect,
}: Props) {
  return (
    <div className="space-y-5 rounded-[10px] bg-white p-5">
      <h2 className="mb-5 text-xl font-bold">{title}</h2>

      {explain ? (
        <div className="flex items-start gap-1 text-base text-neutral-950">
          <div className="font-semibold">{explain}</div>
          <div>*</div>
        </div>
      ) : null}

      <div className="space-y-2">
        {options.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`h-11 w-full rounded-xl border ${
                active ? 'border-black bg-gray-50' : 'border-gray-200'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
