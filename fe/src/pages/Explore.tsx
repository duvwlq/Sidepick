import { useEffect, useState } from 'react';
import SearchBar from '../components/common/SearchBar';
import CardList from '../components/common/CardList';
import Layout from '../components/layout/Layout';
import { getExperiences, type Experience } from '../lib/api';

type SortKey = 'latest' | 'popular';

export default function Explore() {
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadExperiences(keyword, sort);
  }, [keyword, sort]);

  async function loadExperiences(searchKeyword: string, sortKey: SortKey) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 50,
        q: searchKeyword || undefined,
        sort: sortKey,
      });
      setExperiences(payload.experiences);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : '경험 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="탐색" leftType="menu" showRightIcon>
      <div className="space-y-4 pb-6">
        <div className="sticky top-16 z-10 space-y-3 bg-white px-4 pb-3 pt-4">
          <SearchBar
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <div className="flex gap-2">
            <SortButton
              active={sort === 'latest'}
              onClick={() => setSort('latest')}
              label="최신순"
            />
            <SortButton
              active={sort === 'popular'}
              onClick={() => setSort('popular')}
              label="인기순"
            />
          </div>
        </div>

        <CardList experiences={experiences} loading={loading} error={error} />
      </div>
    </Layout>
  );
}

function SortButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-[#111111] text-white' : 'bg-[#F3F4F6] text-[#555555]'
      }`}
    >
      {label}
    </button>
  );
}
