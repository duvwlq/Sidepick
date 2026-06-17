import { useParams } from 'react-router-dom';
import DetailV1 from './DetailV1';

export default function ExperienceDetail() {
  const { id } = useParams();
  const numericExperienceId = id ? Number(id) : null;

  return <DetailV1 key={Number.isFinite(numericExperienceId) ? numericExperienceId : 'detail-v1'} />;
}
