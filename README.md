# w1nter

以文章阅读为中心的 Astro 静态博客，固定白底与 Solarized Light 配色，支持文章、项目文档、标签、归档、搜索、RSS、关于页、旅行足迹及中英文界面。文章正文不自动翻译。

网站采用 **本地写 Markdown → git push → GitHub Actions 检查和构建 → SSH 上传 VPS → Nginx 提供静态页面**。文章和图片都在源码仓库 `w1nterdec/my-blog` 中维护。后台管理、Decap CMS、GitHub OAuth 桥接和私有内容导出已经移除。

## 1. 本地准备

需要 Node.js >=24、npm 和 Git。首次克隆后执行：

```sh
git clone https://github.com/w1nterdec/my-blog.git
cd my-blog
npm ci
npm run dev
```

当前已有本地仓库时，在该目录执行 `npm ci` 即可。开发地址通常为 `http://localhost:4321`，终端会显示实际端口。无需登录后台或配置 OAuth。可选的搜索引擎验证配置见 `.env.example`，本地写作无需密钥。

## 2. 本地创建文章和上传图片

### 文件位置

- 文章：`src/content/posts/<slug>.md`。
- 项目文档：`src/content/projects/<slug>.md` 或 `<project>/README.md`。
- 图片：`public/images/<slug>/`，与文章一起提交 Git。
- 个人资料与旅行城市：`src/data/journal.json`，当前已保留本地导出的资料与足迹。
- 关于页正文：`src/content/pages/about.md`、`about-en.md`。
- 网站致谢：`src/content/pages/credits.md`、`credits-en.md`。

文件名推荐英文小写与连字符，例如 `my-first-post.md`。该文件的文章地址为 `/posts/my-first-post/`，英文入口为 `/en/posts/my-first-post/`；嵌套子目录也会进入 URL。不要随意重命名已发布文件，以免旧链接失效。

### 创建文章

在编辑器中新建 `src/content/posts/my-first-post.md`：

```md
---
title: 我的第一篇文章
description: 这里填写文章摘要，用于列表、搜索和分享。
pubDatetime: 2026-10-19T09:00:00+08:00
tags:
  - 随笔
featured: false
draft: false
ogImage: /images/my-first-post/cover.webp
---

这里是正文。

## 记录

![图片说明](/images/my-first-post/photo.webp)
```

`title`、`description`、`pubDatetime` 必填。`modDatetime` 可记录修改时间；`tags`、`featured`、`draft`、`ogImage` 可选。没有封面时删除整个 `ogImage` 字段，沿用站点的分享图策略。日期必须包含时区，推荐 `+08:00`。支持 `.md`，不支持 `.mdx`；普通项目 README 可以省略 frontmatter，标题取首个一级标题，摘要取正文首段。其他 `.markdown` 文件先改为 `.md`。

`draft: true` 和未来日期的文章不会出现在网站，包括本地预览。私密草稿请保存在仓库外；源码仓库若公开，提交的草稿正文和图片仍可在 GitHub 阅读。检查器也会检查已提交草稿的图片。以下划线开头的文件或目录不会作为内容发布；旧 `_published/` 目录明确排除，不会自动加载。

### 放置图片

把上例两张图片实际放入：

```text
public/images/my-first-post/cover.webp
public/images/my-first-post/photo.webp
```

正文和封面使用 `/images/my-first-post/...`，路径中不写 `public`。封面 `ogImage` 使用站点根路径或完整 HTTPS URL；正文也支持相对于 Markdown 文件的图片，由 Astro 处理。推荐统一使用 `public/images/`，方便迁移与检查。

图片必须随文章一起提交，文件名大小写必须完全相同。新流程不会自动压缩、转换格式或移除 EXIF；可在本地导出合适尺寸的 WebP/JPEG/PNG 后提交。替换图片时推荐新文件名，避免浏览器缓存旧图。外部 README 的相对图片路径需对应复制图片或改写。

不要再使用 `/media/...`、`/uploads/...` 或 `_published/`，这些属于旧导出流程。`public/uploads/` 仍被 Git 忽略，防止旧生成文件被意外提交；新图片必须放到 `public/images/`。

## 3. 本地检查与预览

```sh
npm run content:check
npm run lint
npm test
npm run build
npm run preview
```

