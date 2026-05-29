import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Create from './pages/Create';
import MyPage from './pages/MyPage';
import AiAnalysisResultPage from './pages/AiAnalysisResultPage';
import SuccessComparisonPage from './pages/SuccessComparisonPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<Create />} />
        <Route path="/analysis-result" element={<AiAnalysisResultPage />} />
        <Route path="/mypage" element={<MyPage />} />
        {/* PM-10: 실패→성공 연결 버튼 → 좌우 분할 화면 (placeholder, W3 구현 예정) */}
        <Route
          path="/experiences/:id/success-comparison"
          element={<SuccessComparisonPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
