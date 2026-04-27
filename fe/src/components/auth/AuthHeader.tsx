import { useNavigate } from 'react-router-dom';

type Props = {
  title: string;
  onBack?: () => void;
};

export default function AuthHeader({ title, onBack }: Props) {
  const navigate = useNavigate();

  return (
    <header className="mb-10 flex items-center gap-3 px-1 pt-1">
      <button
        type="button"
        aria-label="뒤로가기"
        onClick={() => {
          if (onBack) {
            onBack();
            return;
          }
          navigate(-1);
        }}
        className="flex size-8 items-center justify-center text-[22px] leading-none text-black"
      >
        ←
      </button>
      <div className="text-[24px] font-semibold leading-8 text-black">{title}</div>
    </header>
  );
}
