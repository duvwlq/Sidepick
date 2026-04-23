import BottomSheet from './BottomSheet';

interface CarrierSelectSheetProps {
  open: boolean;
  selectedCarrier: string;
  onClose: () => void;
  onSelect: (carrier: string) => void;
}

const carriers = [
  'SKT',
  'KT',
  'LG U+',
  'SKT 알뜰폰',
  'KT 알뜰폰',
  'LG U+ 알뜰폰',
];

export default function CarrierSelectSheet({
  open,
  selectedCarrier,
  onClose,
  onSelect,
}: CarrierSelectSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="통신사를 선택해주세요">
      <div className="flex flex-col">
        {carriers.map((carrier) => {
          const isSelected = selectedCarrier === carrier;

          return (
            <button
              key={carrier}
              type="button"
              onClick={() => {
                onSelect(carrier);
                onClose();
              }}
              className={`flex h-12 items-center justify-between border-b border-[#f1f1f1] text-left text-sm ${
                isSelected ? 'font-semibold text-black' : 'text-[#444]'
              }`}
            >
              <span>{carrier}</span>
              {isSelected && <span className="text-xs text-black">선택됨</span>}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
