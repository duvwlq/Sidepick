import { Navigate, useParams } from 'react-router-dom';

export default function ExperienceDetail() {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/analysis-result?experienceId=${id}`} replace />;
}
