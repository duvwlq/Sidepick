import type { Experience } from '../../lib/api';
import ExperienceFeed from '../home/ExperienceFeed';

type Props = {
  experiences: Experience[];
  loading: boolean;
  error: string;
};

export default function CardList({ experiences, loading, error }: Props) {
  return (
    <ExperienceFeed experiences={experiences} loading={loading} error={error} />
  );
}
