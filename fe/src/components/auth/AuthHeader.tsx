import { useNavigate } from 'react-router-dom';

interface AuthHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function AuthHeader({
  title,
  showBackButton = true,
  onBack,
}: AuthHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    navigate(-1);
  };

  return (
    <header className="mb-8 flex items-center gap-3">
      {showBackButton && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로가기"
          className="text-lg"
        >
          ←
        </button>
      )}

      <h1 className="text-base font-semibold text-black">{title}</h1>
    </header>
  );
}
