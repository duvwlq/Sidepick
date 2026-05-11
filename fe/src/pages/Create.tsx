import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/useToast';
import BottomButton from '../components/experience-write/BottomButton';
import ProgressHeader from '../components/experience-write/ProgressHeader';
import StepBasicInfo from '../components/experience-write/StepBasicInfo';
import StepDetailInfo from '../components/experience-write/StepDetailInfo';
import StepFreeWrite from '../components/experience-write/StepFreeWrite';
import StepSelectable from '../components/experience-write/StepSelectable';
import Layout from '../components/layout/Layout';
import { difficultyOptions } from '../constants/experienceOptions';
import { useExperienceWrite } from '../hooks/useExperienceWrite';
import { getCategories, type Category } from '../lib/api';
import {
  mapDailyHours,
  mapDailyHoursToWeeklyHours,
  mapPeriodToMonths,
  parseNumber,
} from '../lib/experience-write';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

const PENDING_EXPERIENCE_CREATE_KEY = 'pendingExperienceCreate';

export default function Create() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
          '경험 등록은 로그인이 필요해요',
        )}`,
        { replace: true },
      );
      return;
    }

    void loadCategories();
  }, [navigate, token]);

  useEffect(() => {
    if (categoryError) {
      showToast(categoryError);
    }
  }, [categoryError, showToast]);

  useEffect(() => {
    if (submitError) {
      showToast(submitError);
    }
  }, [showToast, submitError]);

  async function loadCategories() {
    setCategoryLoading(true);
    setCategoryError('');

    try {
      const payload = await getCategories();
      setCategories(payload);
    } catch (loadError) {
      setCategoryError(
        resolveErrorMessage(
          loadError,
          '카테고리 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
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

  const handleSubmit = () => {
    if (!token) {
      setSubmitError('로그인 정보가 없어요');
      return;
    }

    if (!user?.emailVerified) {
      setSubmitError('이메일 인증을 완료한 뒤 경험을 등록해주세요.');
      return;
    }

    const selectedCategory = categories.find((item) => String(item.id) === form.categories[0]);
    if (!selectedCategory) {
      setSubmitError('카테고리를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const pendingPayload = {
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
    };

    try {
      window.sessionStorage.setItem(
        PENDING_EXPERIENCE_CREATE_KEY,
        JSON.stringify({ payload: pendingPayload }),
      );
      navigate('/analysis-result?pendingCreate=1');
    } catch (createError) {
      setSubmitError(
        resolveErrorMessage(
          createError,
          '경험 등록 중 문제가 발생했어요. 다시 시도해주세요.',
        ),
      );
      setSubmitting(false);
    }
  };

  return (
    <Layout title="경험 등록" leftType="back" rightIcon="menu" onBack={handleBack}>
      <div className="flex w-full flex-col items-center gap-[32px] overflow-x-clip bg-[#FFFFFF] px-[16px] pb-[110px] pt-[20px]">
        <ProgressHeader step={step} progress={progress} />

        <StepTitle
          step={step}
          subtitle={
            step === 1 || step === 2 ? '경험을 이해하는 데 필요한 정보들이에요' : undefined
          }
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
            otherValue={form.difficultyEtc}
            onOtherChange={(value) =>
              setForm((previous) => ({ ...previous, difficultyEtc: value }))
            }
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
          <div className="w-full break-words font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B] [font-feature-settings:'case'_1]">
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
  step,
  subtitle,
}: {
  step: 1 | 2 | 3 | 4;
  subtitle?: string;
}) {
  const title =
    step === 3
      ? ['부업을 진행하면서,', '가장 어려웠던 점이 무엇이었나요?']
      : step === 4
        ? ['경험을 자유롭게', '정리해볼까요?']
        : ['어떤 상황에서 시작하셨나요?'];

  return (
    <div className={`flex w-full flex-col items-center ${subtitle ? 'gap-[5px]' : 'gap-0'}`}>
      <div
        className={`flex flex-col items-center ${
          step === 3 ? 'w-full max-w-[267px] gap-0' : 'w-full max-w-[228px] gap-0'
        }`}
      >
        {title.map((line) => (
          <p
            key={line}
            className="text-center font-['Pretendard'] text-[20px] font-[600] leading-[24px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]"
          >
            {line}
          </p>
        ))}
      </div>
      {subtitle ? (
        <p className="text-center font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
