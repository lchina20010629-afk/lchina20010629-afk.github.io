import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Plus, Lock, Cloud } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useVault } from '../contexts/VaultContext';
import { getAllDiaryEntries } from '../lib/diaryStorage';
import { fetchManifest } from '../lib/manifestLoader';

interface DiaryEntry {
  date: string;
  id: string;
  isPublished?: boolean;
}

export function Diary() {
  const { isUnlocked } = useVault();
  const location = useLocation();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUnlocked) {
      loadEntries();
    } else {
      setLoading(false);
    }
  }, [isUnlocked, location.pathname]); // Reload when navigating to this page

  const loadEntries = async () => {
    try {
      // Load local drafts
      const localEntries = await getAllDiaryEntries();
      const localSet = new Set(localEntries.map(e => e.date));
      
      // Load published entries
      const publishedEntries: DiaryEntry[] = [];
      try {
        const manifest = await fetchManifest('/data');
        const diaryMeta = manifest.entries.filter(e => e.type === 'diary');
        for (const meta of diaryMeta) {
          // Only add published entries that don't have local drafts
          if (!localSet.has(meta.date)) {
            publishedEntries.push({
              date: meta.date,
              id: meta.id,
              isPublished: true,
            });
          }
        }
      } catch (err) {
        // No published content or error loading
        console.log('No published diary entries or error loading:', err);
      }
      
      // Merge and sort
      const allEntries = [
        ...localEntries.map(e => ({ ...e, isPublished: false })),
        ...publishedEntries,
      ].sort((a, b) => b.date.localeCompare(a.date));
      
      setEntries(allEntries);
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
              <div className="diary-date-row">
                <span className="diary-date">{entry.date}</span>
                {entry.isPublished && (
                  <span className="published-badge" title="已发布的公开日记">
                    <Cloud size={14} />
                  </span>
                )}
              </div>
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

        .diary-date-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .published-badge {
          display: inline-flex;
          align-items: center;
          color: var(--color-primary);
          opacity: 0.7;
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
