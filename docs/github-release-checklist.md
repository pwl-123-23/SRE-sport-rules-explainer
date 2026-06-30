# GitHub 发布检查清单

## 发布前

- 运行 `npm run validate`
- 打开 `index.html` 或运行 `npm run start` 检查规则弹窗、分类筛选、搜索和学习记录
- 确认 README 中的项目名称、功能和运行命令准确
- 确认 `package.json` 的 `name`、`description` 已更新
- 如需 GitHub Pages，发布仓库根目录即可

## 建议仓库信息

- Repository name: `SRE-sport-rules-explainer`
- Description: `体育赛事规则学习平台，覆盖七大运动类别，支持二维规则示意和本地学习记录`
- Topics: `html`, `css`, `javascript`, `sports`, `rules`, `education`, `senior-friendly`

## 首次提交建议

```bash
git add index.html src scripts docs README.md package.json .gitignore
git commit -m "Build sports rules guide MVP"
git push
```

## 后续 GitHub Roadmap

- Issue 1: 校对官方规则来源和版本号
- Issue 2: 增加 Three.js 三维场地演示
- Issue 3: 增加语音朗读和大字模式全局开关
- Issue 4: 增加规则问答和错题复习
- Issue 5: 输出微信小程序版本原型
