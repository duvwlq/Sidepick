/**
 * SuccessComparisonPage — 실패↔성공 좌우 분할 화면 (placeholder)
 *
 * PM-10에서 라우팅 타겟으로 신설. 실제 좌우 분할 UI는 W3에서 PD 디자인 받은 후 구현.
 *
 * Route: /experiences/:id/success-comparison
 * 진입: AiAnalysisResult 페이지의 FailureToSuccessButton 클릭
 *
 * 작성: 팀장 (오혜림) — 2026-05-29
 */

import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

export default function SuccessComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <Layout title="비슷한 성공 사례" leftType="back" showRightIcon={false}>
      <div className="bg-[#F3F3F3] px-4 py-6 min-h-[60vh]">
        <div className="rounded-2xl bg-white p-6 text-center">
          <h1 className="text-base font-bold text-black mb-2">
            🚧 좌우 분할 화면 — W3 구현 예정
          </h1>
          <p className="text-xs text-[#7A7A7A] leading-5">
            PD 디자인 완성 후 W3 (6/1~)에 좌우 분할 UI 구현 예정입니다.
            <br />
            좌측: 사용자 실패 사례 / 우측: 매칭된 성공 사례
          </p>

          <div className="mt-6 p-4 rounded-lg bg-[#F5F5F5] text-left">
            <p className="text-xs text-[#8A8A8A]">
              <strong>case_id:</strong> {id ?? '(없음)'}
            </p>
            <p className="text-xs text-[#8A8A8A] mt-1">
              <strong>라우트:</strong> /experiences/:id/success-comparison
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-6 w-full h-10 px-5 bg-black rounded-[999px] text-white text-xs font-bold"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    </Layout>
  );
}
