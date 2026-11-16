import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { loadDiaryEntry, deleteDiaryEntry, decryptImageToBlobUrl } from '../lib/diaryStorage';
import { revokeBlobUrl } from '../lib/imageProcessing';
import { fetchManifest, loadPublishedEntry } from '../lib/manifestLoader';
import type { DiaryEntry } from '../types/crypto';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export function DiaryDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { password, isUnlocked } = useVault();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [imageBlobUrls, setImageBlobUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  // const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!isUnlocked || !password || !date) {
      setLoading(false);
      return;
    }

    loadEntry();

    // Cleanup on unmount
    return () => {
      imageBlobUrls.forEach(url => revokeBlobUrl(url));
    };
  }, [date, isUnlocked, password]);

  // Revoke blob URLs when locked
  useEffect(() => {
    if (!isUnlocked) {
      imageBlobUrls.forEach(url => revokeBlobUrl(url));
      setImageBlobUrls(new Map());
      setEntry(null);
    }
  }, [isUnlocked]);

  const loadEntry = async () => {
    if (!password || !date) return;

    try {
      // Try loading from local storage first
      try {
        const loaded = await loadDiaryEntry(date, password);
        if (loaded) {
          setEntry(loaded);
          // setIsPublished(false);
          
          // Decrypt images
          if (loaded.images && loaded.images.length > 0) {
            const urls = new Map<string, string>();
            for (const img of loaded.images) {
              if (img.encryptedPath) {
                try {
                  const blobUrl = await decryptImageToBlobUrl(img.encryptedPath, password);
                  urls.set(img.id, blobUrl);
                } catch (err) {
                  console.error('Failed to decrypt image:', err);
                }
              }
            }
            setImageBlobUrls(urls);
          }
          setLoading(false);
          return;
        }
      } catch (localErr) {
        // Not in local storage, try published
        console.log('Not in local storage, trying published manifest...');
      }

      // Try loading from published manifest
      const manifest = await fetchManifest('/data');
      const metadata = manifest.entries.find(e => e.type === 'diary' && e.date === date);
      
      if (!metadata) {
        setError('日记不存在');
        setLoading(false);
        return;
      }

      const published = await loadPublishedEntry(metadata, password, '/data');
      
      // Convert to DiaryEntry format
      setEntry({
        id: published.id,
        date: published.date,
        title: published.title,
        content: published.content,
        mood: published.mood,
        weather: published.weather,
        tags: published.tags,
        images: published.images?.map(img => ({
          id: img.id,
          encryptedPath: img.blobUrl, // Use blobUrl for display
        })),
        created: published.publishedAt,
        modified: published.publishedAt,
      });
      // setIsPublished(true);
      
      // Blob URLs already created by loadPublishedEntry
      if (published.images) {
        const urls = new Map<string, string>();
        for (const img of published.images) {
          urls.set(img.id, img.blobUrl);
        }
        setImageBlobUrls(urls);
      }
    } catch (err) {
      setError('加载失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!date || !confirm('确定要删除这篇日记吗？此操作无法撤销。')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDiaryEntry(date);
      // Revoke blob URLs
      imageBlobUrls.forEach(url => revokeBlobUrl(url));
      navigate('/diary');
    } catch (err) {
      setError('删除失败: ' + (err as Error).message);
      setDeleting(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="card">
        <p>请先解锁保险库才能查看日记</p>
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

  if (!entry) {
    return (
      <div className="card">
        <p>日记不存在</p>
        <button onClick={() => navigate('/diary')} className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="diary-detail">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button onClick={() => navigate('/diary')} className="btn btn-ghost">
          <ArrowLeft size={20} />
          返回
        </button>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={() => navigate(`/diary/${date}/edit`)} className="btn btn-secondary">
            <Edit size={20} />
            编辑
          </button>
          <button onClick={handleDelete} className="btn btn-secondary" disabled={deleting} style={{ color: 'var(--color-error)' }}>
            <Trash2 size={20} />
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </header>

      <div className="card">
        <div className="diary-meta">
          <span className="diary-date">{entry.date}</span>
          {entry.mood && <span className="diary-mood">心情: {entry.mood}</span>}
          {entry.weather && <span className="diary-weather">天气: {entry.weather}</span>}
        </div>

        <h1 className="diary-title">{entry.title}</h1>

        <div className="diary-content">
          {entry.content.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>

        {entry.tags && entry.tags.length > 0 && (
          <div className="diary-tags">
            {entry.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {entry.images && entry.images.length > 0 && (
          <div className="diary-images">
            <h3>照片</h3>
            <div className="image-grid">
              {entry.images.map(img => {
                const blobUrl = imageBlobUrls.get(img.id);
                return (
                  <div key={img.id} className="image-item">
                    {blobUrl ? (
                      <img src={blobUrl} alt={img.caption || ''} />
                    ) : (
                      <div className="image-placeholder">加载中...</div>
                    )}
                    {img.caption && <p className="image-caption">{img.caption}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginTop: 'var(--spacing-lg)' }}>
            {error}
          </div>
        )}
      </div>

      <div className="info-box" style={{ marginTop: 'var(--spacing-lg)' }}>
        <p className="text-small text-muted">
          📝 创建于: {new Date(entry.created).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}
          {entry.modified !== entry.created && (
            <> | 修改于: {new Date(entry.modified).toLocaleString('zh-CN', { timeZone: 'Asia/Kuala_Lumpur' })}</>
          )}
        </p>
      </div>

      <style>{`
        .diary-meta {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .diary-date {
          font-weight: 600;
          color: var(--color-accent);
        }

        .diary-title {
          font-size: var(--font-size-2xl);
          margin-bottom: var(--spacing-lg);
        }

        .diary-content {
          margin-bottom: var(--spacing-xl);
          line-height: 1.8;
        }

        .diary-content p {
          margin-bottom: var(--spacing-md);
        }

        .diary-tags {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
          margin-bottom: var(--spacing-xl);
        }

        .tag {
          padding: var(--spacing-xs) var(--spacing-md);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
        }

        .diary-images {
          margin-top: var(--spacing-xl);
        }

        .diary-images h3 {
          margin-bottom: var(--spacing-md);
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .image-item {
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--color-bg-secondary);
        }

        .image-item img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-secondary);
          color: var(--color-text-secondary);
        }

        .image-caption {
          padding: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
}
