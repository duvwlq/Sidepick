import FieldLabel from './FieldLabel';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

export default function MoneyField({ label, value, onChange }: Props) {
  return (
    <div>
      <FieldLabel label={label} />

      <div className="mt-3 flex h-12 items-center rounded-[16px] border border-[#CCD2E0] bg-white px-4">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
          className="flex-1 text-sm text-[#111111] outline-none placeholder:text-[#9CA3AF]"
          placeholder="1000000"
        />
        <span className="text-sm text-[#555555]">원</span>
      </div>
    </div>
  );
}
