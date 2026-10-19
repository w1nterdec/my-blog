# w1nter 维护

## 内容与个人资料

文章直接维护 `src/content/posts/*.md`，项目文档维护 `src/content/projects/` 中的 `.md` 或 `README.md`。图片提交到 `public/images/`。具体字段、路径和发布步骤见 [README](../README.md)。

个人资料与足迹直接编辑 `src/data/journal.json` 的 `personal` 和 `places`。头像使用 `public/` 下的文件路径；城市坐标为 `[经度, 纬度]`。关于页正文在 `src/content/pages/about.md`、`about-en.md`，致谢在 `credits.md`、`credits-en.md`。英文界面翻译位于 `src/i18n/`，正文不自动翻译。

项目详情位于 `/projects/<slug>/`，中英文导航均提供入口。普通 README 自动提取标题和摘要。旅行地图可拖动，点击城市标记聚焦；城市列表为空时隐藏地图和目录项。

## 外观与动画

- `src/styles/theme.css`：白底、Solarized Light 的正文与强调色。
- `src/styles/site.css`、`typography.css`：布局和 Markdown 排版。
- `src/styles/globe.css`：旅行地图。
- `astro-paper.config.ts`：域名、站点信息、功能与运行起始日期。
- `src/components/Xiaohei.astro`、`src/scripts/xiaohei.ts`、`xiaohei-sprite.ts` 和 `src/styles/xiaohei.css`：导航栏小黑的待机与行走动画；页面隐藏或角色离屏时暂停，减少动态效果时静态显示。

## 验证

运行 `npm run lint`、`npm test`、`npm run build`。检查中英文导航、手机菜单、搜索、文章图片、项目详情、地球仪及旧页面 404。不要为展示效果生成虚假文章。
