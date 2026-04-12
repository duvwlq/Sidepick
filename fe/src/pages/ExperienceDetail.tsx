import { useEffect, useState } from 'react';
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
      setError('경험담 ID가 없습니다.');
      setLoading(false);
      return;
    }

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
        failureReason: payload.failureReason,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : '경험담을 불러오지 못했습니다.',
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
        businessType: experience.businessType,
        investmentAmount: experience.investmentAmount ?? undefined,
        durationMonths: experience.durationMonths ?? undefined,
        failureReason: form.failureReason,
        targetMarket: experience.targetMarket ?? undefined,
        marketingChannels: experience.marketingChannels,
        lessonsLearned: form.content,
        wouldRetry: experience.wouldRetry ?? undefined,
      });
      setExperience(updated);
      setEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : '경험담 수정에 실패했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !token) {
      setError('로그인 후 삭제할 수 있습니다.');
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
          : '경험담 삭제에 실패했습니다.',
      );
    }
  }

  const isOwner =
    Boolean(currentUser && experience) &&
    currentUser?.id === experience?.author.id;

  return (
    <Layout
      title="경험담 상세"
      leftType="back"
      showRightIcon={false}
      onBack={() => navigate(-1)}
    >
      <div className="space-y-4 px-4 pt-4">
        {loading ? (
          <div className="rounded-[10px] bg-white p-6 text-sm text-gray-500">
            경험담을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="rounded-[10px] bg-white p-6 text-sm text-red-600">
            {error}
          </div>
        ) : experience ? (
          <>
            <div className="rounded-[10px] bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-gray-100 px-2 py-1">
                  {experience.category.name}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1">
                  {experience.failureReason}
                </span>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                  />
                  <input
                    value={form.failureReason}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        failureReason: event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm"
                  />
                  <textarea
                    value={form.content}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        content: event.target.value,
                      }))
                    }
                    className="min-h-40 w-full rounded-xl border border-gray-200 p-3 text-sm"
                  />
                </div>
              ) : (
                <>
                  <h1 className="mb-2 text-2xl font-semibold text-gray-900">
                    {experience.title}
                  </h1>
                  <p className="mb-4 whitespace-pre-line text-sm leading-6 text-gray-700">
                    {experience.content}
                  </p>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>작성자: {experience.author.nickname}</div>
                <div>조회수: {experience.viewCount}</div>
                <div>
                  투자금: {(experience.investmentAmount ?? 0).toLocaleString()}원
                </div>
                <div>기간: {experience.durationMonths ?? 0}개월</div>
              </div>
            </div>

            <div className="rounded-[10px] bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() =>
                  navigate(`/analysis-result?experienceId=${experience.id}`)
                }
                className="h-11 w-full rounded-xl bg-black text-sm font-medium text-white"
              >
                AI 분석 결과 보기
              </button>
            </div>

            {isOwner ? (
              <div className="rounded-[10px] bg-white p-4 shadow-sm">
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="h-11 flex-1 rounded-xl bg-black text-sm font-medium text-white disabled:bg-gray-400"
                      >
                        {saving ? '저장 중...' : '수정 저장'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="h-11 flex-1 rounded-xl border border-gray-300 text-sm"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="h-11 flex-1 rounded-xl bg-black text-sm font-medium text-white"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        className="h-11 flex-1 rounded-xl border border-red-300 text-sm text-red-600"
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
