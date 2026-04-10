import Layout from '../components/layout/Layout';
import AiAnalysisResult from '../components/ai-analysis/AiAnalysisResult';

export default function AiAnalysisResultPage() {
  return (
    <Layout title="AI 분석 완료" leftType="back" showRightIcon={false}>
      <AiAnalysisResult />
    </Layout>
  );
}
