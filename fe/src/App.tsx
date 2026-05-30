import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FlashToastListener from './components/common/FlashToastListener';
import Home from './pages/Home';
import Explore from './pages/Explore';
import ComingSoonPage from './pages/ComingSoonPage';
import Create from './pages/Create';
import MyPage from './pages/MyPage';
import MyPageOverview from './pages/MyPageOverview';
import MyPageProfileEdit from './pages/MyPageProfileEdit';
import AiAnalysisResultPage from './pages/AiAnalysisResultPage';
import ExperienceDetail from './pages/ExperienceDetail';
import FaqPage from './pages/FaqPage';
import { AuthFlowProvider } from './context/AuthFlowContext';
import AuthEntryPage from './pages/auth/AuthEntryPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage';
import SignupEmailPage from './pages/auth/SignupEmailPage';
import SignupVerifyPage from './pages/auth/SignupVerifyPage';
import SignupPasswordPage from './pages/auth/SignupPasswordPage';
import SignupNicknamePage from './pages/auth/SignupNicknamePage';

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
          <Route path="/signup/email" element={<SignupEmailPage />} />
          <Route path="/signup/verify" element={<SignupVerifyPage />} />
          <Route path="/signup/password" element={<SignupPasswordPage />} />
          <Route path="/signup/nickname" element={<SignupNicknamePage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/create" element={<Create />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/analysis-result" element={<AiAnalysisResultPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/mypage" element={<MyPageOverview />} />
          <Route path="/mypage/profile/edit" element={<MyPageProfileEdit />} />
          <Route path="/mypage/written" element={<MyPage />} />
          <Route path="/mypage/bookmarks" element={<MyPage />} />
          <Route path="/mypage/recent" element={<MyPage />} />
          <Route path="/mypage/faq" element={<FaqPage />} />
        </Routes>
      </AuthFlowProvider>
    </BrowserRouter>
  );
}
