import FieldLabel from './FieldLabel';

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
        className="mt-3 h-[36px] w-full rounded-[10px] border border-[#E6E6E6] bg-white px-[16px] font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416] outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
