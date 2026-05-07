import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ApiError, createAnalysis, getExperience, getReport } from '../lib/api';
import { ERROR_CODES } from '../lib/error-codes';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

export default function AiAnalysisResultPage() {
  const [searchParams] = useSearchParams();
  const experienceId = searchParams.get('experienceId');
  const token = getAccessToken();
  const storedUser = getStoredUser();
  const startedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? '사용자');
  const [error, setError] = useState('');
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  const cleanupTimers = () => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!experienceId) {
      return;
    }

    const targetExperienceId = experienceId;
    let mounted = true;

    async function bootstrap() {
      try {
        const experience = await getExperience(targetExperienceId);
        if (mounted) {
          setNickname(experience.author.nickname || storedUser?.nickname || '사용자');
        }
      } catch {
        if (mounted) {
          setNickname(storedUser?.nickname ?? '사용자');
        }
      }

      const isReady = await checkReportStatus();
      if (isReady) {
        return;
      }

      if (!startedRef.current && token) {
        startedRef.current = true;
        try {
          await createAnalysis(token, targetExperienceId);
          const readyAfterCreate = await checkReportStatus();
          if (readyAfterCreate) {
            return;
          }
        } catch (requestError) {
          if (
            requestError instanceof ApiError &&
            (requestError.code === ERROR_CODES.ANALYSIS_TIMEOUT ||
              requestError.code === ERROR_CODES.AI_UPSTREAM_ERROR)
          ) {
            if (mounted) {
              setError(resolveErrorMessage(requestError));
            }
            return;
          }

          if (mounted) {
            setError(
              resolveErrorMessage(
                requestError,
                '분석 요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
              ),
            );
          }
        }
      }

      if (!mounted) {
        return;
      }

      intervalRef.current = window.setInterval(() => {
        void checkReportStatus();
      }, 1000);

      timeoutRef.current = window.setTimeout(() => {
        if (mounted) {
          setError('분석 시간이 예상보다 오래 걸리고 있어요. 잠시 후 다시 확인해주세요.');
        }
        setRedirectTarget(targetExperienceId);
      }, 15000);
    }

    async function checkReportStatus() {
      try {
        const report = await getReport(targetExperienceId);
        if (report.reportStatus === 'READY') {
          cleanupTimers();
          setRedirectTarget(targetExperienceId);
          return true;
        }
      } catch (reportError) {
        if (mounted) {
          setError(
            resolveErrorMessage(
              reportError,
              '분석 결과를 확인하지 못했어요. 잠시 후 다시 시도해주세요.',
            ),
          );
        }
      }

      return false;
    }

    void bootstrap();

    return () => {
      mounted = false;
      cleanupTimers();
    };
  }, [experienceId, storedUser?.nickname, token]);

  if (!experienceId) {
    return <Navigate to="/" replace />;
  }

  if (redirectTarget) {
    return <Navigate to={`/experiences/${redirectTarget}`} replace />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col items-center bg-[#FFFFFF] px-[16px] pb-[110px] pt-[20px]">
      <div className="isolate flex min-h-[688px] w-full flex-col items-center justify-center gap-[20px] rounded-[10px] bg-[#FFFFFF]">
        <div className="min-w-full text-center text-[24px] font-[400] leading-[28.8px] tracking-[0px] text-[#131416]">
          <p className="mb-0 text-[24px] font-[400] leading-[28.8px] tracking-[0px] text-[#131416]">
            <span className="text-[24px] font-[600] leading-[28.8px] tracking-[0px] text-[#131416]">
              {nickname}
            </span>
            <span className="text-[24px] font-[400] leading-[28.8px] tracking-[0px] text-[#131416]">
              님의
            </span>
          </p>
          <p className="text-[24px] font-[400] leading-[28.8px] tracking-[0px] text-[#131416]">
            경험을 분석하고 있어요
          </p>
        </div>

        <div className="flex flex-col items-center gap-[20px]">
          <LoaderCircle size={24} strokeWidth={2.2} className="animate-spin text-[#5E5E5E]" />
          <p className="text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            잠시만 기다려주세요.
          </p>
          {error ? (
            <p className="w-[220px] text-center text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
