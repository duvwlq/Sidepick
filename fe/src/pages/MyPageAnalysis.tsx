import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import { ApiError, getMyAnalysisReports, type MyAnalysisItem } from '../lib/api';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken } from '../lib/session';

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function MyPageAnalysis() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = getAccessToken();
  const [items, setItems] = useState<MyAnalysisItem[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/auth?next=%2Fmypage%2Fanalysis', { replace: true });
      return;
    }

    let cancelled = false;

    void getMyAnalysisReports(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setItems(payload);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        if (isAuthError(loadError)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Fanalysis', { replace: true });
          return;
        }

        setError(resolveErrorMessage(loadError, 'AI 분석 목록을 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-[#F8F8F8]">
      <header className="flex h-[64px] items-center justify-between bg-white px-[16px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-[24px] w-[24px] items-center justify-center"
          aria-label="뒤로가기"
        >
          <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
        </button>
        <h1 className="text-[16px] font-[600] text-[#000000]">AI 분석 보기</h1>
        <div className="h-[24px] w-[24px]" aria-hidden="true" />
      </header>

      <main className="flex flex-col gap-[10px] px-[16px] py-[16px]">
        {loading ? <ListSkeleton count={4} /> : null}
        {!loading && error ? <ErrorState message={error} /> : null}
        {!loading && !error && items.length === 0 ? <PageMessage message="아직 분석된 사례가 없습니다." /> : null}
        {!loading && !error
          ? items.map((item) => (
              <button
                key={`${item.experienceId}-${item.analysisId ?? 'pending'}`}
                type="button"
                onClick={() => navigate(`/analysis-result?experienceId=${item.experienceId}`)}
                className="rounded-[16px] bg-white px-[16px] py-[14px] text-left shadow-[0_0_2px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-between gap-[12px]">
                  <span
                    className={`rounded-[999px] px-[10px] py-[4px] text-[11px] font-[600] ${
                      item.reportStatus === 'READY'
                        ? 'bg-[#EAF5EE] text-[#3E6B52]'
                        : 'bg-[#F4F4F4] text-[#7A7A7A]'
                    }`}
                  >
                    {item.reportStatus === 'READY' ? '분석 완료' : '분석 대기'}
                  </span>
                  <span className="text-[12px] text-[#8A8A8A]">{formatDate(item.processedAt ?? item.createdAt)}</span>
                </div>
                <h2 className="pt-[10px] text-[15px] font-[600] leading-[20px] text-[#131416]">{item.title}</h2>
                <p className="pt-[6px] text-[13px] leading-[18px] text-[#5E5E5E]">
                  {item.summary?.trim() || '아직 분석 결과가 준비되지 않았습니다.'}
                </p>
              </button>
            ))
          : null}
      </main>
    </div>
  );
}
