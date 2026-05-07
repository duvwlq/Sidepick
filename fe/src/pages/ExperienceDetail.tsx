import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AiAnalysisResult from '../components/ai-analysis/AiAnalysisResult';
import {
  deleteExperience,
  getExperience,
  getReport,
  updateExperience,
  type Experience,
} from '../lib/api';
import { mapReportToViewModel } from '../lib/analysisMapper';
import { type AnalysisMockData } from '../constants/mockAnalysisData';
import { getAccessToken, getStoredUser } from '../lib/session';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function ExperienceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = getAccessToken();
  const currentUser = getStoredUser();
  const loadedIdRef = useRef<string | null>(null);

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompletedToast, setShowCompletedToast] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisMockData | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    failureReason: '',
  });

  useEffect(() => {
    if (searchParams.get('freshAnalysis') !== '1') {
      return;
    }
    setShowCompletedToast(true);
    const next = new URLSearchParams(searchParams);
    next.delete('freshAnalysis');
    setSearchParams(next, { replace: true });
    const timer = window.setTimeout(() => setShowCompletedToast(false), 1500);
    return () => window.clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!id) {
      setError('경험 ID가 없습니다.');
      setLoading(false);
      return;
    }

    if (loadedIdRef.current === id) {
      return;
    }

    loadedIdRef.current = id;
    void loadExperience(id);
  }, [id]);

  useEffect(() => {
    if (!experience || !experience.hasPatternAnalysis) {
      setAnalysisData(null);
      return;
    }

    let cancelled = false;
    getReport(experience.id)
      .then((report) => {
        if (cancelled) {
          return;
        }
        if (report.reportStatus === 'READY') {
          setAnalysisData(mapReportToViewModel(report));
        } else {
          setAnalysisData(null);
        }
      })
      .catch((reportError) => {
        if (cancelled) {
          return;
        }
        console.warn(
          '[ExperienceDetail] getReport failed, falling back to mock',
          reportError,
        );
        setAnalysisData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [experience]);

  async function loadExperience(experienceId: string) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperience(experienceId);
      setExperience(payload);
      setForm({
        title: payload.title,
        content: payload.content,
        failureReason:
          payload.failureReasons[0] ?? payload.failureReason ?? '기타',
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : '경험을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!experience || !id || !token) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updated = await updateExperience(token, id, {
        title: form.title,
        content: form.content,
        categoryId: experience.category.id,
        businessType: experience.businessType ?? experience.category.name,
        investmentAmount: experience.investmentAmount ?? undefined,
        durationMonths: experience.durationMonths ?? undefined,
        averageDailyHours: experience.averageDailyHours ?? undefined,
        isConcurrentWithMainJob:
          experience.isConcurrentWithMainJob ?? undefined,
        monthlyRevenue: experience.monthlyRevenue ?? undefined,
        failureReason: form.failureReason,
        failureReasons: [form.failureReason],
        difficulties: experience.difficulties,
        targetMarket: experience.targetMarket ?? undefined,
        marketingChannels: experience.marketingChannels,
        lessonsLearned: experience.lessonsLearned ?? form.content,
        wouldRetry: experience.wouldRetry ?? undefined,
      });
      setExperience(updated);
      setEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : '경험 수정에 실패했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !token) {
      setError('로그인 후 다시 시도해주세요.');
      return;
    }

    const confirmed = window.confirm('정말로 삭제하시겠어요?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteExperience(token, id);
      navigate('/');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : '경험 삭제에 실패했어요. 잠시 후 다시 시도해주세요.',
      );
    }
  }

  const isOwner =
    Boolean(currentUser && experience) &&
    currentUser?.id === experience?.author.id;

  const keywordChips = useMemo(() => {
    if (!experience) {
      return [];
    }

    const merged = [
      ...experience.failureReasons,
      ...experience.difficulties,
      experience.failureReason ?? '',
    ].filter(Boolean);

    return Array.from(new Set(merged)).slice(0, 4);
  }, [experience]);

  const isAnalysisReady = Boolean(experience?.hasPatternAnalysis);
  const authorNickname = experience?.author?.nickname ?? '';
  const formattedDate = experience ? formatDate(experience.createdAt) : '';

  return (
    <Layout
      title="사례 상세"
      leftType="back"
      showRightIcon={false}
      onBack={() => navigate(-1)}
    >
      {loading ? (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#8A8A8A] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            사례를 불러오는 중이에요.
          </div>
        </div>
      ) : error ? (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#D33B3B] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            {error}
          </div>
        </div>
      ) : experience ? (
        <div className="space-y-3 pb-6">
          <section className="bg-white px-4 pb-5 pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-[#8A8A8A]">
              <span className="font-medium text-[#3A3A3A]">
                {authorNickname}님
              </span>
              {formattedDate ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{formattedDate}</span>
                </>
              ) : null}
            </div>

            {editing ? (
              <div className="space-y-3">
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-[#D9DEE8] px-4 text-sm"
                />
                <input
                  value={form.failureReason}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      failureReason: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-[#D9DEE8] px-4 text-sm"
                />
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      content: event.target.value,
                    }))
                  }
                  className="min-h-40 w-full rounded-2xl border border-[#D9DEE8] p-4 text-sm"
                />
              </div>
            ) : (
              <>
                <h1 className="mb-3 text-xl font-semibold leading-7 text-neutral-950">
                  {experience.title}
                </h1>
                <p className="mb-4 whitespace-pre-line text-sm leading-6 text-[#5E5E5E]">
                  {experience.content}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#F3F3F3] px-3 py-1 text-[11px] text-[#8A8A8A]">
                    {experience.category.name}
                  </span>
                  {keywordChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-[#F3F3F3] px-3 py-1 text-[11px] text-[#8A8A8A]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F8F8F8] p-3 text-xs">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <dt className="text-[#8A8A8A]">진행 기간</dt>
                    <dd className="font-semibold text-neutral-950">
                      {experience.durationMonths ?? 0}개월
                    </dd>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-x border-[#EAEAEA] text-center">
                    <dt className="text-[#8A8A8A]">월 수익</dt>
                    <dd className="font-semibold text-neutral-950">
                      {(experience.monthlyRevenue ?? 0).toLocaleString()}원
                    </dd>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <dt className="text-[#8A8A8A]">투자금</dt>
                    <dd className="font-semibold text-neutral-950">
                      {(experience.investmentAmount ?? 0).toLocaleString()}원
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </section>

          <div className="px-4 pt-2">
            {isAnalysisReady ? (
              <AiAnalysisResult data={analysisData} />
            ) : (
              <section className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <h2 className="text-xl font-semibold leading-7 text-neutral-950">
                  {authorNickname
                    ? `${authorNickname}님의`
                    : '회원님의'}
                  <br />
                  경험을 분석하고 있어요!
                </h2>
                <div
                  aria-hidden
                  className="my-5 h-6 w-6 animate-spin rounded-full border-2 border-[#EAEAEA] border-t-black"
                />
                <p className="text-xs text-[#8A8A8A]">잠시만 기다려주세요.</p>
              </section>
            )}
          </div>

          {isOwner ? (
            <div className="px-4 pt-2">
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="h-12 flex-1 rounded-2xl bg-black text-sm font-semibold text-white disabled:bg-[#9A9A9A]"
                    >
                      {saving ? '저장 중...' : '수정 저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="h-12 flex-1 rounded-2xl border border-[#D9DEE8] text-sm text-[#3A3A3A]"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="h-12 flex-1 rounded-2xl bg-black text-sm font-semibold text-white"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="h-12 flex-1 rounded-2xl border border-[#F0B6B6] text-sm text-[#D33B3B]"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showCompletedToast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        >
          <div className="rounded-2xl bg-white px-10 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.18)]">
            <p className="text-lg font-semibold text-neutral-950">분석 완료</p>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
