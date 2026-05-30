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

      <div className="mt-3 flex h-[36px] items-center rounded-[10px] border border-[#E6E6E6] bg-white px-[16px]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
          className="flex-1 font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416] outline-none placeholder:text-[#BABABA]"
          placeholder="1000000"
        />
        <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">원</span>
      </div>
    </div>
  );
}
