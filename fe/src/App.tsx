import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';

import Home from './pages/Home';
import Explore from './pages/Explore';
import Create from './pages/Create';
import MyPage from './pages/MyPage';

import AuthEntryPage from './pages/auth/AuthEntryPage';
import LoginPage from './pages/auth/LoginPage';
import SignupBasicPage from './pages/auth/SignupBasicPage';
import SignupVerifyPage from './pages/auth/SignupVerifyPage';
import SignupIdPage from './pages/auth/SignupIdPage';
import SignupPasswordPage from './pages/auth/SignupPasswordPage';
import SignupNicknamePage from './pages/auth/SignupNicknamePage';

import { SignupFlowProvider } from './context/SignupFlowContext';
import { AuthProvider } from './context/AuthContext';
import { seedDummyUser } from './utils/seedDummyUser';

function AppInitializer() {
  useEffect(() => {
    seedDummyUser();
  }, []);

  return null;
}

function AppRoutes() {
  const location = useLocation();

  const isAuthPage =
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup');

  if (isAuthPage) {
    return (
      <SignupFlowProvider>
        <Routes>
          <Route path="/auth" element={<AuthEntryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup/basic" element={<SignupBasicPage />} />
          <Route path="/signup/verify" element={<SignupVerifyPage />} />
          <Route path="/signup/id" element={<SignupIdPage />} />
          <Route path="/signup/password" element={<SignupPasswordPage />} />
          <Route path="/signup/nickname" element={<SignupNicknamePage />} />
        </Routes>
      </SignupFlowProvider>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<Create />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInitializer />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
