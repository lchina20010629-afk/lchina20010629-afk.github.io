import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Lock } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useVault } from '../contexts/VaultContext';
import { getAllReviews, getCurrentPeriods } from '../lib/reviewStorage';
import { fetchManifest } from '../lib/manifestLoader';

interface ReviewEntry {
  period: string;
  id: string;
  type: 'weekly' | 'monthly' | 'yearly';
  isPublished?: boolean;
}

export function Reviews() {
  const { isUnlocked } = useVault();
  const location = useLocation();
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUnlocked) {
      loadEntries();
    } else {
      setLoading(false);
    }
  }, [isUnlocked, location.pathname]);

  const loadEntries = async () => {
    try {
      const [weekly, monthly, yearly] = await Promise.all([
        getAllReviews('weekly'),
        getAllReviews('monthly'),
        getAllReviews('yearly'),
      ]);

      const localMap = new Map<string, boolean>();
      const all: ReviewEntry[] = [];

      for (const w of weekly) {
        all.push({ ...w, type: 'weekly' });
        localMap.set(`weekly-${w.period}`, true);
      }
      for (const m of monthly) {
        all.push({ ...m, type: 'monthly' });
        localMap.set(`monthly-${m.period}`, true);
      }
      for (const y of yearly) {
        all.push({ ...y, type: 'yearly' });
        localMap.set(`yearly-${y.period}`, true);
      }

      try {
        const manifest = await fetchManifest('/data');
        for (const meta of manifest.entries) {
          if (['weekly', 'monthly', 'yearly'].includes(meta.type)) {
            const key = `${meta.type}-${meta.date}`;
            if (!localMap.has(key)) {
              all.push({
                period: meta.date,
                id: meta.id,
                type: meta.type as 'weekly' | 'monthly' | 'yearly',
                isPublished: true,
              });
            }
          }
        }
      } catch {
        // No published
      }

      all.sort((a, b) => b.period.localeCompare(a.period));
      setEntries(all);
    } catch (err) {
      console.error('Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = {
    weekly: '周总结',
    monthly: '月总结',
    yearly: '年终总结',
  };

  if (!isUnlocked) {
    return (
      <div className="reviews">
        <header className="page-header">
          <h1>复盘反思</h1>
        </header>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Lock size={24} />
            <p>请先解锁保险库</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="card"><p>加载中...</p></div>;
  }

  const { weekly, monthly, yearly } = getCurrentPeriods();

  return (
    <div className="reviews">
      <header className="page-header">
        <h1>复盘反思</h1>
      </header>

      <div className="review-actions card">
        <h3>快速创建</h3>
        <div className="action-buttons">
          <Link to={`#/reviews/weekly/${weekly}`} className="btn">本周总结 ({weekly})</Link>
          <Link to={`#/reviews/monthly/${monthly}`} className="btn">本月总结 ({monthly})</Link>
          <Link to={`#/reviews/yearly/${yearly}`} className="btn">年终总结 ({yearly})</Link>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="暂无复盘记录"
          description="定期复盘是成长的关键"
          action={{
            label: '创建本周总结',
            onClick: () => window.location.hash = `#/reviews/weekly/${weekly}`
          }}
        />
      ) : (
        <div className="review-list">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              to={`#/reviews/${entry.type}/${entry.period}`}
              className="review-card card"
            >
              <div className="review-type">{typeLabel[entry.type]}</div>
              <div className="review-period">{entry.period}</div>
              {entry.isPublished && (
                <span className="published-badge">已发布</span>
              )}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .review-actions {
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .review-list {
          display: grid;
          gap: var(--spacing-md);
        }

        .review-card {
          padding: var(--spacing-lg);
          text-decoration: none;
          color: inherit;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all var(--transition-fast);
        }

        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .review-type {
          font-weight: 600;
          color: var(--color-primary);
        }

        .review-period {
          font-size: var(--font-size-lg);
        }

        .published-badge {
          font-size: var(--font-size-sm);
          color: var(--color-primary);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
