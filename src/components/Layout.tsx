import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, TrendingUp, BookOpen, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const navigation = [
    { name: '今日总览', path: '/', icon: Home },
    { name: '生活日记', path: '/diary', icon: Calendar },
    { name: '成长学习', path: '/learning', icon: BookOpen },
    { name: '总结回顾', path: '/reviews', icon: TrendingUp },
    { name: '设置', path: '/settings', icon: Settings },
  ];

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div className="layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">个人成长</h1>
          <p className="sidebar-subtitle">生活 • 学习 • 成长</p>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={cycleTheme}
            className="theme-toggle"
            aria-label={`当前主题: ${theme === 'system' ? '跟随系统' : theme === 'light' ? '浅色' : '深色'}`}
            title="切换主题"
          >
            <ThemeIcon size={20} />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span className="mobile-nav-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
        }

        /* Desktop Sidebar */
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 260px;
          height: 100vh;
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          padding: var(--spacing-xl) 0;
          z-index: 100;
        }

        .sidebar-header {
          padding: 0 var(--spacing-xl);
          margin-bottom: var(--spacing-2xl);
        }

        .sidebar-title {
          font-size: var(--font-size-2xl);
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
          background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: 0;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-xl);
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
        }

        .nav-item.active {
          color: var(--color-accent);
          background-color: rgba(127, 176, 105, 0.1);
          border-left-color: var(--color-accent);
          font-weight: 500;
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding: 0 var(--spacing-xl);
          border-top: 1px solid var(--color-border);
          padding-top: var(--spacing-lg);
        }

        .theme-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-md);
          color: var(--color-text-secondary);
          background-color: var(--color-bg-primary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .theme-toggle:hover {
          color: var(--color-accent);
          background-color: var(--color-bg-secondary);
        }

        /* Mobile Bottom Nav */
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border);
          padding: var(--spacing-sm) 0;
          z-index: 100;
          box-shadow: var(--shadow-lg);
        }

        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .mobile-nav-item.active {
          color: var(--color-accent);
          font-weight: 500;
        }

        .mobile-nav-label {
          font-size: 0.7rem;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: var(--spacing-2xl);
          max-width: 1400px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }

          .mobile-nav {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
          }

          .main-content {
            margin-left: 0;
            margin-bottom: 70px;
            padding: var(--spacing-lg);
          }
        }
      `}</style>
    </div>
  );
}