`npm run build` 自带图片检查、Astro 类型检查、静态构建和 Pagefind 索引。`content:check` 会报告具体 Markdown 文件和图片路径，包括封面、正文、引用式图片，以及带引号的 HTML `<img src>`。外链只检查用法，不验证远程图片可用性。检查中英文文章入口、图片、搜索和手机布局后再推送。

预览地址通常为 `http://localhost:4321`；若开发服务占用端口，按终端显示地址访问，或先停止开发服务。只有构建成功才有最新预览。`dist/`、`.astro/`、`public/pagefind/` 为生成目录，不提交。受限环境可在 PowerShell 执行 `$env:ASTRO_TELEMETRY_DISABLED="1"` 后构建。

## 4. 推送 GitHub 并发布到 VPS

完成下方一次性服务器配置后，每次发文在 PowerShell 执行：

```powershell
# 开始写作前，先确认工作区干净，再同步 main
git switch main
git pull --ff-only origin main

# 在编辑器中写文章、复制图片，并完成第 3 节检查
git add src/content/posts/my-first-post.md public/images/my-first-post/
git diff --cached --stat
git diff --cached -- src/content/posts/my-first-post.md
git commit -m "content: add my first post"
git push origin main
```

推送后打开 [源码仓库 Actions](https://github.com/w1nterdec/my-blog/actions)，查看 **Validate and deploy blog**：

1. `validate` 安装依赖，运行 lint、测试、图片检查和构建，保存构建产物。
2. `deploy` 下载同一次构建产物，上传到 VPS 的 `/var/www/astro-blog/releases/source-<run_id>-<run_attempt>/`。
3. 校验产物后原子切换 `current` 链接，检查 HTTPS 首页和 `/release.txt` 是否确实属于新版本。失败自动恢复旧链接，任务显示失败。

只有 `main` 的 push，或在 Actions 选择 `main` 手动运行，才部署生产。PR 和 `codex/annual-2026` 分支只验证；分支上的文章需合并到 `main` 后才上线。构建失败不会上传；上传失败不会切换旧网站。同一分支的发布串行执行。

完成后访问 [网站](https://chenzhixing.bbroot.com/) 和新文章。`https://chenzhixing.bbroot.com/release.txt` 应显示本次 Actions 对应的 `source-<run_id>-<run_attempt>`。GitHub 已收到提交不等于已部署，必须确认 `validate` 和 `deploy` 都成功。

**修改、撤回与定时文章：** 编辑原文件后重新检查、提交和 push；撤回可改 `draft: true` 或删除文件后 push。未来文章只在构建时判断时间，新流程没有定时发布任务；到达时间后在 Actions 选择 `main` 手动运行，或再次 push 触发构建。本地 `npm run build` 只生成产物，不会上传。

## 5. 一次性迁移：停用旧发布和后台

顺序执行，防止两个仓库同时覆盖网站：

1. 备份旧内容仓库 `w1nterdec/my-blog-content`，保留 Markdown、`media/` 原图与 Git 历史。在其 Actions 页面禁用 **Publish private editorial content**，并取消仍在等待或运行的发布任务。仅取消某次任务不等于关闭定时发布。旧加密备份工作流可保留，但不能代替新源码仓库的备份。
2. 已将提交 `57655013fccbf5606f4088d28be6c0235e4542ef` 对应的文章 `hello-w1nter.md` 迁入本仓库，并更新为当前本地写作、GitHub Actions 与 VPS 发布架构；首篇文章的排版样式集中在 `src/styles/site.css` 的 `first-post-*` 规则中。其他需要发布的文章从旧仓库 `posts/` 复制到 `src/content/posts/`；`projects/` 同理复制到 `src/content/projects/`。保留原文件名与层级，减少 URL 变化；不要把旧私密草稿批量复制到公开仓库。
3. 将引用的 `media/` 原图或确实存在的旧 WebP 复制到 `public/images/<slug>/`，改写正文与 `ogImage`。**只有哈希文件名无法还原图片**；若缺少 `7d7d99a489b4d7117f769fcd.webp`，从原图重新导出，或删除该引用/封面字段，不能创建空图片来绕过构建。
4. 如需同步更新过的资料，将旧 `settings/journal.json` 的 `personal`、`places` 核对后写入 `src/data/journal.json`。不再读取 `src/data/generated/`。头像放在 `public/` 内，`personal.avatar` 使用该目录下的路径，例如 `avatar.webp`。
5. 完成下一节的 VPS 设置及源码仓库 Secrets，然后将改动合并到 `main`，确认新工作流首次部署成功。
6. 确认 `/admin/`、`/api/admin/health` 均返回 404、`zhixing-admin.service` 已停用，再到 GitHub 撤销旧 OAuth App 授权与不再使用的令牌。旧服务目录和凭据不由脚本删除，可离线备份后自行清理。

本地代码修改不会自动禁用另一个仓库的 Actions，也不会自动修改线上 Nginx；这些一次性操作需在对应 GitHub 仓库和 VPS 执行。

## 6. VPS 与 GitHub Actions 配置（仅首次）

以下针对当前域名 `chenzhixing.bbroot.com` 和 Debian/Ubuntu VPS；域名 DNS 应已指向 VPS，80/443 端口可访问。若更换域名，同时修改 `astro-paper.config.ts`、`infrastructure/nginx-vps.conf`、`setup-server.sh` 和两个 release 脚本中的域名。

### VPS 初始化或从旧后台迁移

准备普通部署账号，例如 `deploy`，将 Actions 使用的 SSH 公钥加入其 `~/.ssh/authorized_keys`（目录 700、文件 600）。该账号执行日常发布无需 sudo。第一次创建账号可由管理员执行 `sudo adduser --disabled-password --gecos "" deploy`；已有账号可直接复用。

将本仓库的完整 `infrastructure/` 目录上传到 VPS。在本地 PowerShell 执行，按实际地址、SSH 端口和账号替换：

```powershell
scp -P 22 -r infrastructure deploy@YOUR_VPS_HOST:/home/deploy/blog-infrastructure
ssh -p 22 deploy@YOUR_VPS_HOST
```

然后由有 sudo 权限的管理员在 VPS 执行；新建的 `deploy` 默认没有 sudo，需要使用管理员登录或由其运行：

```sh
sudo bash /home/deploy/blog-infrastructure/setup-server.sh deploy
sudo nginx -t
readlink /var/www/astro-blog/current
sudo systemctl is-active zhixing-admin.service
```

最后一条在迁移后应为 `inactive`，全新服务器也可能显示服务不存在。脚本安装 Nginx、rsync、curl、Python、Certbot 与文件锁工具，保留现有页面和 release 目录；将旧 Nginx 配置备份到 `/var/backups/zhixing/<时间>/`。首次安装先提供占位首页，等待 Actions 发布。

脚本使用静态 Nginx 配置并申请/接入 HTTPS、启用证书续期，关闭后台路由和旧 OAuth 服务，将统计任务迁到 `/opt/zhixing-stats/`。VPS 不再需要 Node.js。当前站点使用 `/etc/nginx/sites-available/astro-blog`；若现有站点定义在其他文件，先由管理员处理重复的 `server_name`，避免请求落到旧配置。已有 Certbot HTTPS 配置会由初始化脚本重建，建议在维护窗口执行；备份路径会输出到终端。

### 在源码仓库配置 Secrets

在 **w1nterdec/my-blog → Settings → Secrets and variables → Actions → Repository secrets** 配置：

- `ECS_HOST`：VPS 地址或主机名，不含 `https://`。
- `ECS_USER`：部署用户，例如 `deploy`。
- `ECS_PORT`：SSH 端口，可省略，默认 `22`。
- `ECS_SSH_KEY`：对应上述公钥的完整私钥，需可供无人值守 SSH 登录。
- `ECS_KNOWN_HOSTS`：经过核验的服务器 SSH 主机公钥记录，使用 OpenSSH `known_hosts` 格式。

旧私有内容仓库里的 Secrets 不会自动共享给本源码仓库，需要在这里重新配置。不再需要 `CONTENT_DIR`、`SOURCE_REF`、`ALLOW_PRODUCTION` 或 OAuth 凭据。

可以在本地使用 `ssh-keyscan -p 22 YOUR_VPS_HOST` 获取候选记录，用 `ssh-keygen -lf <记录文件>` 查看指纹；通过 VPS 控制台运行 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`，核对对应公钥指纹一致后，把记录存入 `ECS_KNOWN_HOSTS`。非 22 端口的记录应包含 `[主机]:端口`，记录中的主机名需与 `ECS_HOST` 一致。主机密钥更换后核验并更新该 Secret。

初始化完成后推送 `main`，或在 Actions 中手动运行 `main`。若有分支保护，按仓库规则走 PR 合并。不要提交 SSH 私钥、`.env`、旧私有仓库或备份密钥。

## 7. 排错

### `[ImageNotFound] Could not find requested image /uploads/...`

提供的失败记录包括提交 `57655013fccbf5606f4088d28be6c0235e4542ef` 和旧发布 [run 39140934534](https://github.com/w1nterdec/my-blog-content/actions/runs/39140934534)，错误引用 `/uploads/7d7d99a489b4d7117f769fcd.webp`。旧流程将图片生成到忽略目录，且文章封面的 `image().or(z.string())` 会先走 Astro 图片导入，不能把 `public/` URL 可靠地当作字符串兜底。新流程封面按 URL 处理，构建前检查本地图片。

排查顺序：确认文件确实位于 `public/images/` → 改正正文及封面路径 → 检查大小写 → 确认 Git 已跟踪图片 → 重新构建和提交。例如：

```sh
git status --short
git check-ignore -v public/images/my-first-post/cover.webp
git ls-files --error-unmatch public/images/my-first-post/cover.webp
npm run content:check
npm run build
```

`git check-ignore` 对新图片应无输出并返回 1；`git ls-files` 应打印图片路径，未跟踪时先 `git add`。不要把本地存在但被忽略的文件当成 CI 已有文件。

### Actions 成功但页面没变

确认查看的是源码仓库的新工作流，且 `deploy` 成功而不是 skipped。确认 push 到 `main`；检查 `/release.txt`，再刷新浏览器。若标记正确但图片仍旧，改用新文件名。仍被旧页面覆盖时，确认旧私有仓库的发布工作流已禁用且运行任务已取消。

### SSH / rsync / HTTPS 失败

- `Missing Actions secret`：在源码仓库补齐该 Secret。
- `Host key verification failed`：核验主机指纹、主机名和 SSH 端口后更新 `ECS_KNOWN_HOSTS`。
- `Permission denied (publickey)`：核对账号、私钥、公钥及 `.ssh` 权限。
- 上传目录无权限：检查 `/var/www/astro-blog`、`releases/` 归属部署用户；`current` 必须为符号链接。按第 6 节初始化。
- `rsync: command not found`：VPS 安装 `rsync`。
- 健康检查失败：检查证书、Nginx 的 `root` 是否为 `/var/www/astro-blog/current`，以及本机 HTTPS 回环请求。失败会恢复旧版本，不应直接删除旧 release。

### 文章没有出现 / 修改后搜索还是旧内容

检查 `draft`、带时区的 `pubDatetime` 及文件/目录名是否以下划线开头。未来文章需在到期后重新构建部署。搜索索引跟随构建，确认 Actions 使用最新提交，不能只改服务器 HTML 或只运行开发服务。

## 8. 回滚与备份

自动健康检查失败会恢复旧链接。需要手动回滚时，先暂停本源码仓库工作流并取消活动部署，然后在 VPS 用部署账号执行：

```sh
cat /var/www/astro-blog/.previous-release
bash /home/deploy/blog-infrastructure/rollback-release.sh
readlink /var/www/astro-blog/current
```

脚本校验上一版本路径、加发布锁并执行 HTTPS 检查，失败会恢复回滚前的链接。首次部署前可能没有 `.previous-release`。回滚后还应本地撤回出错提交（如 `git revert <提交>`），完成检查并 push，再恢复工作流，防止下次发布带回问题。清理旧版本时保留 `current` 和 `.previous-release` 指向的目录。

GitHub 保留每次构建产物 7 天，VPS 保留已上传 release，未自动清理。文章、图片及 Git 历史仍需独立备份；旧私有内容备份不会覆盖新仓库中的新文章。建议另存原图，并定期核对 Actions 失败通知、磁盘空间和 Certbot 续期。`infrastructure/log-stats.py` 只汇总年度页面请求数，含机器人，不代表独立访客；公开统计不包含原始 IP 或用户代理。

## 9. 页面维护与 Docker

站点名称、域名、社交链接、功能开关、每页数量和运行起始日期在 `astro-paper.config.ts`；配色、布局和旅行地图见 `src/styles/theme.css`、`site.css`、`globe.css`。导航栏小黑仅保留待机与行走。摄影、音乐、歌词、碎碎念、游戏、孤岛及仓鼠页面已移除。

本地也可使用 `docker compose up` 开发。`docker build -t my-blog .` 构建静态 Nginx 镜像；生产发布默认使用上文的 VPS Nginx 与 Actions 流程。
