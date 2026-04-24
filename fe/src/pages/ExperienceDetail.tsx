import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  deleteExperience,
  getExperience,
  updateExperience,
  type Experience,
} from '../lib/api';
import { getAccessToken, getStoredUser } from '../lib/session';

export default function ExperienceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = getAccessToken();
  const currentUser = getStoredUser();
  const loadedIdRef = useRef<string | null>(null);

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    failureReason: '',
  });

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

  async function loadExperience(experienceId: string) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperience(experienceId);
      setExperience(payload);
      setForm({
        title: payload.title,
        content: payload.content,
        failureReason: payload.failureReasons[0] ?? payload.failureReason ?? '기타',
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : '경험을 불러오지 못했습니다.',
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
          : '경험 수정에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !token) {
      setError('로그인 정보가 없습니다.');
      return;
    }

    const confirmed = window.confirm('정말로 삭제하시겠습니까?');
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
          : '경험 삭제에 실패했습니다.',
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

  return (
    <Layout
      title="경험 상세"
      leftType="back"
      showRightIcon={false}
      onBack={() => navigate(-1)}
    >
      <div className="space-y-4 px-4 pt-4">
        {loading ? (
          <div className="rounded-[18px] bg-white p-6 text-sm text-[#666666] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            경험을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="rounded-[18px] bg-white p-6 text-sm text-[#D33B3B] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            {error}
          </div>
        ) : experience ? (
          <>
            <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[#555555]">
                  {experience.category.name}
                </span>
                {keywordChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[#F3F4F6] px-3 py-1 text-[#555555]"
                  >
                    {chip}
                  </span>
                ))}
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
                    className="h-12 w-full rounded-[16px] border border-[#D9DEE8] px-4 text-sm"
                  />
                  <input
                    value={form.failureReason}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        failureReason: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-[16px] border border-[#D9DEE8] px-4 text-sm"
                  />
                  <textarea
                    value={form.content}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        content: event.target.value,
                      }))
                    }
                    className="min-h-40 w-full rounded-[16px] border border-[#D9DEE8] p-4 text-sm"
                  />
                </div>
              ) : (
                <>
                  <h1 className="mb-2 text-2xl font-semibold text-[#111111]">
                    {experience.title}
                  </h1>
                  <p className="mb-4 whitespace-pre-line text-sm leading-6 text-[#666666]">
                    {experience.content}
                  </p>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm text-[#666666]">
                <div>작성자: {experience.author.nickname}</div>
                <div>조회수: {experience.viewCount}</div>
                <div>
                  투자 금액: {(experience.investmentAmount ?? 0).toLocaleString()}원
                </div>
                <div>진행 기간: {experience.durationMonths ?? 0}개월</div>
                <div>하루 할애 시간: {experience.averageDailyHours ?? '미입력'}</div>
                <div>
                  월 수익: {(experience.monthlyRevenue ?? 0).toLocaleString()}원
                </div>
              </div>
            </div>

            {experience.analysis ? (
              <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <h2 className="mb-3 text-lg font-semibold text-[#111111]">
                  AI 분석 요약
                </h2>
                <p className="whitespace-pre-line text-sm leading-6 text-[#666666]">
                  {experience.analysis.structuredSummary}
                </p>
              </div>
            ) : null}

            <div className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <button
                type="button"
                onClick={() =>
                  navigate(`/analysis-result?experienceId=${experience.id}`)
                }
                className="h-12 w-full rounded-[16px] bg-[#111111] text-sm font-medium text-white"
              >
                AI 분석 결과 보기
              </button>
            </div>

            {isOwner ? (
              <div className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="h-12 flex-1 rounded-[16px] bg-[#111111] text-sm font-medium text-white disabled:bg-gray-400"
                      >
                        {saving ? '저장 중...' : '수정 저장'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="h-12 flex-1 rounded-[16px] border border-[#D9DEE8] text-sm"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="h-12 flex-1 rounded-[16px] bg-[#111111] text-sm font-medium text-white"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        className="h-12 flex-1 rounded-[16px] border border-[#F0B6B6] text-sm text-[#D33B3B]"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
