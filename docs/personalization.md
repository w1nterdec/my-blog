# w1nter维护

## 配色与布局

全站固定使用纯白底色，保留 Solarized Light 的文字、强调色与代码配色，不读取旧主题偏好或系统暗色设置。

- src/styles/theme.css：背景、正文、链接、边框与地球仪色值。
- src/styles/site.css：单栏首页、文章条目、导航、关于页和手机布局。
- src/styles/globe.css：关于页旅行地图。
- 首页只显示“我是 w1nter”标题与文章区。导航向下滚动后贴顶收束，仅底部圆角；减少动态效果时关闭收束过渡。
- astro-paper.config.ts 的 site.startedAt 设置运行起始日期；页脚按站点时区计算天数，从 2026-09-30 起算。
- src/styles/typography.css：Markdown 正文排版；代码高亮使用 solarized-light。
- public/admin/admin.css、preview.css：后台外壳与内容预览。

## 文章、项目文档与个人资料

后台“文章”维护正文、摘要、日期、标签、精选与草稿状态。

后台“项目文档”独立管理私有仓库 projects/ 中的 Markdown，支持导入 README 文件、正文编辑、草稿与发布，详情在站内阅读。旧 personal.project 外链配置已停止展示和导出。

后台“个人资料与足迹”沿用私有仓库 settings/journal.json，只维护 personal 与 places。个人资料只保留名字、头像与签名，不再导出项目外链、所在城市和近况状态。旧生活模块字段不再展示或导出；此次源码精简不主动修改私有仓库原始数据。后台保存后是否保留所有未配置字段由 CMS 决定，原始内容应通过私有仓库历史或独立备份恢复。

src/data/personal.ts 从生成数据中读取个人资料与城市；无生成文件时读取 journal-default.json。项目文档列表位于 /projects/ 与 /en/projects/，详情为 /projects/<slug>/，所有页面导航均提供入口。关于页右侧条形目录对应“关于我、联系我、足迹”。白底地球仪由访客拖动，不自动旋转；点击足迹标记会聚焦并显示地点名。城市列表为空时不渲染地图与对应目录项。

关于页正文在 src/content/pages/about.md 和 about-en.md 中维护；致谢在 credits.md 和 credits-en.md 中维护，固定放在关于页最下方。英文界面翻译在 src/i18n/site.ts，文章正文不自动翻译。

## 导航栏小黑

src/components/Xiaohei.astro、src/scripts/xiaohei.ts、xiaohei-sprite.ts 与 src/styles/xiaohei.css 仅维护导航栏小黑的待机与行走。不提供气泡、陪读或快捷召唤。页面隐藏或角色离屏时暂停；减少动态效果设置下静态展示。

## 验证

修改后运行 npm run lint、node --test tests/*.test.mjs 和 npm run build。检查中英文、手机菜单、语言切换、文章图片放大、地球仪拖动及静止行为、项目文档导入与详情以及旧页面 404。不要为展示效果生成虚假文章。
