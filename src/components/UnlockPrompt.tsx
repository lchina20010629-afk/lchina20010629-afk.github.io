import { useState } from 'react';
import { useVault } from '../contexts/VaultContext';
import { useNavigate } from 'react-router-dom';

interface UnlockPromptProps {
  message?: string;
  returnPath?: string;
}

export function UnlockPrompt({ 
  message = '请先解锁保险库才能查看此内容',
  returnPath 
}: UnlockPromptProps) {
  const { unlock } = useVault();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await unlock(password);
      if (success) {
        // Successfully unlocked - stay on current page or navigate to returnPath
        if (returnPath) {
          navigate(returnPath, { replace: true });
        } else {
          // Reload current page to show unlocked content
          window.location.reload();
        }
      } else {
        setError('密码错误，请重试');
        setPassword('');
      }
    } catch (err) {
      setError('解锁失败，请重试');
      console.error('Unlock error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <h3>🔒 保险库已锁定</h3>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        {message}
      </p>
      
      <form onSubmit={handleUnlock}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="unlock-password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            输入密码解锁
          </label>
          <input
            id="unlock-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入保险库密码"
            disabled={loading}
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid var(--color-border)',
              borderRadius: '4px'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            color: 'var(--color-error)', 
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="button button-primary"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? '解锁中...' : '解锁'}
          </button>
          <button 
            type="button"
            className="button"
            onClick={() => navigate('/settings')}
            disabled={loading}
          >
            前往设置
          </button>
        </div>
      </form>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '4px',
        fontSize: '0.9rem'
      }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          💡 <strong>提示：</strong>页面刷新后需要重新输入密码。这是安全设计，密码仅保存在内存中，不会持久化存储。
        </p>
      </div>
    </div>
  );
}
