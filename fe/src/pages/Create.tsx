import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomButton from '../components/experience-write/BottomButton';
import ProgressHeader from '../components/experience-write/ProgressHeader';
import StepBasicInfo from '../components/experience-write/StepBasicInfo';
import StepFreeWrite from '../components/experience-write/StepFreeWrite';
import StepSelectable from '../components/experience-write/StepSelectable';
import Layout from '../components/layout/Layout';
import { causeOptions, difficultyOptions } from '../constants/experienceOptions';
import { useExperienceWrite } from '../hooks/useExperienceWrite';
import { createExperience, getCategories, type Category } from '../lib/api';
import { getAccessToken, getStoredUser } from '../lib/session';

export default function Create() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getAccessToken();
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');

  const { step, form, setForm, progress, next, prev, toggleArray, isValid } =
    useExperienceWrite();

  useEffect(() => {
    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent(
          '경험 등록은 로그인 후 이용할 수 있어요.',
        )}`,
        { replace: true },
      );
      return;
    }

    void loadCategories();
  }, [navigate, token]);

  async function loadCategories() {
    setCategoryLoading(true);
    setCategoryError('');

    try {
      const payload = await getCategories();
      setCategories(payload);
    } catch (loadError) {
      setCategoryError(
        loadError instanceof Error
          ? loadError.message
          : '카테고리 목록을 불러오지 못했습니다.',
      );
    } finally {
      setCategoryLoading(false);
    }
  }

  const handleBack = () => {
    if (step === 1) {
      navigate('/');
      return;
    }

    prev();
  };

  const handleSubmit = async () => {
    if (!token) {
      setSubmitError('먼저 로그인해 주세요.');
      return;
    }

    if (!user?.emailVerified) {
      setSubmitError('이메일 인증을 완료해야 경험을 작성할 수 있습니다.');
      return;
    }

    const selectedCategory = categories.find(
      (item) => item.name === form.categories[0],
    );

    if (!selectedCategory) {
      setSubmitError('카테고리를 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const created = await createExperience(token, {
        title: `${selectedCategory.name} 경험`,
        content: form.content,
        categoryId: selectedCategory.id,
        businessType: selectedCategory.name,
        investmentAmount: parseNumber(form.expense),
        durationMonths: mapPeriodToMonths(form.totalPeriod),
        weeklyHours: mapDailyHoursToWeeklyHours(form.dailyHours),
        averageDailyHours: mapDailyHours(form.dailyHours),
        isConcurrentWithMainJob:
          form.isConcurrentWithMainJob === '예'
            ? true
            : form.isConcurrentWithMainJob === '아니오'
              ? false
              : undefined,
        monthlyRevenue: parseNumber(form.revenue),
        failureReason: form.causes[0] ?? '기타',
        failureReasons: form.causes,
        difficulties: form.difficulties,
        difficultyEtc: '',
        difficultyExtra: '',
        lessonsLearned: form.content,
        wouldRetry: true,
      });

      navigate(`/experiences/${created.id}`);
    } catch (createError) {
      setSubmitError(
        createError instanceof Error
          ? createError.message
          : '경험 등록에 실패했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="경험 등록"
      leftType="back"
      showRightIcon={false}
      onBack={handleBack}
    >
      <div className="px-4 pb-6 pt-4">
        <div className="mb-4 rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          {user ? (
            <div>
              <div className="text-base font-semibold text-[#111111]">
                {user.nickname}
              </div>
              <div className="mt-1 text-sm text-[#666666]">{user.email}</div>
            </div>
          ) : (
            <div className="text-sm text-[#666666]">
              로그인 후 경험을 작성할 수 있습니다.
            </div>
          )}
        </div>

        <ProgressHeader step={step} progress={progress} />

        {step === 1 ? (
          <StepBasicInfo
            categories={categories}
            form={form}
            setForm={setForm}
            loading={categoryLoading}
            error={categoryError}
          />
        ) : null}

        {step === 2 ? (
          <StepSelectable
            title="실패를 겪은 원인이 무엇인가요?"
            explain="가장 가까운 이유를 하나 선택해 주세요."
            options={causeOptions}
            selected={form.causes}
            onSelect={(value) =>
              setForm((previous) => ({ ...previous, causes: [value] }))
            }
          />
        ) : null}

        {step === 3 ? (
          <StepSelectable
            title="부업을 진행하면서 특히 어려웠던 점은 무엇이었나요?"
            explain="복수 선택도 가능합니다."
            options={difficultyOptions}
            selected={form.difficulties}
            onSelect={(value) => toggleArray('difficulties', value)}
          />
        ) : null}

        {step === 4 ? (
          <StepFreeWrite
            value={form.content}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, content: value }))
            }
          />
        ) : null}

        {submitError ? (
          <div className="mt-4 text-sm text-[#D33B3B]">{submitError}</div>
        ) : null}

        <BottomButton
          label={
            step === 4
              ? submitting
                ? '등록 중...'
                : '작성 완료'
              : '다음 단계'
          }
          disabled={!isValid || submitting || categoryLoading}
          onClick={step === 4 ? () => void handleSubmit() : next}
        />
      </div>
    </Layout>
  );
}

function parseNumber(value: string) {
  const onlyDigits = value.replace(/[^\d]/g, '');
  return onlyDigits ? Number(onlyDigits) : undefined;
}

function mapPeriodToMonths(value: string) {
  switch (value) {
    case '1개월 미만':
      return 1;
    case '1~3개월':
      return 3;
    case '3~6개월':
      return 6;
    case '6개월~1년':
      return 12;
    case '1년 이상':
      return 12;
    default:
      return undefined;
  }
}

function mapDailyHours(value: string) {
  switch (value) {
    case '1시간 미만':
      return 'UNDER_1_HOUR';
    case '1~3시간':
      return 'ONE_TO_THREE_HOURS';
    case '3~5시간':
      return 'THREE_TO_FIVE_HOURS';
    case '5시간 이상':
      return 'OVER_FIVE_HOURS';
    default:
      return undefined;
  }
}

function mapDailyHoursToWeeklyHours(value: string) {
  switch (value) {
    case '1시간 미만':
      return 3;
    case '1~3시간':
      return 14;
    case '3~5시간':
      return 28;
    case '5시간 이상':
      return 40;
    default:
      return undefined;
  }
}
