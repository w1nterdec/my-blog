# 知行 2026 年度维护说明

## 本轮的边界

源码仓库公开，内容仓库 `w1nterdec/my-blog-content` 私有。后台只是独立加载的编辑器，博客仍由 Astro 生成静态文件；VPS 只增加一个仅在登录时工作的 GitHub OAuth 桥接进程。没有文章数据库、音乐流媒体或访客账号系统。

## 第一次接入

1. `.env.admin` 填独立 OAuth App 的 Client ID/Secret；回调 `https://chenzhixing.bbroot.com/api/admin/callback`。
2. 将 `server/admin/index.mjs`、`infrastructure/zhixing-admin.service`、`.env.admin`（改名 `admin.env`）放到服务器**网站根目录之外**的安装目录。密钥文件权限 `600`，不要用公共下载链接传送。
3. 服务器管理员审阅 `infrastructure/setup-server.sh` 后，以 root 执行 `bash setup-server.sh /安装目录 deploy`。当前部署用户只有 chown/chmod/find 的 sudo 权限，无法代替 root 安装服务、续证或改 Nginx。
4. 脚本保留旧配置、建立旧版本快照，配置真实 404、HTTPS 与后台代理。签发失败时不要开放 HTTP 后台登录，先检查域名解析、80/443 端口和证书日志。
5. 预览确认后合并源码分支；私有仓库 Actions 变量 `SOURCE_REF` 改为 `main`、`ALLOW_PRODUCTION` 设为 `true`。此前发布保持关闭。

## 平时如何更新

打开 `/admin/`，用 `w1nterdec` 登录。保存草稿进入私有分支；发布合并私有主分支并触发 CI。只接受 Markdown，避免在内容里运行 MDX/代码。可视化编辑、Markdown、插图、封面、标签和精选在随笔编辑页；其余内容在“生活与站点”编辑。列表可拖动排序。

编辑器的自动恢复存在本机浏览器。换设备前点击“保存”，这才同步到私有仓库；没有承诺每次按键都产生云端 Git 提交。正文预览在已登录编辑器中完成，不创建匿名可访问的私有预览站。

设未来发布时间后可以提前合并，导出器在发布时间前排除正文和图片。私有仓库每小时检查一次，只有公开内容或源码改变才构建/发布。排期可能延迟约一小时，GitHub 调度繁忙时更久；选这个频率是为控制免费 Actions 分钟额度，不能保证精确到分钟。普通内容发布立即触发构建。源码 push 先运行公开仓库验证，再由私有仓库下一次每小时调度同步；需要立即上线源码时手动运行私有仓库 Publish 工作流。

## 图片与版权

只上传精选展示作品，原图自行备份。发布器仅处理公开条目引用的图片，最长边 1920px、WebP、移除 EXIF。后台填写日期、城市、器材和故事作为明确选择公开的信息，不会自动把 GPS 写到网页。可见展示图仍可被保存，禁止原图下载不能技术上阻止截图/复制。

## 配置与安全

- OAuth 应用使用 GitHub `repo` scope，经典 OAuth 的权限范围较宽；仅允许站主登录、固定消息来源、HttpOnly 状态 cookie、单次短期 state。建议专用应用，离开共享设备后退出后台并在 GitHub 撤销授权。
- `.private/`、`.env.*`、生成内容、原图目录都排除 Git 与 Docker 构建上下文。
- OAuth 凭据不应出现在浏览器代码、Actions 输出、公开上传目录或 Git 历史。
- 私有内容仅由私有仓库自己的 GitHub Actions token 读取；公开源码验证流程不读草稿，不保存个人长期全权限 token。
- 私有仓库 Actions 的访问者能看到构建日志；导出器不打印草稿内容。构建失败保持旧版网站。
- 库审计在本次修复后为零；年度检查不能承诺未来依赖没有漏洞。建议开启 Dependabot 安全提醒，必要时提前维护。

## 发布和回滚

每次上传独立 `releases/<id>`，确认页面完整后原子切换 `current`。旧官方文章不再因为覆盖上传而残留在新版本里；Nginx 的真正 404 不再把不存在的路径显示为首页。激活健康检查失败自动切回上个版本。

人工回滚：在服务器 `/var/www/astro-blog` 下读取 `.previous-release`，确认目标在 `releases/` 内且存在，再执行 `ln -s "$(cat .previous-release)" .current-next && mv -Tf .current-next current`。恢复的是网站文件；若要之后一直保留，仍需撤回对应内容/源码提交。

每年检查并清理不再需要的旧 release，保留现行、上一版和最近 7 个成功版本；不要删除 `current` 或 `.previous-release` 指向的目录。

## 独立备份与故障通知

Git 历史不是独立备份。私有仓库每周将包含草稿分支的完整 Git bundle 用独立密钥加密，上传到 VPS 网站目录之外的 `.zhixing-backups`，保留最近 4 份。恢复密钥在本机 `.private/backup-recovery.key`，请另存到私有备份盘；密钥丢失无法解密。恢复时用 `gpg --decrypt backup.bundle.gpg > content.bundle`，再 `git clone content.bundle recovered-content`。

同时建议每月在自己的备份盘执行 `git clone --mirror https://github.com/w1nterdec/my-blog-content.git`（以后 `git remote update`），原图另存。源代码同样备份。可恢复时在新私有仓库 `git push --mirror`，随后修改后台 repo 和 CI 地址。备份盘必须私有。

GitHub Settings → Notifications → Actions 开启失败通知；证书续期由 certbot.timer 管理，服务器管理员每年执行 `certbot renew --dry-run`。本轮没有擅自创建邮件发送服务。服务器安装脚本设置每天 03:23 的日志汇总，不把请求数当成真实独立访客。

## 仍待外部接入的可选项目

giscus 需你安装 GitHub App 并启用公共仓库 Discussions；未接通前不展示假的评论区。访问统计采用每天从 Nginx 日志提取的年度页面请求数，包含机器人，公开 JSON 没有 IP 或用户代理。首次服务器安装后开始累计，不虚构以往访客数。照片原作、音乐封面、具体专辑与分享链接由你挑选后补充。游戏完整模块延后。
