import FieldLabel from './FieldLabal';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

export default function MoneyField({ label, value, onChange }: Props) {
  return (
    <div>
      <FieldLabel label={label} />

      <div className="flex items-center border rounded-xl px-3 h-11 mt-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          className="flex-1 outline-none"
          placeholder="1000000"
        />
        <span className="text-sm">원</span>
      </div>
    </div>
  );
}
