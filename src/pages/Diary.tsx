import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Lock } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useVault } from '../contexts/VaultContext';
import { getAllDiaryEntries } from '../lib/diaryStorage';

export function Diary() {
  const { isUnlocked } = useVault();
  const [entries, setEntries] = useState<Array<{ date: string; id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUnlocked) {
      loadEntries();
    } else {
      setLoading(false);
    }
  }, [isUnlocked]);

  const loadEntries = async () => {
    try {
      const allEntries = await getAllDiaryEntries();
      setEntries(allEntries.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="diary">
        <header className="page-header">
          <h1>生活日记</h1>
          <p className="text-muted">记录每一天的点滴瞬间</p>
        </header>

        <EmptyState
          icon={Lock}
          title="保险库已锁定"
          description="请先解锁保险库才能查看和创建日记"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="diary">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>生活日记</h1>
          <p className="text-muted">记录每一天的点滴瞬间</p>
        </div>
        <Link to="/diary/create" className="btn btn-primary">
          <Plus size={20} />
          创建日记
        </Link>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="暂无日记"
          description="开始记录您的生活吧！每一天的故事都值得被珍藏。"
          action={{
            label: '创建第一篇日记',
            onClick: () => window.location.href = '/diary/create'
          }}
        />
      ) : (
        <div className="diary-list">
          {entries.map((entry) => (
            <Link key={entry.id} to={`/diary/${entry.date}`} className="diary-card card">
              <div className="diary-date">{entry.date}</div>
              <div className="text-muted text-small">点击查看详情</div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .diary-list {
          display: grid;
          gap: var(--spacing-md);
        }

        .diary-card {
          padding: var(--spacing-lg);
          text-decoration: none;
          color: inherit;
          transition: all var(--transition-fast);
        }

        .diary-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .diary-date {
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }
      `}</style>
    </div>
  );
}
