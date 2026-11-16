import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useVault } from '../contexts/VaultContext';
import { loadReviewRecord, saveReviewRecord, type ReviewRecord } from '../lib/reviewStorage';
import { fetchManifest, loadPublishedEntry } from '../lib/manifestLoader';

export function ReviewDetail() {
  const { type, period } = useParams<{ type: string; period: string }>();
  const { isUnlocked, password } = useVault();
  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (isUnlocked && type && period && password) {
      loadRecord();
    } else {
      setLoading(false);
    }
  }, [isUnlocked, type, period, password]);

  const loadRecord = async () => {
    if (!password || !type || !period) return;
    const reviewType = type as 'weekly' | 'monthly' | 'yearly';

    try {
      const local = await loadReviewRecord(period, reviewType, password);
      if (local) {
        setRecord(local);
        setIsPublished(false);
        setLoading(false);
        return;
      }

      const manifest = await fetchManifest('/data');
      const metadata = manifest.entries.find(e => e.type === reviewType && e.date === period);
      
      if (metadata) {
        const published = await loadPublishedEntry(metadata, password, '/data');
        setRecord({
          id: published.id,
          period: published.date,
          type: reviewType,
          title: published.title,
          content: published.content,
          created: published.publishedAt,
          modified: published.publishedAt,
        });
        setIsPublished(true);
      } else {
        setRecord({
          id: `${reviewType}-${period}`,
          period,
          type: reviewType,
          title: '',
          content: '',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !password || isPublished) return;

    try {
      await saveReviewRecord(record, password);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  if (!isUnlocked) {
    return <div className="card"><p>请先解锁保险库</p></div>;
  }

  if (loading) {
    return <div className="card"><p>加载中...</p></div>;
  }

  if (!record) {
    return <div className="card"><p>记录不存在</p></div>;
  }

  const typeLabel = { weekly: '周总结', monthly: '月总结', yearly: '年终总结' }[record.type];

  return (
    <div className="review-detail">
      <header className="page-header">
        <Link to="#/reviews" className="back-button">
          <ArrowLeft size={20} />
        </Link>
        <h1>{typeLabel} - {period}</h1>
      </header>

      <form onSubmit={handleSave} className="card">
        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            type="text"
            value={record.title}
            onChange={(e) => setRecord({...record, title: e.target.value})}
            disabled={isPublished}
            placeholder={`${period} ${typeLabel}`}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">内容</label>
          <textarea
            id="content"
            value={record.content}
            onChange={(e) => setRecord({...record, content: e.target.value})}
            disabled={isPublished}
            rows={12}
            placeholder="记录这段时间的成长与反思..."
          />
        </div>

        {!isPublished && (
          <button type="submit" className="btn btn-primary">保存</button>
        )}

        {isPublished && (
          <div className="published-notice">此记录已发布，为只读状态</div>
        )}
      </form>

      <style>{`
        .back-button {
          padding: var(--spacing-sm);
          text-decoration: none;
          color: var(--color-text);
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--spacing-sm);
          font-weight: 600;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          font-family: inherit;
          font-size: var(--font-size-base);
        }

        .form-group textarea {
          resize: vertical;
        }

        .published-notice {
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: 4px;
          color: var(--color-text-secondary);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
