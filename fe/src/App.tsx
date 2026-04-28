import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Create from './pages/Create';
import MyPage from './pages/MyPage';
import AiAnalysisResultPage from './pages/AiAnalysisResultPage';
import ExperienceDetail from './pages/ExperienceDetail';
import { AuthFlowProvider } from './context/AuthFlowContext';
import AuthEntryPage from './pages/auth/AuthEntryPage';
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage';
import SignupEmailPage from './pages/auth/SignupEmailPage';
import SignupVerifyPage from './pages/auth/SignupVerifyPage';
import SignupPasswordPage from './pages/auth/SignupPasswordPage';
import SignupNicknamePage from './pages/auth/SignupNicknamePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthFlowProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthEntryPage />} />
          <Route path="/login" element={<AuthEntryPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/signup/email" element={<SignupEmailPage />} />
          <Route path="/signup/verify" element={<SignupVerifyPage />} />
          <Route path="/signup/password" element={<SignupPasswordPage />} />
          <Route path="/signup/nickname" element={<SignupNicknamePage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<Create />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/analysis-result" element={<AiAnalysisResultPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Routes>
      </AuthFlowProvider>
    </BrowserRouter>
  );
}
