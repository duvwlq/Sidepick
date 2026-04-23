import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import AuthSelectButton from '../../components/auth/AuthSelectButton';
import CarrierSelectSheet from '../../components/auth/CarrierSelectSheet';
import ResidentNumberInput from '../../components/auth/ResidentNumberInput';
import { useSignupFlow } from '../../context/SignupFlowContext';

export default function SignupBasicPage() {
  const navigate = useNavigate();
  const { form, updateField } = useSignupFlow();

  const [basicInfoStep, setBasicInfoStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCarrierSheetOpen, setIsCarrierSheetOpen] = useState(false);

  const getTitle = () => {
    switch (basicInfoStep) {
      case 1:
        return '휴대폰 번호로\n본인 확인을 진행할게요';
      case 2:
        return '사용 중인 통신사를\n선택해주세요';
      case 3:
        return '생년월일 및 성별을\n입력해 주세요';
      case 4:
        return '이름을 입력해 주세요';
      default:
        return '';
    }
  };

  const getButtonText = () => {
    if (basicInfoStep === 4) return '인증번호 받기';
    return '다음';
  };

  const handleBack = () => {
    setErrorMessage('');

    if (basicInfoStep > 1) {
      setBasicInfoStep((prev) => prev - 1);
      return;
    }

    navigate('/auth');
  };

  const handleNext = () => {
    setErrorMessage('');

    if (basicInfoStep === 1) {
      if (!form.phone.trim()) {
        setErrorMessage('휴대폰 번호를 입력해 주세요.');
        return;
      }
      setBasicInfoStep(2);
      return;
    }

    if (basicInfoStep === 2) {
      if (!form.carrier.trim()) {
        setErrorMessage('통신사를 선택해 주세요.');
        return;
      }
      setBasicInfoStep(3);
      return;
    }

    if (basicInfoStep === 3) {
      if (form.birth.length !== 6) {
        setErrorMessage('생년월일 6자리를 입력해 주세요.');
        return;
      }

      if (form.genderDigit.length !== 1) {
        setErrorMessage('주민등록번호 뒤 첫 자리를 입력해 주세요.');
        return;
      }

      if (!['1', '2', '3', '4'].includes(form.genderDigit)) {
        setErrorMessage('주민등록번호 뒤 첫 자리를 올바르게 입력해 주세요.');
        return;
      }

      setBasicInfoStep(4);
      return;
    }

    if (basicInfoStep === 4) {
      if (!form.name.trim()) {
        setErrorMessage('이름을 입력해 주세요.');
        return;
      }

      navigate('/signup/verify');
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="개인 정보 등록" onBack={handleBack} />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            {getTitle()}
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {basicInfoStep >= 1 && (
            <AuthInput
              label="휴대폰 번호"
              placeholder="휴대폰 번호를 입력해주세요"
              value={form.phone}
              readOnly={basicInfoStep > 1}
              onChange={(e) =>
                updateField('phone', e.target.value.replace(/\D/g, ''))
              }
            />
          )}

          {basicInfoStep >= 2 && (
            <AuthSelectButton
              label="통신사"
              placeholder="통신사를 선택해주세요"
              value={form.carrier}
              readOnly={basicInfoStep > 2}
              onClick={() => {
                if (basicInfoStep === 2) {
                  setIsCarrierSheetOpen(true);
                }
              }}
            />
          )}

          {basicInfoStep >= 3 && (
            <ResidentNumberInput
              birthValue={form.birth}
              genderDigitValue={form.genderDigit}
              readOnly={basicInfoStep > 3}
              onBirthChange={(value) => updateField('birth', value)}
              onGenderDigitChange={(value) => updateField('genderDigit', value)}
            />
          )}

          {basicInfoStep >= 4 && (
            <AuthInput
              label="이름"
              placeholder="이름을 입력해주세요"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          )}

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <AuthButton onClick={handleNext}>{getButtonText()}</AuthButton>
        </div>
      </section>

      <CarrierSelectSheet
        open={isCarrierSheetOpen}
        selectedCarrier={form.carrier}
        onClose={() => setIsCarrierSheetOpen(false)}
        onSelect={(carrier) => {
          updateField('carrier', carrier);
          setErrorMessage('');
        }}
      />
    </AuthLayout>
  );
}
