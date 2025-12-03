import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { subscribeUnauthorized } from './state/authStore.js';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import BoardPage from './pages/BoardPage.jsx';
import PostCreatePage from './pages/PostCreatePage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';
import PostEditPage from './pages/PostEditPage.jsx';
import ProfileEditPage from './pages/ProfileEditPage.jsx';
import PasswordChangePage from './pages/PasswordChangePage.jsx';
import MyPage from './pages/MyPage.jsx';

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { isAuthed } = useAuth();
  if (isAuthed) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function AppRoutes() {
  const { logout, isAuthed } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeUnauthorized(async () => {
      window.alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      await logout({ skipRequest: true });
      navigate('/login', { replace: true });
    });
    return unsubscribe;
  }, [logout, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignupPage />
            </PublicOnly>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/board"
          element={
            <RequireAuth>
              <BoardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/compose"
          element={
            <RequireAuth>
              <PostCreatePage />
            </RequireAuth>
          }
        />
        <Route
          path="/edit/:articleId"
          element={
            <RequireAuth>
              <PostEditPage />
            </RequireAuth>
          }
        />
        <Route
          path="/post/:articleId"
          element={
            <RequireAuth>
              <PostDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          }
        />
        <Route
          path="/password"
          element={
            <RequireAuth>
              <PasswordChangePage />
            </RequireAuth>
          }
        />
        <Route
          path="/mypage"
          element={
            <RequireAuth>
              <MyPage />
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to={isAuthed ? '/home' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={isAuthed ? '/home' : '/login'} replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
