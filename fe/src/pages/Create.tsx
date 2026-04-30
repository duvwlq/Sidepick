import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomButton from '../components/experience-write/BottomButton';
import ProgressHeader from '../components/experience-write/ProgressHeader';
import StepBasicInfo from '../components/experience-write/StepBasicInfo';
import StepDetailInfo from '../components/experience-write/StepDetailInfo';
import StepFreeWrite from '../components/experience-write/StepFreeWrite';
import StepSelectable from '../components/experience-write/StepSelectable';
import Layout from '../components/layout/Layout';
import { difficultyOptions } from '../constants/experienceOptions';
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
          '경험 등록을 하려면 로그인이 필요해요',
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
        failureReason: form.difficulties[0] ?? '기타',
        failureReasons: form.difficulties,
        difficulties: form.difficulties,
        difficultyEtc: form.difficultyEtc.trim(),
        difficultyExtra: form.difficultyExtra.trim(),
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
      rightIcon="menu"
      onBack={handleBack}
    >
      <div className="flex w-full flex-col items-center gap-[20px] bg-[#FFFFFF] px-[16px] pb-[110px] pt-[20px]">
        <ProgressHeader step={step} progress={progress} />

        <StepTitle
          title={
            step === 3
              ? '부업을 진행하면서\n특히 어려웠던 점은 무엇이었나요?'
              : step === 4
                ? '경험을 자유롭게 정리해볼까요?'
                : '어떤 상황에서 시작하셨나요?'
          }
          subtitle={
            step === 1 || step === 2
              ? '경험을 이해하는 데 필요한 정보들이에요'
              : undefined
          }
          multiline={step === 3}
        />

        {step === 1 ? (
          <StepBasicInfo
            categories={categories}
            form={form}
            setForm={setForm}
            loading={categoryLoading}
            error={categoryError}
          />
        ) : null}

        {step === 2 ? <StepDetailInfo form={form} setForm={setForm} /> : null}

        {step === 3 ? (
          <StepSelectable
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
          <div className="w-full font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B] [font-feature-settings:'case'_1]">
            {submitError}
          </div>
        ) : null}

        <BottomButton
          label={step === 4 ? (submitting ? '등록 중...' : '작성 완료') : '다음 단계'}
          disabled={!isValid || submitting || categoryLoading}
          onClick={step === 4 ? () => void handleSubmit() : next}
          showChevron={step !== 4}
        />
      </div>
    </Layout>
  );
}

function StepTitle({
  title,
  subtitle,
  multiline = false,
}: {
  title: string;
  subtitle?: string;
  multiline?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col items-center ${
        subtitle ? 'gap-[5px]' : 'gap-0'
      }`}
    >
      <h2
        className={`whitespace-pre-line text-center font-['Pretendard'] text-[20px] font-[600] leading-[24px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1] ${
          multiline ? 'w-[267px]' : 'w-[228px]'
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="text-center font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function parseNumber(value: string) {
  const onlyDigits = value.replace(/[^\d]/g, '');
  return onlyDigits ? Number(onlyDigits) : undefined;
}

function mapPeriodToMonths(value: string) {
  if (value === '1개월 미만') {
    return 1;
  }

  if (value === '1년 이상') {
    return 12;
  }

  const months = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(months) && months > 0 ? months : undefined;
}

function mapDailyHours(value: string) {
  if (value === '1시간 미만') {
    return 'UNDER_1_HOUR';
  }

  const hours = Number(value.replace(/[^\d]/g, ''));

  if (!hours) {
    return undefined;
  }

  if (hours <= 3) {
    return 'ONE_TO_THREE_HOURS';
  }

  if (hours <= 5) {
    return 'THREE_TO_FIVE_HOURS';
  }

  return 'OVER_FIVE_HOURS';
}

function mapDailyHoursToWeeklyHours(value: string) {
  if (value === '1시간 미만') {
    return 3;
  }

  if (value === '8시간 이상') {
    return 40;
  }

  const hours = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(hours) && hours > 0 ? Math.min(hours * 7, 40) : undefined;
}
