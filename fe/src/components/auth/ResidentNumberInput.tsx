import type { ChangeEvent } from 'react';

interface ResidentNumberInputProps {
  birthValue: string;
  genderDigitValue: string;
  readOnly?: boolean;
  onBirthChange: (value: string) => void;
  onGenderDigitChange: (value: string) => void;
}

export default function ResidentNumberInput({
  birthValue,
  genderDigitValue,
  readOnly = false,
  onBirthChange,
  onGenderDigitChange,
}: ResidentNumberInputProps) {
  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    onBirthChange(value);
  };

  const handleGenderDigitChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 1) value = value.slice(0, 1);
    onGenderDigitChange(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-[#555]">
        생년월일 및 성별
      </label>

      <div className="grid h-12 w-full grid-cols-[6fr_1fr_1fr_6fr] items-center rounded-xl bg-[#f1f1f1] px-4">
        <input
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={birthValue}
          readOnly={readOnly}
          onChange={handleBirthChange}
          className="w-[72px] bg-transparent text-sm text-black outline-none placeholder:text-[#9a9a9a]"
        />

        <span className=" text-sm text-[#9a9a9a]">-</span>

        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={genderDigitValue}
          readOnly={readOnly}
          onChange={handleGenderDigitChange}
          className="w-4 bg-transparent text-center text-sm text-black outline-none placeholder:text-[#9a9a9a]"
        />

        <span className="text-left text-sm tracking-[0.22em] text-[#b3b3b3]">
          ******
        </span>
      </div>
    </div>
  );
}
