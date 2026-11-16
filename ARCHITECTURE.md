# 架构决策文档 (Architecture Decision Record)

## 执行时间
2026年11月16日

## 实际安装版本 (已验证 package-lock.json)
- **React**: 19.3.1
- **TypeScript**: 5.7.3
- **Vite**: 6.4.6
- **Vitest**: 2.1.9
- **React Router DOM**: 7.18.5

## 核心架构决策

### 1. 静态站点生成器选择
**选择**: Vite + React + TypeScript

**理由**:
- ✅ 完全静态，适合GitHub Pages部署
- ✅ 成熟稳定的生态系统，长期维护支持
- ✅ 优秀的开发体验和构建速度
- ✅ 原生支持TypeScript，类型安全
- ✅ 良好的浏览器兼容性和Web Crypto API支持
- ✅ 轻量级，无需服务端

**拒绝的替代方案**:
- ❌ Next.js: 虽支持静态导出(next export)，但优化面向服务端场景，配置复杂度高
- ❌ Nuxt: Vue生态，与项目React技能栈不匹配
- ❌ Gatsby: 过于重量级，GraphQL数据层对简单静态站点过度设计
- ❌ Astro: 虽然成熟且适合静态站点，但React生态系统更丰富，社区支持更广

### 2. 加密方案
**选择**: Web Crypto API (浏览器) + Node.js crypto (CLI)

**算法配置**:
- **加密**: AES-256-GCM
- **密钥派生**: PBKDF2-SHA256, 迭代次数 ≥ 600,000
- **随机性**: crypto.getRandomValues() / crypto.randomBytes()
- **格式**: 标准化JSON包络 {version, salt, iv, ciphertext, authTag}

**理由**:
- ✅ 浏览器原生支持，无需第三方依赖
- ✅ 行业标准算法，经过广泛审计
- ✅ AEAD模式提供完整性验证
- ✅ Node.js crypto模块内置，CLI无需外部依赖
- ✅ 跨平台兼容性好

**拒绝的替代方案**:
- ❌ crypto-js: 第三方库，增加依赖表面
- ❌ libsodium.js: WASM依赖，体积大
- ❌ RSA/非对称加密: 过度复杂，不适合本地单用户场景

### 3. 本地存储方案
**选择**: IndexedDB (主存储) + localStorage (偏好设置)

**理由**:
- ✅ IndexedDB 支持大容量存储（图片、加密数据）
- ✅ 结构化查询能力
- ✅ 事务支持，保证数据一致性
- ✅ localStorage 适合简单偏好（主题、语言）
- ✅ 都不会自动同步到服务器，符合隐私要求

**存储策略**:
- 未初始化保险库时：禁止存储个人内容
- 已初始化保险库时：所有个人内容加密存储
- 明确标注"仅保存在当前浏览器，尚未同步"

### 4. 数据模式与文件结构
**公共仓库结构** (所有私密内容加密):
```
/data/
  manifest.json           # 公开清单（仅安全元数据）
  encrypted/
    diary/
      2026-11-16.enc     # 加密的日记条目
      2026-11-16-img1.enc # 加密的图片
    courses/
      2026-11-16.enc     # 加密的课程记录
    reviews/
      weekly-2026-W46.enc
      monthly-2026-11.enc
      yearly-2026.enc
```

**manifest.json 结构** (无明文私密内容):
```json
{
  "version": "1.0.0",
  "entries": [
    {
      "id": "uuid",
      "type": "diary|course|weekly|monthly|yearly",
      "date": "2026-11-16",
      "period": "2026-W46|2026-11|2026",
      "encryptedPath": "encrypted/diary/2026-11-16.enc",
      "encryptedImages": ["encrypted/diary/2026-11-16-img1.enc"],
      "created": "2026-11-16T10:30:00+08:00",
      "modified": "2026-11-16T23:30:00+08:00",
      "cryptoVersion": "v1"
    }
  ],
  "verifier": {
    "salt": "hex",
    "iterations": 600000,
    "verifierCiphertext": "hex"
  }
}
```

**加密包络格式**:
```json
{
  "version": "v1",
  "algorithm": "AES-256-GCM",
  "kdf": "PBKDF2-SHA256",
  "salt": "hex (32 bytes)",
  "iv": "hex (12 bytes)",
  "iterations": 600000,
  "ciphertext": "hex",
  "authTag": "hex (16 bytes)"
}
```

