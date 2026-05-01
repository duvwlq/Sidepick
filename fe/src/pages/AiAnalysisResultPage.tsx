import { Navigate, useSearchParams } from 'react-router-dom';

export default function AiAnalysisResultPage() {
  const [searchParams] = useSearchParams();
  const experienceId = searchParams.get('experienceId');

  if (!experienceId) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/experiences/${experienceId}`} replace />;
}
