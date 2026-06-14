import { useParams } from 'react-router-dom';
import DetailV2 from './DetailV2';

export default function ExperienceDetail() {
  const { id } = useParams();
  const numericExperienceId = id ? Number(id) : null;

  return <DetailV2 key={Number.isFinite(numericExperienceId) ? numericExperienceId : 'detail-v2'} />;
}
