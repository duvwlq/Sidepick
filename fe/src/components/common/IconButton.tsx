type IconButtonProps = {
  icon: string;
  alt: string;
  onClick?: () => void;
};

export default function IconButton({ icon, alt, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 flex items-center justify-center"
    >
      <img src={icon} alt={alt} className="w-5 h-5" />
    </button>
  );
}
