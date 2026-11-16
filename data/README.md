# 数据目录

此目录包含加密后的个人数据。

## 结构

```
data/
├── manifest.json              # 公开清单（仅元数据，无明文私密内容）
└── encrypted/                 # 加密数据
    ├── diary/                 # 日记条目
    │   ├── 2026-11-16.enc
    │   └── ...
    ├── courses/               # 课程记录
    │   ├── 2026-11-16.enc
    │   └── ...
    └── reviews/               # 周/月/年总结
        ├── weekly-2026-W46.enc
        ├── monthly-2026-11.enc
        ├── yearly-2026.enc
        └── ...
```

## 安全说明

⚠️ **重要**: 此目录中的所有文件都已使用 AES-256-GCM 加密。

- ✅ 可以安全地提交到公开的 GitHub 仓库
- ✅ manifest.json 仅包含元数据（日期、类型、路径），不包含明文标题或内容
- ⚠️ 但如果使用弱密码，密文可能被离线暴力破解
- 📌 请务必使用强密码（≥16字符，大小写字母+数字+特殊字符）

## 自动化流程

外部自动化流程（Grok Bot）通过 `scripts/encrypt-entry.ts` 脚本加密并发布内容：

```bash
# 加密日记
echo "your-password" | node scripts/encrypt-entry.ts \
  --type diary \
  --date 2026-11-16 \
  --input diary-entry.json

# 加密周总结
echo "your-password" | node scripts/encrypt-entry.ts \
  --type weekly \
  --period 2026-W46 \
  --input weekly-review.json
```

## 密码管理

- 密码仅在本地使用，**永远不要**提交到 Git 仓库
- 建议通过环境变量或 stdin 传递密码
- 避免在命令行参数中直接写入密码（会留在 shell history 中）

## 恢复数据

在浏览器中访问本网站，输入正确的密码即可解密并查看数据。
