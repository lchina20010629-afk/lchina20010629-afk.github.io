import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { VaultProvider } from './contexts/VaultContext';
import { Layout } from './components/Layout';
import { PWAPrompt } from './components/PWAPrompt';
import { UpdateNotification } from './components/UpdateNotification';
import { Dashboard } from './pages/Dashboard';
import { Diary } from './pages/Diary';
import { DiaryCreate } from './pages/DiaryCreate';
import { DiaryDetail } from './pages/DiaryDetail';
import { DiaryEdit } from './pages/DiaryEdit';
import { Learning } from './pages/Learning';
import { CourseDetail } from './pages/CourseDetail';
import { Reviews } from './pages/Reviews';
import { ReviewDetail } from './pages/ReviewDetail';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <ThemeProvider>
      <VaultProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/diary/create" element={<DiaryCreate />} />
              <Route path="/diary/:date" element={<DiaryDetail />} />
              <Route path="/diary/:date/edit" element={<DiaryEdit />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:date" element={<CourseDetail />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/reviews/:type/:period" element={<ReviewDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          <PWAPrompt />
          <UpdateNotification />
        </HashRouter>
      </VaultProvider>
    </ThemeProvider>
  );
}
