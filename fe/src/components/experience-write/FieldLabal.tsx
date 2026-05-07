type Props = {
  label: string;
  required?: boolean;
};

export default function FieldLabel({ label, required }: Props) {
  return (
    <div className="flex items-start gap-[4px]">
      <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#0A0A0A] [font-feature-settings:'case'_1]">
        {label}
      </span>
      {required ? (
        <span className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#0A0A0A] [font-feature-settings:'case'_1]">
          *
        </span>
      ) : null}
    </div>
  );
}
