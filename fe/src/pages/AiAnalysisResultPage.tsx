import { Navigate, useSearchParams } from 'react-router-dom';
import AiAnalysisResult from '../components/ai-analysis/AiAnalysisResult';

export default function AiAnalysisResultPage() {
  const [searchParams] = useSearchParams();
  const experienceId = searchParams.get('experienceId');
  const numericExperienceId = experienceId ? Number(experienceId) : null;

  if (!experienceId || !Number.isFinite(numericExperienceId)) {
    return <Navigate to="/" replace />;
  }

  return <AiAnalysisResult experienceId={numericExperienceId} />;
}
