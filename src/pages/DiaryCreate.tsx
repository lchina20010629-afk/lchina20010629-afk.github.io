import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '../contexts/VaultContext';
import { saveDiaryEntry, processAndEncryptImage } from '../lib/diaryStorage';
import { formatDate, getCurrentDate } from '../lib/dateHelpers';
import type { DiaryEntry, ImageAttachment } from '../types/crypto';
import { Camera, Save, X } from 'lucide-react';

export function DiaryCreate() {
  const navigate = useNavigate();
  const { password, isUnlocked } = useVault();
  const [date, setDate] = useState(formatDate(getCurrentDate()));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isUnlocked || !password) {
    return (
      <div className="card">
        <p>请先解锁保险库才能创建日记</p>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const newImages: ImageAttachment[] = [];
      
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Process and encrypt
        const encrypted = await processAndEncryptImage(file, password);
        
        // Create blob for preview
        const blob = new Blob([file], { type: file.type });
        
        newImages.push({
          id: encrypted.id,
          encryptedPath: encrypted.encryptedData,
          caption: '',
          blob,
        });
      }

      setImages([...images, ...newImages]);
    } catch (err) {
      setError('图片上传失败: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const entry: DiaryEntry = {
        id: `diary-${date}`,
        date,
        title: title.trim(),
        content: content.trim(),
        mood: mood.trim() || undefined,
        weather: weather.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        images,
        created: new Date().toISOString(),
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

  return (
    <div className="diary-create">
      <header className="page-header">
        <h1>创建日记</h1>
        <button onClick={() => navigate('/diary')} className="btn btn-ghost">
          <X size={20} />
          取消
        </button>
      </header>

      <div className="card">
        <div className="form-group">
          <label htmlFor="date">日期</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">标题</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="今天发生了什么..."
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">内容</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录今天的点滴..."
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
              placeholder="开心、平静、疲惫..."
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
              placeholder="晴、雨、多云..."
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
            placeholder="用逗号分隔，如: 学习, 工作, 运动"
            style={{ width: '100%' }}
          />
        </div>

        <div className="form-group">
          <label>照片</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload" className="btn btn-secondary">
            <Camera size={20} />
            {uploading ? '上传中...' : '添加照片'}
          </label>
          
          {images.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--spacing-sm)' }}>
              {images.map((img) => (
                <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--color-bg-secondary)' }}>
                  {img.blob && (
                    <img 
                      src={URL.createObjectURL(img.blob)} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button onClick={() => navigate('/diary')} className="btn btn-secondary" disabled={saving}>
            取消
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            <Save size={20} />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: 'var(--spacing-lg)' }}>
        <p className="text-small text-muted">
          ℹ️ <strong>本地存储</strong>：此日记仅保存在当前浏览器的 IndexedDB 中（已加密）。
          数据尚未同步到 GitHub。请定期使用"设置"中的导出功能备份。
        </p>
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

        .form-group input,
        .form-group textarea {
          width: 100%;
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
