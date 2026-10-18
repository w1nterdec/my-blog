# w1nter

以文章阅读为中心的 Astro 静态博客，使用纯白底色，保留 Solarized Light 的文字、强调色与代码配色。保留文章、标签、归档、搜索、RSS、关于页、旅行足迹和导航栏小黑。支持中文与英文界面；文章正文保留中文原文。

## 本地运行

需要 Node.js >=24 和 npm：

```sh
npm ci
npm run dev
```

检查与构建：

```sh
npm run lint
node --test tests/*.test.mjs
npm run build
npm run preview
```

受限环境可设置 ASTRO_TELEMETRY_DISABLED=1，避免 Astro 写入用户级遥测配置。构建会更新 dist/、.astro/ 和 public/pagefind/，这些生成目录不提交。

## 页面与配置

- src/pages/index.astro：首页标题、文章摘要列表与标签入口。
- src/pages/posts/：文章列表与详情；每页数量在 astro-paper.config.ts 配置。
- src/pages/tags/、archives/、search.astro：标签、归档与 Pagefind 搜索。
- src/pages/about.astro：个人资料、联系入口与旅行地图，网站致谢位于页底。
- src/pages/projects.astro、projects/[...slug].astro：项目文档列表与站内详情，支持 README / Markdown。
- src/pages/en/[...page].astro：复用中文页面组件的英文路由。
- src/content/pages/about.md、about-en.md：关于页正文。
- src/content/pages/credits.md、credits-en.md：关于页最下方的网站致谢。
- src/styles/theme.css：纯白底色与浅色主题色值；网站不提供主题切换。
- src/styles/site.css、globe.css：布局、排版与地图。
- src/scripts/xiaohei.ts：仅导航栏待机与行走动画。
- astro-paper.config.ts：域名、站点信息、社交链接和博客功能开关。
- astro-paper.config.ts 的 site.startedAt：博客运行起始日期，当前为 2026-09-30；页脚按站点时区显示已运行天数，并在浏览器中自动更新。

摄影、音乐、歌词、碎碎念、游戏、孤岛及仓鼠功能已经移除，其原页面返回 404。

## 内容与后台

生产后台 /admin/ 使用 Decap CMS，通过 GitHub 登录并保存到独立私有内容仓库。后台包含“文章”“项目文档”和“个人资料与足迹”。项目文档可导入 README.md、.md、.markdown；个人资料与足迹沿用 settings/journal.json。

文章位于私有内容仓库 posts/，项目文档位于 projects/，图片位于 media/。保存草稿与发布是两个步骤。运行内容导出时设置 CONTENT_DIR 指向该仓库，再执行 npm run content:sync：

- 公开文章生成到 src/content/posts/_published/，公开项目文档生成到 src/content/projects/_published/。
- 个人资料与足迹生成到 src/data/generated/journal.json。
- 公开文章、项目文档与头像引用的图片生成到 public/uploads/，转换为最长边 1920px 的 WebP，去除 EXIF。
- 草稿、未来文章或项目文档及未引用图片不导出，已取消的生活模块字段也不再导出。
- 没有生成数据时使用 src/data/journal-default.json 中的公开默认资料。

本地也可以在 src/content/posts/ 编写 Markdown。必要字段为 title、description、pubDatetime；支持 tags、featured、draft、ogImage 等。后台发布链路只接受 Markdown，不运行 MDX。

项目文档也可直接放入 src/content/projects/*.md，或提交到私有内容仓库 projects/。普通 README 无需 YAML：标题取首个一级标题（没有时取文件名或父目录），摘要取正文首段。可选 YAML 字段为 title、description、pubDatetime、modDatetime、draft、ogImage。私有仓库也接受 .markdown，导出为 .md。项目有独立站内详情与中英文入口，正文保留原文；没有项目文档时展示空状态。插图请在后台上传并使用 /media/ 路径，外部 README 的相对图片路径需重新关联，单个 Markdown 文件不会携带本地图片。

## 验证与发布

本源码仓库 .github/workflows/deploy.yml 只运行 lint、测试与构建。生产发布由私有内容仓库工作流负责；普通文章发布触发构建，未来文章依赖定时检查。仅运行 npm run build 不会发布网站。

服务器 OAuth、Nginx、回滚和备份说明见 docs/annual-2026.md。后台使用说明在 /admin/guide.html。不要提交密钥、私有仓库、生成内容或原图。
