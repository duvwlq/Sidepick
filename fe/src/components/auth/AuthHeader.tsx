import { useNavigate } from 'react-router-dom';

type Props = {
  title: string;
  onBack?: () => void;
};

export default function AuthHeader({ title, onBack }: Props) {
  const navigate = useNavigate();

  return (
    <header className="mb-8 flex items-center gap-3">
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
        className="text-xl leading-none text-black"
      >
        ←
      </button>
      <div className="text-base font-semibold text-black">{title}</div>
    </header>
  );
}
