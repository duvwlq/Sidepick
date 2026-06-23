import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [experienceId, setExperienceId] = useState<string | null>(initialExperienceId);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? '사용자');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<AnalysisPhase>('analyzing');
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  const completeDelayMs = 1200;

  const cleanupTimers = () => {
    if (pollRef.current != null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (completeRef.current != null) {
      window.clearTimeout(completeRef.current);
      completeRef.current = null;
    }
  };

  const scheduleRedirect = (targetExperienceId: string) => {
    cleanupTimers();
    setPhase('completed');
    completeRef.current = window.setTimeout(() => {
      setRedirectTarget(targetExperienceId);
    }, completeDelayMs);
  };

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

    async function bootstrap() {
      let targetExperienceId = experienceId;

      if (!targetExperienceId && pendingCreate) {
        if (!token) {
          if (mounted) {
            setError('로그인 정보가 없어요. 다시 로그인해주세요.');
          }
          return;
        }

        const pendingPayload = readPendingExperienceCreate();
        if (!pendingPayload) {
          if (mounted) {
            setError('등록할 경험 정보를 찾을 수 없어요. 다시 작성해주세요.');
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
                '경험 등록 중 문제가 발생했어요. 다시 시도해주세요.',
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
          setNickname(experience.author.nickname || storedUser?.nickname || '사용자');
        }
      } catch {
        if (mounted) {
          setNickname(storedUser?.nickname ?? '사용자');
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
          if (
            requestError instanceof ApiError &&
            (requestError.code === ERROR_CODES.ANALYSIS_TIMEOUT ||
              requestError.code === ERROR_CODES.AI_UPSTREAM_ERROR)
          ) {
            if (mounted) {
              setError(resolveErrorMessage(requestError, '잠시 연결이 불안정해요. 다시 시도해주세요.'));
            }
            return;
          }

          if (mounted) {
            setError(resolveErrorMessage(requestError, '잠시 연결이 불안정해요. 다시 시도해주세요.'));
          }
          return;
        }
      }

      pollRef.current = window.setInterval(() => {
        void checkReportStatus(targetExperienceId);
      }, 1000);
    }

    async function checkReportStatus(targetExperienceId: string) {
      try {
        const report = await getReport(targetExperienceId);
        if (report.reportStatus === 'READY') {
          if (mounted) {
            scheduleRedirect(targetExperienceId);
          }
          return true;
        }
      } catch (reportError) {
        if (mounted) {
          setError(resolveErrorMessage(reportError, '잠시 연결이 불안정해요. 다시 시도해주세요.'));
        }
      }

      return false;
    }

    void bootstrap();

    return () => {
      mounted = false;
      cleanupTimers();
    };
  }, [experienceId, navigate, pendingCreate, storedUser?.nickname, token]);

  const displayName = useMemo(() => nickname || '사용자', [nickname]);

  if (!experienceId && !pendingCreate) {
    return <Navigate to="/" replace />;
  }

  if (redirectTarget) {
    return <Navigate to={`/experiences/${redirectTarget}`} replace />;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFFFF]">
      <DeviceStatusBar />

      <main className="flex min-h-[calc(100vh-61px)] flex-col items-center justify-center px-4 pb-[110px] pt-5">
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

function DeviceStatusBar() {
  return (
    <div className="flex h-[59px] items-center justify-between bg-white px-6 pb-[19px] pt-[21px]">
      <div className="flex-1 text-[17px] font-semibold leading-[22px] text-black">9:41</div>
      <div className="flex flex-1 items-center justify-end gap-[7px]">
        <div className="flex h-[12px] items-end gap-[2px]">
          <span className="block h-[4px] w-[3px] rounded-[1px] bg-black" />
          <span className="block h-[6px] w-[3px] rounded-[1px] bg-black" />
          <span className="block h-[8px] w-[3px] rounded-[1px] bg-black" />
          <span className="block h-[10px] w-[3px] rounded-[1px] bg-black" />
        </div>
        <div className="relative h-[12px] w-[17px]">
          <div className="absolute inset-0 rounded-[2px] border border-black/90" />
          <div className="absolute left-[2px] top-[2px] h-[6px] w-[9px] rounded-[1px] bg-black" />
          <div className="absolute right-[-2px] top-[3px] h-[4px] w-[1.5px] rounded-full bg-black" />
        </div>
        <div className="relative h-[13px] w-[27px] rounded-[4px] border border-black/60 p-[1px]">
          <div className="h-full w-[70%] rounded-[3px] bg-black" />
        </div>
      </div>
    </div>
  );
}

function AnalyzingScreen({ nickname }: { nickname: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full text-center text-[24px] leading-[1.2] text-[#131416]">
        <p>
          <span className="font-semibold">{nickname}</span>
          <span>님의</span>
        </p>
        <p>경험을 분석하고 있어요!</p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <LoaderCircle size={24} strokeWidth={2.2} className="animate-spin text-[#5E5E5E]" />
        <p className="text-[12px] leading-[1.4] text-[#8A8A8A]">잠시만 기다려주세요.</p>
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
