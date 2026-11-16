import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Check, Info } from 'lucide-react';
import { isVaultInitialized, markVaultInitialized } from '../lib/storage';
import { evaluatePasswordStrength, createPasswordVerifier } from '../lib/crypto';
import { EmptyState } from '../components/EmptyState';

export function Settings() {
  const [vaultInit, setVaultInit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInitForm, setShowInitForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    isVaultInitialized().then(initialized => {
      setVaultInit(initialized);
      setLoading(false);
    });
  }, []);

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    const strength = evaluatePasswordStrength(password);
    if (strength.score < 2) {
      setError(`密码强度不足：${strength.feedback.join('；')}`);
      return;
    }

    try {
      // 创建密码验证器
      await createPasswordVerifier(password);
      await markVaultInitialized();
      setVaultInit(true);
      setShowInitForm(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('初始化失败：' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const passwordStrength = password ? evaluatePasswordStrength(password) : null;

  return (
    <div className="settings">
      <header className="page-header">
        <h1>设置</h1>
        <p className="text-muted">管理您的个人数据和偏好</p>
      </header>

      <div className="settings-section">
        <h2>🔒 保险库状态</h2>
        {vaultInit ? (
          <div className="card" style={{ backgroundColor: 'rgba(127, 176, 105, 0.1)', borderColor: 'var(--color-success)' }}>
            <div className="flex items-center gap-md">
              <Check size={24} color="var(--color-success)" />
              <div>
                <h3 className="mb-sm">保险库已初始化</h3>
                <p className="text-muted mb-0">您的数据将被加密保存在当前浏览器中</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!showInitForm ? (
              <div className="card">
                <EmptyState
                  icon={Lock}
                  title="保险库未初始化"
                  description="在开始使用之前，请先初始化保险库并设置主密码。所有个人数据将使用 AES-256-GCM 加密保存。"
                  action={{
                    label: '初始化保险库',
                    onClick: () => setShowInitForm(true)
                  }}
                />
              </div>
            ) : (
              <div className="card">
                <h3>初始化保险库</h3>
                <p className="text-muted">请设置一个强密码来保护您的数据</p>

                <form onSubmit={handleInitialize} style={{ marginTop: 'var(--spacing-lg)' }}>
                  <div className="form-group">
                    <label htmlFor="password">主密码</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="至少16个字符，包含大小写字母、数字和特殊字符"
                      required
                      style={{ width: '100%' }}
                    />
                    {passwordStrength && (
                      <div className="password-strength" style={{ marginTop: 'var(--spacing-sm)' }}>
                        <div className="strength-bar">
                          <div
                            className={`strength-fill strength-${Math.floor(passwordStrength.score)}`}
                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          />
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <p className="text-small text-muted" style={{ marginTop: 'var(--spacing-xs)' }}>
                            {passwordStrength.feedback.join('；')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirm-password">确认密码</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  {error && (
                    <div className="alert alert-error">
                      <AlertTriangle size={20} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="alert alert-warning">
                    <Info size={20} />
                    <div>
                      <strong>重要提示：</strong>
                      <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li>密码一旦忘记<strong>无法恢复</strong></li>
                        <li>请务必记住或安全保存您的密码</li>
                        <li>建议定期导出加密备份</li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setShowInitForm(false)} className="btn btn-secondary">
                      取消
                    </button>
                    <button type="submit" className="btn btn-primary">
                      确认初始化
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      <div className="settings-section">
        <h2>ℹ️ 隐私与安全说明</h2>
        <div className="card">
          <ul className="info-list">
            <li>✅ 所有个人数据使用 AES-256-GCM 加密</li>
            <li>✅ 密钥派生使用 PBKDF2-SHA256 (600,000 次迭代)</li>
            <li>✅ 数据仅保存在当前浏览器的 IndexedDB 中</li>
            <li>⚠️ 公开的 GitHub 仓库仅包含加密后的密文</li>
            <li>⚠️ 弱密码可能被离线暴力破解，请使用强密码</li>
            <li>⚠️ 浏览器清除数据会导致本地内容丢失</li>
            <li>📦 建议定期导出加密备份到安全位置</li>
          </ul>
        </div>
      </div>

      <style>{`
        .settings {
          max-width: 800px;
        }

        .settings-section {
          margin-bottom: var(--spacing-2xl);
        }

        .settings-section h2 {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-lg);
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .form-group input {
          width: 100%;
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }

        .alert {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
          font-size: var(--font-size-sm);
        }

        .alert-error {
          background-color: rgba(214, 69, 69, 0.1);
          border: 1px solid var(--color-error);
          color: var(--color-error);
        }

        .alert-warning {
          background-color: rgba(232, 168, 56, 0.1);
          border: 1px solid var(--color-warning);
          color: var(--color-text-primary);
        }

        .alert ul {
          list-style: disc;
          margin: 0;
        }

        .alert li {
          margin-bottom: var(--spacing-xs);
        }

        .password-strength {
          margin-top: var(--spacing-sm);
        }

        .strength-bar {
          height: 4px;
          background-color: var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: width var(--transition-base), background-color var(--transition-base);
        }

        .strength-fill.strength-0,
        .strength-fill.strength-1 {
          background-color: var(--color-error);
        }

        .strength-fill.strength-2 {
          background-color: var(--color-warning);
        }

        .strength-fill.strength-3,
        .strength-fill.strength-4 {
          background-color: var(--color-success);
        }

        .info-list {
          list-style: none;
          padding: 0;
        }

        .info-list li {
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--color-border);
        }

        .info-list li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}
