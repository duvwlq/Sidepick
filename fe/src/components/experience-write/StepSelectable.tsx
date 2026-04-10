import { Subscript } from 'lucide-react';

type Props = {
  title: string;
  explain?: string;
  options: string[];
  selected: string[];
  onSelect: (v: string) => void;
  single?: boolean;
};

export default function StepSelectable({
  title,
  explain,
  options,
  selected,
  onSelect,
  single,
}: Props) {
  return (
    <div className="space-y-5 bg-white p-5 rounded-[10px]">
      <h2 className="text-xl font-bold mb-5 gap-5">{title}</h2>

      <div className="flex">
        <div className="justify-start text-neutral-950 text-base font-semibold font-['Pretendard'] leading-7">
          {explain}
        </div>
        <div className="justify-start text-neutral-950 text-base font-normal font-['Pretendard'] leading-7">
          *
        </div>
      </div>

      <div className="space-y-2">
        {options.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={`w-full h-11 border rounded-xl ${
                active ? 'border-black' : 'border-gray-200'
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
