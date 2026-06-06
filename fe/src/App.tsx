import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import FlashToastListener from './components/common/FlashToastListener';
import ComingSoonPage from './pages/ComingSoonPage';
import Create from './pages/Create';
import CreateWizardPage from './pages/CreateWizardPage';
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
import NaverCallbackPage from './pages/auth/NaverCallbackPage';
import SignupEmailPage from './pages/auth/SignupEmailPage';
import SignupExperiencePage from './pages/auth/SignupExperiencePage';
import SignupNicknameStepPage from './pages/auth/SignupNicknameStepPage';
import SignupVerifyPage from './pages/auth/SignupVerifyPage';
import SignupPasswordPage from './pages/auth/SignupPasswordPage';
import SignupPurposePage from './pages/auth/SignupPurposePage';
import SignupRegionPage from './pages/auth/SignupRegionPage';
import HomeV1 from './pages/HomeV1';
import ExploreV1 from './pages/ExploreV1';
import ExploreFigmaMainPage from './pages/ExploreFigmaMainPage';
import SearchPage from './pages/SearchPage';
import SuccessComparisonPage from './pages/SuccessComparisonPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthFlowProvider>
        <FlashToastListener />
        <Routes>
          <Route path="/" element={<HomeV1 />} />
          <Route path="/v1/home" element={<HomeV1 />} />
          <Route path="/v1/explore" element={<ExploreV1 />} />
          <Route path="/explore-figma" element={<ExploreFigmaMainPage />} />
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
          <Route path="/explore" element={<ExploreV1 />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/create" element={<CreateWizardPage />} />
          <Route path="/create-v2" element={<Navigate to="/create" replace />} />
          <Route path="/create-legacy" element={<Create />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/experiences/:id/success-comparison" element={<SuccessComparisonPage />} />
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
