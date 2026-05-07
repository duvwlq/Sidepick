import { useParams } from 'react-router-dom';
import AiAnalysisResult from '../components/ai-analysis/AiAnalysisResult';

export default function ExperienceDetail() {
  const { id } = useParams();
  const numericExperienceId = id ? Number(id) : null;

  return <AiAnalysisResult experienceId={Number.isFinite(numericExperienceId) ? numericExperienceId : null} />;
}
