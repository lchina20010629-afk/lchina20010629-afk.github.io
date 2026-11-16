import { Link } from 'react-router-dom';
import { Calendar, BookOpen, TrendingUp, Lock } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { formatDate, getCurrentDate, getRelativeDateDescription } from '../lib/dateHelpers';

export function Dashboard() {
  const today = getCurrentDate();
  const todayStr = formatDate(today);
  const relativeDate = getRelativeDateDescription(today);

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1>今日总览</h1>
          <p className="text-muted">{todayStr} • {relativeDate}</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-icon" style={{ backgroundColor: 'rgba(127, 176, 105, 0.1)', color: 'var(--color-accent)' }}>
            <Calendar size={24} />
          </div>
          <h3>生活日记</h3>
          <p className="text-muted">记录今天的点滴</p>
          <Link to="/diary" className="btn btn-primary" style={{ marginTop: 'auto' }}>
            查看日记
          </Link>
        </div>

        <div className="card dashboard-card">
          <div className="card-icon" style={{ backgroundColor: 'rgba(74, 144, 226, 0.1)', color: 'var(--color-info)' }}>
            <BookOpen size={24} />
          </div>
          <h3>成长学习</h3>
          <p className="text-muted">今日学习进度</p>
          <Link to="/learning" className="btn btn-primary" style={{ marginTop: 'auto' }}>
            查看学习
          </Link>
        </div>

        <div className="card dashboard-card">
          <div className="card-icon" style={{ backgroundColor: 'rgba(232, 168, 56, 0.1)', color: 'var(--color-warning)' }}>
            <TrendingUp size={24} />
          </div>
          <h3>总结回顾</h3>
          <p className="text-muted">周/月/年度回顾</p>
          <Link to="/reviews" className="btn btn-primary" style={{ marginTop: 'auto' }}>
            查看总结
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
        <EmptyState
          icon={Lock}
          title="暂无数据"
          description="这是一个静态网站，所有数据均保存在浏览器本地。请先在设置中初始化保险库并设置密码，然后开始记录您的生活和学习历程。"
          action={{
            label: '前往设置',
            onClick: () => window.location.href = '/settings'
          }}
        />
      </div>

      <div className="info-box" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h4>📅 外部自动化流程说明</h4>
        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>
          您的日常流程由 Grok Bot 在外部自动运行（非本网站）：
        </p>
        <ul style={{ marginTop: 'var(--spacing-md)', paddingLeft: 'var(--spacing-xl)' }}>
          <li>每天 10:30 - 课程准备</li>
          <li>每天 23:30 - 日记整理润色</li>
          <li>每周日 - 周总结</li>
          <li>每月最后一天 - 月总结</li>
          <li>12月31日 - 年终总结</li>
        </ul>
        <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-md)' }}>
          ⚠️ 本网站是静态站点，托管在 GitHub Pages，没有服务器端功能，不会自动同步或运行任何自动化流程。所有数据仅保存在您当前浏览器中。
        </p>
      </div>

      <style>{`
        .page-header {
          margin-bottom: var(--spacing-2xl);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }

        .dashboard-card {
          display: flex;
          flex-direction: column;
          padding: var(--spacing-xl);
        }

        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-md);
        }

        .dashboard-card h3 {
          font-size: var(--font-size-lg);
          margin-bottom: var(--spacing-sm);
        }

        .dashboard-card p {
          margin-bottom: var(--spacing-lg);
        }

        .info-box {
          background-color: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
        }

        .info-box h4 {
          margin-bottom: var(--spacing-md);
        }

        .info-box ul {
          list-style: disc;
          color: var(--color-text-secondary);
        }

        .info-box li {
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }
      `}</style>
    </div>
  );
}
