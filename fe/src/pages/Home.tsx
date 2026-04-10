import SearchBar from '../components/common/SearchBar';
import CardList from '../components/common/CardList';
import Layout from '../components/layout/Layout';

export default function Home() {
  return (
    <Layout title="사이드픽" leftType="menu" showRightIcon>
      <div className="space-y-4">
        <div className="sticky top-16 z-10 bg-white px-4 pb-3 gap-2.5">
          <SearchBar />
        </div>
        <CardList />
      </div>
    </Layout>
  );
}
