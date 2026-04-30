type Props = {
  title: string;
  explain?: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  etcValue?: string;
  onEtcChange?: (value: string) => void;
  extraValue?: string;
  onExtraChange?: (value: string) => void;
};

export default function StepSelectable({
  title,
  explain,
  options,
  selected,
  onSelect,
  etcValue,
  onEtcChange,
  extraValue,
  onExtraChange,
}: Props) {
  return (
    <div className="rounded-[24px] bg-white px-5 pb-6 pt-7 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
      <h2 className="text-[20px] font-semibold leading-[1.45] text-[#111111]">
        {title}
      </h2>

      {explain ? (
        <p className="mt-2 text-sm leading-6 text-[#666666]">{explain}</p>
      ) : null}

      <div className="mt-6 space-y-2.5">
        {options.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex min-h-12 w-full items-center rounded-[16px] border px-4 text-left text-sm transition ${
                active
                  ? 'border-[#111111] bg-[#FAFAFA] text-[#111111]'
                  : 'border-[#E4E7EC] bg-white text-[#555555]'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      {onEtcChange ? (
        <div className="mt-5">
          <div className="mb-2 text-sm font-semibold text-[#111111]">
            湲고? ?대젮??/ ?붿씤
          </div>
          <textarea
            value={etcValue ?? ''}
            onChange={(event) => onEtcChange(event.target.value)}
            className="min-h-24 w-full rounded-[16px] border border-[#E4E7EC] px-4 py-3 text-sm leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF]"
            placeholder="泥댄겕由ъ뒪?몄뿉 ?놁뒗 ?대젮??/?붿씤???곸뼱二쇱꽭??"
          />
        </div>
      ) : null}

      {onExtraChange ? (
        <div className="mt-5">
          <div className="mb-2 text-sm font-semibold text-[#111111]">
            蹂댁“ ?ㅻ챸
          </div>
          <textarea
            value={extraValue ?? ''}
            onChange={(event) => onExtraChange(event.target.value)}
            className="min-h-24 w-full rounded-[16px] border border-[#E4E7EC] px-4 py-3 text-sm leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF]"
            placeholder="?붽?濡?꽕紐낇븷 ?댁슜???덉쑝硫?留곸꽦?댁＜?몄슂."
          />
        </div>
      ) : null}
    </div>
  );
}
