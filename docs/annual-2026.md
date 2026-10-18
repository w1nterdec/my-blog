# w1nter部署与维护

## 当前架构

源码仓库与私有内容仓库 w1nterdec/my-blog-content 分离。Astro 生成静态博客，Decap CMS 负责文章、项目文档与个人资料编辑；VPS 的 Node.js 服务只桥接 GitHub OAuth。没有文章数据库、访客账号或音乐播放服务。

本轮精简移除了摄影、音乐、歌词、碎碎念、游戏、孤岛和仓鼠。导航栏小黑保留轻量动画。主题固定为纯白底色，保留 Solarized Light 的文字、强调色与代码配色。原始私有内容没有在本轮本地修改中主动删除。

## 后台与内容

生产入口 https://chenzhixing.bbroot.com/admin/，说明在 /admin/guide.html。

- “文章”：Markdown、插图、封面、日期、标签、精选与撤回。
- “项目文档”：独立 projects/ Markdown 集合，支持 README 文件导入和站内详情；与文章分开管理。
- “个人资料与足迹”：头像、签名和旅行城市；继续使用 settings/journal.json。旧项目外链、所在城市与近况状态不再导出。
- 关于页正文和英文介绍仍在源码中维护。
- 保存草稿进入私有编辑分支；发布合并内容主分支。浏览器自动恢复不能代替保存。
- 导出器只发布到期且非草稿文章与项目文档、个人资料和旅行足迹，以及正文、封面和头像引用的图片。旧生活模块字段不再进入生成 JSON。
- 图片最长边 1920px、WebP、移除 EXIF；原图需独立备份。

## 源码验证与生产发布

本源码仓库 Actions 只验证 lint、测试和构建。生产发布工作流位于私有内容仓库；以下说明沿用既有部署约定，修改源码时也应核对该仓库实际配置。

生产来源由 SOURCE_REF 指定，ALLOW_PRODUCTION=true 才允许发布。普通内容发布触发构建；未来发布时间依赖每小时调度，可能延迟约一小时或更久。源码修改需由私有仓库后续调度同步，或手动运行其发布工作流。

内容导出使用 CONTENT_DIR，之后执行正式构建。发布失败继续保留旧版本。备份、定时任务和线上凭据不由本次本地构建配置或更新。

## OAuth 与服务器接入

1. 在独立 GitHub OAuth App 配置回调 https://chenzhixing.bbroot.com/api/admin/callback。
2. 将 server/admin/index.mjs、服务配置和 OAuth 环境文件部署到网站根目录之外，凭据文件权限 600。
3. 管理员审阅 infrastructure/setup-server.sh 后，以 root 执行安装。普通部署账号不能代替 root 安装服务或修改证书与 Nginx。
4. HTTPS 配置 infrastructure/nginx-admin.conf 中的 OAuth 代理；不要开放 HTTP 后台登录。
5. 服务 /api/admin/health 仅检查凭据是否配置；它不保证 GitHub 授权或生产发布成功。

OAuth 使用 repo scope，仅允许配置的站主登录，并使用单次短期 state、HttpOnly cookie 和固定消息来源。共享设备使用后退出后台，必要时在 GitHub 撤销授权。

## 回滚

infrastructure/activate-release.sh 将独立 releases/<id> 原子切换到 current，健康检查失败时恢复上一版。手动操作前应暂停自动发布，并确认 .previous-release 指向 releases/ 内存在的版本。

回滚恢复网站文件；若需持续保留，还应撤回对应内容或源码修改，避免后续调度重新发布。清理旧版本时不要删除 current 或 .previous-release 指向的目录。

## 备份与统计

既有私有仓库约定为每周加密完整 Git bundle，上传网站目录之外并保留最近 4 份。恢复密钥需离线保存；具体任务是否正常以私有工作流和服务器为准。Git 历史不能代替独立备份，原图应另存。

建议在 GitHub 开启 Actions 失败通知，管理员定期验证证书续期。infrastructure/log-stats.py 从 Nginx 日志汇总年度页面请求数，包含机器人，不代表独立访客；公开统计不包含原始 IP 和用户代理。
