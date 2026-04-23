import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useExperienceWrite } from '../hooks/useExperienceWrite';
import ProgressHeader from '../components/experience-write/ProgressHeader';
import StepBasicInfo from '../components/experience-write/StepBasicInfo';
import StepSelectable from '../components/experience-write/StepSelectable';
import StepFreeWrite from '../components/experience-write/StepFreeWrite';
import BottomButton from '../components/experience-write/BottomButton';
import {
  causeOptions,
  difficultyOptions,
} from '../constants/experienceOptions';

export default function Create() {
  const navigate = useNavigate();

  const { step, form, setForm, progress, next, prev, toggleArray, isValid } =
    useExperienceWrite();

  const handleBack = () => {
    if (step === 1) {
      navigate('/');
      return;
    }

    prev();
  };

  const handleSubmit = () => {
    console.log('제출 데이터:', form);

    // 나중에 API 붙일 자리
    // await submitExperience(form);

    navigate('/analysis-result');
  };

  return (
    <Layout
      title="경험 등록"
      leftType="back"
      showRightIcon={false}
      onBack={handleBack}
    >
      <div className="px-4 pt-4">
        <ProgressHeader step={step} progress={progress} />

        {step === 1 && <StepBasicInfo form={form} setForm={setForm} />}

        {step === 2 && (
          <StepSelectable
            title="주된 실패 원인?"
            explain="가장 큰 원인 하나만 골라주세요"
            options={causeOptions}
            selected={form.causes}
            single
            onSelect={(value) =>
              setForm((prev) => ({ ...prev, causes: [value] }))
            }
          />
        )}

        {step === 3 && (
          <StepSelectable
            title="가장 어려웠던 점"
            explain="복수 선택 가능"
            options={difficultyOptions}
            selected={form.difficulties}
            onSelect={(value) => toggleArray('difficulties', value)}
          />
        )}

        {step === 4 && (
          <StepFreeWrite
            value={form.content}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, content: value }))
            }
          />
        )}

        <BottomButton
          label={step === 4 ? '작성 완료' : '다음 단계'}
          disabled={!isValid}
          onClick={step === 4 ? handleSubmit : next}
        />
      </div>
    </Layout>
  );
}
