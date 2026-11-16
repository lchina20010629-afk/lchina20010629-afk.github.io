import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { loadDiaryEntry, saveDiaryEntry } from '../lib/diaryStorage';
import type { DiaryEntry } from '../types/crypto';
import { Save, X } from 'lucide-react';

export function DiaryEdit() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { password, isUnlocked } = useVault();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!isUnlocked || !password || !date) {
      setLoading(false);
      return;
    }

    loadEntry();
  }, [date, isUnlocked, password]);

  const loadEntry = async () => {
    if (!password || !date) return;

    try {
      const entry = await loadDiaryEntry(date, password);
      if (entry) {
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood || '');
        setWeather(entry.weather || '');
        setTags(entry.tags?.join(', ') || '');
      }
    } catch (err) {
      setError('加载失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!password || !date || !title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const existingEntry = await loadDiaryEntry(date, password);
      
      const entry: DiaryEntry = {
        id: existingEntry?.id || `diary-${date}`,
        date,
        title: title.trim(),
        content: content.trim(),
        mood: mood.trim() || undefined,
        weather: weather.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        images: existingEntry?.images || [],
        created: existingEntry?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      await saveDiaryEntry(entry, password);
      navigate(`/diary/${date}`);
    } catch (err) {
      setError('保存失败: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="card">
        <p>请先解锁保险库才能编辑日记</p>
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
    <div className="diary-edit">
      <header className="page-header">
        <h1>编辑日记</h1>
        <button onClick={() => navigate(`/diary/${date}`)} className="btn btn-ghost">
          <X size={20} />
          取消
        </button>
      </header>

      <div className="card">
        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">内容</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            style={{ width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="mood">心情</label>
            <input
              id="mood"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="weather">天气</label>
            <input
              id="weather"
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">标签</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="用逗号分隔"
            style={{ width: '100%' }}
          />
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button onClick={() => navigate(`/diary/${date}`)} className="btn btn-secondary" disabled={saving}>
            取消
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            <Save size={20} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <style>{`
        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: var(--spacing-sm);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
          margin-top: var(--spacing-xl);
        }

        .alert {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
        }

        .alert-error {
          background-color: rgba(214, 69, 69, 0.1);
          border: 1px solid var(--color-error);
          color: var(--color-error);
        }
      `}</style>
    </div>
  );
}
