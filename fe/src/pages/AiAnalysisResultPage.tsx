import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorState } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import {
  ApiError,
  createAnalysis,
  createExperience,
  getExperience,
  getReport,
  type ExperienceUpsertInput,
} from '../lib/api';
import { ERROR_CODES } from '../lib/error-codes';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

type AnalysisPhase = 'analyzing' | 'completed';

const PENDING_EXPERIENCE_CREATE_KEY = 'pendingExperienceCreate';
const COMPLETE_DELAY_MS = 1200;
const MAX_POLL_ATTEMPTS = 15;
const DEFAULT_NICKNAME = '사용자';

type PendingExperienceCreate = {
  payload: ExperienceUpsertInput;
};

export default function AiAnalysisResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialExperienceId = searchParams.get('experienceId');
  const pendingCreate = searchParams.get('pendingCreate') === '1';
  const token = getAccessToken();
  const storedUser = getStoredUser();
  const { showToast } = useToast();

  const startedRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const completeRef = useRef<number | null>(null);
  const pollCountRef = useRef(0);

  const [experienceId, setExperienceId] = useState<string | null>(initialExperienceId);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? DEFAULT_NICKNAME);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<AnalysisPhase>('analyzing');
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  const cleanupTimers = useCallback(() => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (completeRef.current != null) {
      window.clearTimeout(completeRef.current);
      completeRef.current = null;
    }
  }, []);

  const shouldContinuePolling = (requestError: unknown) =>
    requestError instanceof ApiError &&
    (requestError.code === ERROR_CODES.ANALYSIS_TIMEOUT ||
      requestError.code === ERROR_CODES.AI_UPSTREAM_ERROR);

  const scheduleRedirect = useCallback(
    (targetExperienceId: string) => {
      cleanupTimers();
      setError('');
      setPhase('completed');
      completeRef.current = window.setTimeout(() => {
        setRedirectTarget(targetExperienceId);
      }, COMPLETE_DELAY_MS);
    },
    [cleanupTimers],
  );

  const fallbackToDetail = useCallback(
    (targetExperienceId: string, message?: string) => {
      cleanupTimers();
      if (message) {
        showToast(message);
      }
      navigate(`/experiences/${targetExperienceId}`, { replace: true });
    },
    [cleanupTimers, navigate, showToast],
  );

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  useEffect(() => {
    if (!experienceId && !pendingCreate) {
      return;
    }

    let mounted = true;

    async function checkReportStatus(targetExperienceId: string) {
      try {
        const report = await getReport(targetExperienceId);

        if (!mounted) {
          return true;
        }

        if (report.reportStatus === 'READY') {
          scheduleRedirect(targetExperienceId);
          return true;
        }

        if (report.reportStatus === 'ERROR') {
          fallbackToDetail(
            targetExperienceId,
            'AI 분석이 아직 준비되지 않아 상세 페이지로 먼저 이동합니다.',
          );
          return true;
        }
      } catch (reportError) {
        if (mounted) {
          setError(
            resolveErrorMessage(
              reportError,
              '분석 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.',
            ),
          );
        }
      }

      return false;
    }

    async function bootstrap() {
      let targetExperienceId = experienceId;

      if (!targetExperienceId && pendingCreate) {
        if (!token) {
          if (mounted) {
            setError('로그인 정보가 없어 다시 로그인해 주세요.');
          }
          return;
        }

        const pendingPayload = readPendingExperienceCreate();
        if (!pendingPayload) {
          if (mounted) {
            setError('등록할 경험 정보가 없어 다시 작성해 주세요.');
          }
          return;
        }

        try {
          const created = await createExperience(token, pendingPayload.payload);
          if (!mounted) {
            return;
          }

          targetExperienceId = String(created.id);
          setExperienceId(targetExperienceId);
          window.sessionStorage.removeItem(PENDING_EXPERIENCE_CREATE_KEY);
          navigate(`/analysis-result?experienceId=${targetExperienceId}`, { replace: true });
        } catch (requestError) {
          if (mounted) {
            setError(
              resolveErrorMessage(
                requestError,
                '경험 등록 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
              ),
            );
          }
          return;
        }
      }

      if (!targetExperienceId) {
        if (mounted) {
          setError('등록된 경험 정보를 찾을 수 없어요.');
        }
        return;
      }

      try {
        const experience = await getExperience(targetExperienceId);
        if (mounted) {
          setNickname(experience.author.nickname || storedUser?.nickname || DEFAULT_NICKNAME);
        }
      } catch {
        if (mounted) {
          setNickname(storedUser?.nickname ?? DEFAULT_NICKNAME);
        }
      }

      const readyInitially = await checkReportStatus(targetExperienceId);
      if (readyInitially || !mounted) {
        return;
      }

      if (!startedRef.current && token) {
        startedRef.current = true;
        try {
          await createAnalysis(token, targetExperienceId);
          const readyAfterCreate = await checkReportStatus(targetExperienceId);
          if (readyAfterCreate || !mounted) {
            return;
          }
        } catch (requestError) {
          if (!shouldContinuePolling(requestError)) {
            if (mounted) {
              setError(
                resolveErrorMessage(
                  requestError,
                  '분석 생성 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
                ),
              );
            }
            return;
          }
        }
      }

      pollCountRef.current = 0;
      pollRef.current = window.setInterval(() => {
        pollCountRef.current += 1;

        if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          fallbackToDetail(
            targetExperienceId,
            'AI 분석이 길어지고 있어 상세 페이지로 먼저 이동합니다.',
          );
          return;
        }

        void checkReportStatus(targetExperienceId);
      }, 1000);
    }

    void bootstrap();

    return () => {
      mounted = false;
      cleanupTimers();
    };
  }, [
    cleanupTimers,
    experienceId,
    fallbackToDetail,
    navigate,
    pendingCreate,
    scheduleRedirect,
    storedUser?.nickname,
    token,
  ]);

  const displayName = useMemo(() => nickname || DEFAULT_NICKNAME, [nickname]);

  if (!experienceId && !pendingCreate) {
    return <Navigate to="/" replace />;
  }

  if (redirectTarget) {
    return <Navigate to={`/experiences/${redirectTarget}`} replace />;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFFFF]">
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pb-[110px] pt-5">
        {error ? (
          <div className="w-full max-w-[320px]">
            <ErrorState message={error} />
          </div>
        ) : phase === 'completed' ? (
          <CompletedScreen />
        ) : (
          <AnalyzingScreen nickname={displayName} />
        )}
      </main>
    </div>
  );
}

function readPendingExperienceCreate(): PendingExperienceCreate | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_EXPERIENCE_CREATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PendingExperienceCreate>;
    if (!parsed.payload) {
      return null;
    }

    return { payload: parsed.payload };
  } catch {
    return null;
  }
}

function AnalyzingScreen({ nickname }: { nickname: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full text-center text-[24px] leading-[1.2] text-[#131416]">
        <p>
          <span className="font-semibold">{nickname}</span>
          <span>님의</span>
        </p>
        <p>경험을 분석하고 있어요</p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <LoaderCircle size={24} strokeWidth={2.2} className="animate-spin text-[#5E5E5E]" />
        <p className="text-[12px] leading-[1.4] text-[#8A8A8A]">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}

function CompletedScreen() {
  return (
    <div className="w-full text-center text-[24px] font-semibold leading-[1.2] text-[#131416]">
      분석 완료
    </div>
  );
}
