import { TrendingUp } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export function Reviews() {
  return (
    <div className="reviews">
      <header className="page-header">
        <h1>总结回顾</h1>
        <p className="text-muted">回顾过去，展望未来</p>
      </header>

      <div className="reviews-tabs card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="tabs">
          <button className="tab active">周总结</button>
          <button className="tab">月总结</button>
          <button className="tab">年终总结</button>
        </div>
      </div>

      <EmptyState
        icon={TrendingUp}
        title="暂无总结"
        description="定期回顾总结能帮助您更好地成长。每周日、每月末和年终都是总结的好时机。"
      />

      <style>{`
        .tabs {
          display: flex;
          gap: var(--spacing-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .tab {
          padding: var(--spacing-md) var(--spacing-lg);
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
        }

        .tab:hover {
          color: var(--color-text-primary);
          background-color: var(--color-bg-secondary);
        }

        .tab.active {
          color: var(--color-accent);
          border-bottom-color: var(--color-accent);
        }
      `}</style>
    </div>
  );
}
