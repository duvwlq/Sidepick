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
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 border rounded-xl px-3 mt-2"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
