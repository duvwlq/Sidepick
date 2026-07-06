type Props = {
  email: string | null;
  nickname: string | null;
  emailVerified?: boolean;
  onLogout: () => void;
  onLogin: () => void;
  onSignUp: () => void;
};

export default function AuthPanel({
  email,
  nickname,
  emailVerified,
  onLogout,
  onLogin,
  onSignUp,
}: Props) {
  if (email && nickname) {
    return (
      <div className="rounded-[10px] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">로그인한 사용자</div>
            <div className="text-lg font-semibold text-gray-900">{nickname}</div>
            <div className="text-sm text-gray-500">{email}</div>
            <div className="mt-2 text-xs text-gray-500">
              이메일 인증 상태: {emailVerified ? '완료' : '미완료'}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] bg-white p-4 shadow-sm">
      <div className="mb-2 text-lg font-semibold text-gray-900">
        로그인을 시작해 보세요
      </div>
      <div className="mb-4 text-sm text-gray-500">
        이메일 로그인과 회원가입을 하면 서비스를 더 편하게 이용할 수
        있습니다.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLogin}
          className="h-11 flex-1 rounded-xl bg-black text-sm font-medium text-white"
        >
          로그인
        </button>
        <button
          type="button"
          onClick={onSignUp}
          className="h-11 flex-1 rounded-xl border border-gray-300 text-sm font-medium text-gray-700"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}
