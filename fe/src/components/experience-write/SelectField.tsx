import FieldLabel from './FieldLabal';

type Props = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
};

export default function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
}: Props) {
  return (
    <div>
      <FieldLabel label={label} />

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-12 w-full rounded-[16px] border border-[#CCD2E0] bg-white px-4 text-sm text-[#111111] outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
