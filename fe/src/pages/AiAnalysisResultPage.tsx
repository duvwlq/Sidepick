import { useSearchParams } from 'react-router-dom';
import AiAnalysisResult from '../components/ai-analysis/AiAnalysisResult';
import Layout from '../components/layout/Layout';

export default function AiAnalysisResultPage() {
  const [searchParams] = useSearchParams();
  const experienceId = Number(searchParams.get('experienceId'));

  return (
    <Layout title="AI 분석 결과" leftType="back" showRightIcon={false}>
      <AiAnalysisResult
        experienceId={Number.isFinite(experienceId) ? experienceId : null}
      />
    </Layout>
  );
}
