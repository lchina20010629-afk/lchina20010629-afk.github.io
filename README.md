# 个人生活与成长学习仪表板

一个美观、安全、以中文为先的个人生活和成长学习静态网站，专为隐私保护而设计。

## ✨ 特性

- 🎨 **温暖设计**：奶油色/墨色 + 柔和绿色的温暖配色
- 📱 **移动优先**：响应式设计，完美支持桌面和移动设备
- 🔒 **强加密**：AES-256-GCM + PBKDF2-SHA256 (600,000 迭代)
- 🌓 **主题切换**：浅色/深色/跟随系统
- ♿ **无障碍**：键盘导航、焦点指示、ARIA 标签
- 🗂️ **完整功能**：
  - 今日总览仪表板
  - 生活日记（支持照片）
  - 成长学习（英语/泰语/修身养性/生财有道）
  - 周/月/年总结回顾
  - 安全设置与备份

## 🔐 隐私与安全

### 端到端加密

所有个人数据使用军事级加密：

- **加密算法**: AES-256-GCM (AEAD)
- **密钥派生**: PBKDF2-SHA256, 600,000 次迭代
- **随机性**: 使用 Web Crypto API 的密码学安全随机数生成器
- **完整性**: GCM 认证标签确保数据未被篡改

### 数据存储

- ✅ **本地优先**: 所有数据保存在浏览器 IndexedDB 中
- ✅ **加密存储**: 个人内容在存储前即被加密
- ✅ **公开安全**: GitHub 仓库仅包含加密密文
- ⚠️ **弱密码风险**: 使用弱密码可能导致离线暴力破解
- 📦 **定期备份**: 支持导出加密备份

### 安全实践

```plaintext
✓ 强密码要求（≥16字符，大小写+数字+特殊字符）
✓ 密码一旦忘记无法恢复
✓ 不在代码或日志中记录密码
✓ CLI 通过环境变量或 stdin 安全传递密码
✓ 图片自动剥离 EXIF 元数据
```

## 🚀 快速开始

### 首次使用

1. 访问网站
2. 进入「设置」页面
3. 初始化保险库并设置强密码
4. 开始记录您的生活

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/lchina20010629-afk/lchina20010629-afk.github.io.git
cd lchina20010629-afk.github.io

# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 🤖 自动化集成

外部自动化流程（由 Grok Bot 在外部运行）可通过 CLI 脚本加密并发布内容：

### 加密日记

```bash
# 通过 stdin 传递密码（推荐）
echo "your-password" | node scripts/encrypt-entry.ts \
  --type diary \
  --date 2026-11-16 \
  --input diary-entry.json

# 或通过环境变量
VAULT_PASSWORD="your-password" node scripts/encrypt-entry.ts \
  --type diary \
  --date 2026-11-16 \
  --input diary-entry.json
```

### 加密周总结

```bash
echo "your-password" | node scripts/encrypt-entry.ts \
  --type weekly \
  --period 2026-W46 \
  --input weekly-review.json
```

### 输入数据格式

#### 日记条目 (diary-entry.json)

```json
{
  "id": "diary-2026-11-16",
  "title": "美好的一天",
  "content": "今天学习了很多新知识...",
  "mood": "开心",
  "weather": "晴",
  "tags": ["学习", "成长"],
  "images": []
}
```

#### 课程记录 (course-record.json)

```json
{
  "id": "course-2026-11-16",
  "courses": [
    {
      "name": "英语",
      "targetMinutes": 10,
      "actualMinutes": 12,
      "completed": true,
      "materials": ["剑桥英语"],
      "reflection": "今天学习了新单词"
    }
  ],
  "notes": "总体进展顺利"
}
```

### 自动化时间表

以下流程由外部 Grok Bot 自动执行（**非本网站功能**）：

- **每天 10:30** - 课程准备
- **每天 23:30** - 日记整理润色
- **每周日** - 周总结生成
- **每月最后一天** - 月总结生成
- **12月31日** - 年终总结生成

⚠️ **重要**: 本网站是纯静态站点，托管在 GitHub Pages，没有服务器功能，不会自动运行这些流程。

## 📊 数据结构

### 目录结构

```
data/
├── manifest.json              # 公开清单（仅元数据）
└── encrypted/                 # 加密数据目录
    ├── diary/                 # 日记
    │   ├── 2026-11-16.enc
    │   └── ...
    ├── courses/               # 课程记录
    │   ├── 2026-11-16.enc
    │   └── ...
    └── reviews/               # 总结
        ├── weekly-2026-W46.enc
        ├── monthly-2026-11.enc
        └── yearly-2026.enc
```

### manifest.json 格式

```json
{
  "version": "1.0.0",
  "entries": [
    {
      "id": "diary-2026-11-16",
      "type": "diary",
      "date": "2026-11-16",
      "encryptedPath": "encrypted/diary/2026-11-16.enc",
      "created": "2026-11-16T10:30:00+08:00",
      "modified": "2026-11-16T23:30:00+08:00",
      "cryptoVersion": "v1",
      "status": "published"
    }
  ]
}
```

**注意**: manifest.json 不包含任何明文私密内容（标题、摘要等）。

## 🏗️ 技术栈

- **框架**: React 19 + TypeScript 7
- **构建工具**: Vite 6
- **路由**: React Router 7
- **样式**: 原生 CSS（CSS 变量 + 响应式）
- **存储**: IndexedDB (idb)
- **加密**: Web Crypto API (浏览器) + Node.js crypto (CLI)
- **测试**: Vitest + Testing Library
- **部署**: GitHub Pages + GitHub Actions

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 测试覆盖
npm run test -- --coverage
```

### 测试覆盖

- ✅ 加密/解密 (Unicode, 二进制, 错误处理)
- ✅ 密码验证器
- ✅ 密码强度评估
- ✅ 日期辅助函数（周期计算）
- ✅ 边界条件和错误处理

## 📱 浏览器支持

- Chrome/Edge ≥ 90
- Firefox ≥ 88
- Safari ≥ 14.1
- 移动浏览器（iOS Safari, Chrome Mobile）

需要支持：
- Web Crypto API
- IndexedDB
- ES2020+

## ⚠️ 重要提示

### 密码恢复

**密码一旦忘记无法恢复！** 请务必：

1. 使用强密码并妥善保管
2. 定期导出加密备份到安全位置
3. 考虑使用密码管理器

### 数据持久性

- 浏览器清除数据会导致本地内容丢失
- 建议定期导出备份
- 备份文件同样加密，需要密码解密

### 隐私注意事项

- 公开 GitHub 仓库仅包含加密密文
- 弱密码可能被离线暴力破解
- 请使用强密码（≥16字符）
- 不要在公开场所输入密码

## 📝 架构决策

详见 [ARCHITECTURE.md](ARCHITECTURE.md)，包含：

- 技术选型理由
- 安全设计考量
- 数据模型规范
- 测试策略
- 已知限制

## 🤝 贡献

这是一个个人项目，目前不接受外部贡献。

## 📄 许可证

MIT License

## 🙏 致谢

- 使用 [Vite](https://vite.dev) 构建
- 图标来自 [Lucide](https://lucide.dev)
- 灵感来自个人成长和隐私保护的需求

---

**记录生活，守护隐私** 🌱
