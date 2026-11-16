import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { VaultProvider } from './contexts/VaultContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Diary } from './pages/Diary';
import { DiaryCreate } from './pages/DiaryCreate';
import { Learning } from './pages/Learning';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <ThemeProvider>
      <VaultProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/diary/create" element={<DiaryCreate />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </VaultProvider>
    </ThemeProvider>
  );
}
