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
    void loadCategories();
  }, []);

  async function loadCategories() {
    setCategoryLoading(true);
    setCategoryError('');

    try {
      const payload = await getCategories();
      setCategories(payload);
    } catch (error) {
      setCategoryError(
        error instanceof Error
          ? error.message
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

    const selectedCategory = categories.find(
      (item) => item.name === form.categories[0],
    );

    setSubmitting(true);
    setSubmitError('');

    try {
      const created = await createExperience(token, {
        title: `${selectedCategory?.name ?? '기타'} 실패 경험`,
        content: form.content,
        categoryId: selectedCategory?.id ?? 5,
        businessType: selectedCategory?.name ?? '기타',
        investmentAmount: parseNumber(form.expense),
        durationMonths: mapPeriodToMonths(form.totalPeriod),
        failureReason: form.causes[0] ?? '기타',
        targetMarket: form.currentStatus || undefined,
        marketingChannels: form.difficulties,
        lessonsLearned: form.content,
        wouldRetry: true,
      });
      navigate(`/experiences/${created.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '경험담 등록에 실패했습니다.',
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
      <div className="px-4 pt-4">
        <div className="mb-4 rounded-[10px] bg-white p-4 text-sm text-gray-600">
          {user ? (
            <div>
              <div className="font-medium text-gray-900">{user.nickname}</div>
              <div>{user.email}</div>
            </div>
          ) : (
            <div>로그인 후 작성할 수 있습니다.</div>
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
            title="주된 실패 원인은 무엇이었나요?"
            explain="가장 가까운 항목 하나를 선택해 주세요."
            options={causeOptions}
            selected={form.causes}
            onSelect={(value) =>
              setForm((prev) => ({ ...prev, causes: [value] }))
            }
          />
        ) : null}

        {step === 3 ? (
          <StepSelectable
            title="가장 어려웠던 지점은 무엇이었나요?"
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
              setForm((prev) => ({ ...prev, content: value }))
            }
          />
        ) : null}

        {submitError ? (
          <div className="mt-4 text-sm text-red-600">{submitError}</div>
        ) : null}

        <BottomButton
          label={
            step === 4 ? (submitting ? '등록 중...' : '작성 완료') : '다음 단계'
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
  if (value.includes('1')) return 1;
  if (value.includes('3')) return 3;
  if (value.includes('6')) return 6;
  return undefined;
}
