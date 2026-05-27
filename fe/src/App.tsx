import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FlashToastListener from './components/common/FlashToastListener';
import Home from './pages/HomeV3';
import Explore from './pages/ExploreV3';
import Create from './pages/Create';
import MyPage from './pages/MyPage';
import AiAnalysisResultPage from './pages/AiAnalysisResultPage';
import ExperienceDetail from './pages/ExperienceDetail';
import FaqPage from './pages/FaqPage';
import { AuthFlowProvider } from './context/AuthFlowContext';
import AuthEntryPage from './pages/auth/AuthEntryPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage';
import NaverCallbackPage from './pages/auth/NaverCallbackPage';
import SignupEmailPage from './pages/auth/SignupEmailPage';
import SignupExperiencePage from './pages/auth/SignupExperiencePage';
import SignupNicknameStepPage from './pages/auth/SignupNicknameStepPage';
import SignupVerifyPage from './pages/auth/SignupVerifyPage';
import SignupPasswordPage from './pages/auth/SignupPasswordPage';
import SignupPurposePage from './pages/auth/SignupPurposePage';
import SignupRegionPage from './pages/auth/SignupRegionPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthFlowProvider>
        <FlashToastListener />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthEntryPage />} />
          <Route path="/login" element={<AuthEntryPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/auth/naver/callback" element={<NaverCallbackPage />} />
          <Route path="/signup/email" element={<SignupEmailPage />} />
          <Route path="/signup/verify" element={<SignupVerifyPage />} />
          <Route path="/signup/password" element={<SignupPasswordPage />} />
          <Route path="/signup/nickname" element={<SignupNicknameStepPage />} />
          <Route path="/signup/region" element={<SignupRegionPage />} />
          <Route path="/signup/employment" element={<SignupExperiencePage />} />
          <Route path="/signup/purpose" element={<SignupPurposePage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/create" element={<Create />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/analysis-result" element={<AiAnalysisResultPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/faq" element={<FaqPage />} />
        </Routes>
      </AuthFlowProvider>
    </BrowserRouter>
  );
}
