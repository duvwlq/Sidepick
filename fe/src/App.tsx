import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import FlashToastListener from './components/common/FlashToastListener';
import CreateWizardPage from './pages/CreateWizardPage';
import MyPage from './pages/MyPage';
import MyPageOverview from './pages/MyPageOverview';
import MyPageProfileEdit from './pages/MyPageProfileEdit';
import NotificationPage from './pages/NotificationPage';
import ExperienceDetail from './pages/ExperienceDetail';
import FaqPage from './pages/FaqPage';
import { AuthFlowProvider } from './context/AuthFlowContext';
import AuthEntryPage from './pages/auth/AuthEntryPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage';
import NaverCallbackPage from './pages/auth/NaverCallbackPage';
import SignupEmailPage from './pages/auth/SignupEmailPage';
import SignupIdentityPage from './pages/auth/SignupIdentityPage';
import SignupIdentityDetailsPage from './pages/auth/SignupIdentityDetailsPage';
import SignupUsernamePage from './pages/auth/SignupUsernamePage';
import SignupExperiencePage from './pages/auth/SignupExperiencePage';
import SignupNicknameStepPage from './pages/auth/SignupNicknameStepPage';
import SignupVerifyPage from './pages/auth/SignupVerifyPage';
import SignupPasswordPage from './pages/auth/SignupPasswordPage';
import SignupPurposePage from './pages/auth/SignupPurposePage';
import SignupRegionPage from './pages/auth/SignupRegionPage';
import HomeV2 from './pages/HomeV2';
import ExploreV3 from './pages/ExploreV3';
import SearchPage from './pages/SearchPage';
import SuccessComparisonPage from './pages/SuccessComparisonPage';
import ChatbotPage from './pages/ChatbotPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthFlowProvider>
        <FlashToastListener />
        <Routes>
          <Route path="/" element={<HomeV2 />} />
          <Route path="/v1/home" element={<Navigate to="/" replace />} />
          <Route path="/home-legacy" element={<Navigate to="/" replace />} />
          <Route path="/v1/explore" element={<Navigate to="/explore" replace />} />
          <Route path="/v3/explore" element={<Navigate to="/explore" replace />} />
          <Route path="/explore-figma" element={<Navigate to="/explore" replace />} />
          <Route path="/auth" element={<AuthEntryPage />} />
          <Route path="/login" element={<AuthEntryPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/auth/naver/callback" element={<NaverCallbackPage />} />
          <Route path="/signup/email" element={<SignupEmailPage />} />
          <Route path="/signup/identity" element={<SignupIdentityPage />} />
          <Route path="/signup/identity/details" element={<SignupIdentityDetailsPage />} />
          <Route path="/signup/username" element={<SignupUsernamePage />} />
          <Route path="/signup/verify" element={<SignupVerifyPage />} />
          <Route path="/signup/password" element={<SignupPasswordPage />} />
          <Route path="/signup/nickname" element={<SignupNicknameStepPage />} />
          <Route path="/signup/region" element={<SignupRegionPage />} />
          <Route path="/signup/employment" element={<SignupExperiencePage />} />
          <Route path="/signup/purpose" element={<SignupPurposePage />} />
          <Route path="/explore" element={<ExploreV3 />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/create" element={<CreateWizardPage />} />
          <Route path="/create-v2" element={<Navigate to="/create" replace />} />
          <Route path="/create-legacy" element={<Navigate to="/create" replace />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/experiences/:id/success-comparison" element={<SuccessComparisonPage />} />
          <Route path="/analysis-result" element={<Navigate to="/explore" replace />} />
          <Route path="/coming-soon" element={<Navigate to="/explore" replace />} />
          <Route path="/mypage" element={<MyPageOverview />} />
          <Route path="/mypage/profile/edit" element={<MyPageProfileEdit />} />
          <Route path="/mypage/written" element={<MyPage />} />
          <Route path="/mypage/bookmarks" element={<MyPage />} />
          <Route path="/mypage/recent" element={<MyPage />} />
          <Route path="/mypage/faq" element={<FaqPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthFlowProvider>
    </BrowserRouter>
  );
}