### 5. 自动化数据契约
**Node CLI 脚本功能**:
- ✅ 输入验证（schema验证）
- ✅ 加密条目和图片（自动剥离EXIF）
- ✅ 幂等性更新（按类型+时期）
- ✅ 事务性写入（无部分索引）
- ✅ 保留现有条目
- ✅ 与浏览器导出兼容

**CLI使用**:
```bash
# 加密密码通过环境变量或stdin，不在argv/history
VAULT_PASSWORD=... node scripts/encrypt-entry.js \
  --type diary \
  --date 2026-11-16 \
  --input diary.json \
  --images img1.jpg,img2.jpg

# 或使用stdin
echo "password" | node scripts/encrypt-entry.js --type diary ...
```

**周期计算逻辑**:
- 周：周一到周日 (ISO 8601)
- 月：自然月，月末最后一天
- 年：12月31日

### 6. 测试策略
**单元测试**:
- ✅ 加密/解密 Unicode 字符串
- ✅ 错误密码处理
- ✅ 图片二进制数据往返
- ✅ manifest中无明文标题
- ✅ 幂等性更新逻辑
- ✅ 日期边界辅助函数
- ✅ 密码强度验证

**集成测试**:
- ✅ 导入/导出流程
- ✅ 错误密码/篡改数据处理
- ✅ 时期边界计算
- ✅ 浏览器工作流（空状态/锁定/解锁/错误）

**安全审计**:
- ✅ 生产构建无明文私密数据
- ✅ 无密码泄漏（代码/日志/环境变量示例）
- ✅ 加密强度验证
- ✅ 路径遍历防护

### 7. UI/UX设计
**设计系统**:
- 主色调：温暖奶油色 (#FAF9F6) / 墨色 (#2C3E50)
- 强调色：柔和绿色 (#7FB069)
- 字体：系统中文字体栈，优先使用苹方/微软雅黑
- 响应式：Mobile-first，桌面侧边栏/移动底部导航
- 主题：浅色/深色模式切换
- 无障碍：键盘导航、焦点指示、ARIA标签

**页面结构**:
1. 今日总览 (Dashboard)
2. 日历/生活日记 (带相册)
3. 独立周总结/月总结/年终总结
4. 成长学习（4栏：英语10分钟/泰语8分钟/修身养性6分钟/生财有道6分钟）
5. 进度/打卡
6. 设置 + 安全备份/导入/导出

**空状态**:
- 诚实展示"暂无数据"
- 可选的隔离演示模式（明确标注）
- 默认真实集合为空

### 8. 部署配置
**GitHub Actions**:
- 最小化权限范围
- 仅在PR合并到main后触发
- 正确的站点根路径配置
- 并发控制防止覆盖

**时区配置**:
- 统一使用 Asia/Kuala_Lumpur (GMT+8)

### 9. 限制与权衡
**已知限制**:
- ⚠️ 公开密文可被复制，弱密码可离线暴力破解
- ⚠️ 浏览器本地存储可被物理访问设备读取
- ⚠️ 静态站点无法自动同步到GitHub
- ⚠️ 密码更改需重新加密所有数据
- ⚠️ 无密码恢复机制（请妥善保管）
- ⚠️ IndexedDB可被浏览器清理

**文档说明**:
- 所有限制将在用户界面和README中明确说明
- 提供最佳实践建议（强密码、定期导出备份）

### 10. 验证计划
**第一阶段：单元测试**
- crypto模块：加密/解密/错误处理
- 数据模式：验证/序列化
- 日期辅助函数：周期计算

**第二阶段：集成测试**
- 完整导入/导出流程
- 密码验证流程
- 数据损坏恢复

**第三阶段：浏览器测试**
- 桌面Chrome/Firefox/Safari工作流
- 移动浏览器响应式
- 无障碍键盘导航
- 空/锁定/解锁/错误状态

**第四阶段：构建与安全审计**
- 生产构建成功
- 无明文数据泄漏
- 依赖漏洞扫描
- 最终diff审查

## 下一步
1. 实现核心加密模块
2. 搭建UI框架
3. 实现页面组件
4. 编写CLI脚本
5. 完整测试套件
6. 创建PR供审查
