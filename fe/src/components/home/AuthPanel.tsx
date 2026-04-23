import type { FormEvent } from 'react';
import type { UserSummary } from '../../lib/api';

type AuthMode = 'login' | 'register';

type Props = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string;
  user: UserSummary | null;
  onLogout: () => void;
};

export default function AuthPanel({
  mode,
  onModeChange,
  onSubmit,
  loading,
  error,
  user,
  onLogout,
}: Props) {
  if (user) {
    return (
      <div className="rounded-[10px] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">로그인한 사용자</div>
            <div className="text-lg font-semibold text-gray-900">
              {user.nickname}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
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
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange('login')}
          className={`rounded-full px-3 py-1 text-sm ${
            mode === 'login'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => onModeChange('register')}
          className={`rounded-full px-3 py-1 text-sm ${
            mode === 'register'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          회원가입
        </button>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          name="email"
          type="email"
          placeholder="이메일"
          className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="비밀번호"
          className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
          required
        />
        {mode === 'register' ? (
          <>
            <input
              name="nickname"
              type="text"
              placeholder="닉네임"
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              required
            />
            <input
              name="ageGroup"
              type="text"
              placeholder="연령대 예: 20s"
              defaultValue="20s"
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
              required
            />
          </>
        ) : null}

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-black text-sm font-medium text-white disabled:bg-gray-400"
        >
          {loading
            ? '처리 중...'
            : mode === 'login'
              ? '로그인'
              : '회원가입'}
        </button>
      </form>
    </div>
  );
}
