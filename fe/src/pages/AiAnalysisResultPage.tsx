import { useNavigate, useSearchParams } from 'react-router-dom';
import AiAnalysisResult from '../components/ai-analysis/AiAnalysisResult';
import BottomNav from '../components/layout/ButtomNav';

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M7 5.75C7 5.33579 7.33579 5 7.75 5H16.25C16.6642 5 17 5.33579 17 5.75V19L12 15.5L7 19V5.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M6.75 12C6.75 12.6904 6.19036 13.25 5.5 13.25C4.80964 13.25 4.25 12.6904 4.25 12C4.25 11.3096 4.80964 10.75 5.5 10.75C6.19036 10.75 6.75 11.3096 6.75 12Z"
        fill="currentColor"
      />
      <path
        d="M13.25 12C13.25 12.6904 12.6904 13.25 12 13.25C11.3096 13.25 10.75 12.6904 10.75 12C10.75 11.3096 11.3096 10.75 12 10.75C12.6904 10.75 13.25 11.3096 13.25 12Z"
        fill="currentColor"
      />
      <path
        d="M19.75 12C19.75 12.6904 19.1904 13.25 18.5 13.25C17.8096 13.25 17.25 12.6904 17.25 12C17.25 11.3096 17.8096 10.75 18.5 10.75C19.1904 10.75 19.75 11.3096 19.75 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AiAnalysisResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const experienceId = Number(searchParams.get('experienceId'));

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-[#EEE]">
      <header className="fixed left-1/2 top-0 z-50 w-full max-w-[375px] -translate-x-1/2 bg-white">
        <div className="flex h-[59px] items-center justify-between px-6 pb-[19px] pt-[21px] text-[17px] font-semibold text-black">
          <span>9:41</span>
          <div className="flex items-center gap-[7px]">
            <div className="h-[12px] w-[19px] rounded-full bg-black/90" />
            <div className="h-[12px] w-[17px] rounded-full bg-black/80" />
            <div className="h-[13px] w-[27px] rounded-[4px] border border-black/80" />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-6 w-6 items-center justify-center text-[#131416]"
            aria-label="뒤로 가기"
          >
            <BackIcon />
          </button>
          <h1 className="text-base font-semibold leading-[1.2] text-[#131416]">
            분석 결과
          </h1>
          <div className="flex items-center gap-1 text-[#131416]">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center"
              aria-label="북마크"
            >
              <BookmarkIcon />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center"
              aria-label="더보기"
            >
              <MoreIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-[110px] pt-[123px]">
        <AiAnalysisResult
          experienceId={Number.isFinite(experienceId) ? experienceId : null}
        />
      </main>

      <BottomNav />
    </div>
  );
}
