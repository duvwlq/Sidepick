type Props = {
  label: string;
  required?: boolean;
};

export default function FieldLabel({ label, required }: Props) {
  return (
    <div className="text-sm font-semibold text-left">
      {label} {required && <span>*</span>}
    </div>
  );
}
