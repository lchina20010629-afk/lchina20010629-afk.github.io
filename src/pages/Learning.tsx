import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Plus, Lock, Calendar } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useVault } from '../contexts/VaultContext';
import { getAllCourseRecords } from '../lib/courseStorage';
import { fetchManifest } from '../lib/manifestLoader';
import { COURSE_COLUMNS } from '../lib/courseStorage';

interface CourseEntry {
  date: string;
  id: string;
  isPublished?: boolean;
}

export function Learning() {
  const { isUnlocked } = useVault();
  const location = useLocation();
  const [entries, setEntries] = useState<CourseEntry[]>([]);
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
      // Load local records
      const local = await getAllCourseRecords();
      const localSet = new Set(local.map(e => e.date));
      
      // Load published
      const published: CourseEntry[] = [];
      try {
        const manifest = await fetchManifest('/data');
        const courseMeta = manifest.entries.filter(e => e.type === 'course');
        for (const meta of courseMeta) {
          if (!localSet.has(meta.date)) {
            published.push({
              date: meta.date,
              id: meta.id,
              isPublished: true,
            });
          }
        }
      } catch {
        // No published content
      }
      
      // Merge and sort
      const all = [
        ...local.map(e => ({ ...e, isPublished: false })),
        ...published,
      ].sort((a, b) => b.date.localeCompare(a.date));
      
      setEntries(all);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (!isUnlocked) {
    return (
      <div className="learning">
        <header className="page-header">
          <h1>成长学习</h1>
        </header>
        <UnlockPrompt 
          message="请先解锁保险库才能查看学习记录和今日课程"
          returnPath="/learning"
        />
      </div>
    );
  }

  if (loading) {
    return <div className="card"><p>加载中...</p></div>;
  }

  return (
    <div className="learning">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>成长学习</h1>
          <Link to={`#/learning/${getTodayDate()}`} className="btn btn-primary">
            <Plus size={20} />
            今日学习
          </Link>
        </div>
      </header>

      <div className="learning-info card">
        <h3>四列学习法</h3>
        <div className="columns-info">
          {COURSE_COLUMNS.map(col => (
            <div key={col.name} className="column-info">
              <strong>{col.label}</strong>
              <span>{col.targetMinutes}分钟</span>
            </div>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="暂无学习记录"
          description="开始记录您的每日学习进度"
          action={{
            label: '创建今日记录',
            onClick: () => window.location.hash = `#/learning/${getTodayDate()}`
          }}
        />
      ) : (
        <div className="learning-list">
          {entries.map((entry) => (
            <Link key={entry.id} to={`#/learning/${entry.date}`} className="learning-card card">
              <div className="learning-date">
                <Calendar size={20} />
                {entry.date}
              </div>
              {entry.isPublished && (
                <span className="published-badge">已发布</span>
              )}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .learning-info {
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .columns-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .column-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: 4px;
        }

        .column-info strong {
          color: var(--color-primary);
        }

        .learning-list {
          display: grid;
          gap: var(--spacing-md);
        }

        .learning-card {
          padding: var(--spacing-lg);
          text-decoration: none;
          color: inherit;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all var(--transition-fast);
        }

        .learning-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .learning-date {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 600;
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
