# 知行博客项目工作流

本文说明如何在现有 Astro 项目中编写页面和文章、在本地验证，以及提交后自动部署到服务器。项目架构保持不变。

## 项目结构

```text
src/pages/                    页面目录，文件路径对应网站 URL
  index.astro                 首页，对应 /
  blog/<文章名>.md            Markdown 博客文章
public/                       原样复制到网站根目录的静态资源
astro.config.mjs              Astro 站点域名配置
.github/workflows/deploy.yml  main 分支推送后的自动部署流程
```

当前首页是部署验证页，页面上带有 `DEPLOY-TEST-20261001` 标记。恢复正式博客首页时，编辑 `src/pages/index.astro` 并移除该测试内容。

## 创建或修改博客文章

1. 在 `src/pages/blog/` 下新建 Markdown 文件，例如 `first-post.md`。目录不存在时先创建目录。
2. 用 frontmatter 编写标题、摘要和日期，再编写 Markdown 正文：

   ```markdown
   ---
   title: 我的第一篇文章
   description: 文章摘要
   pubDate: 2026-10-01
   ---

   ## 正文标题

   在这里编写文章内容。
   ```

3. 文件名就是 URL 的一部分。例如 `src/pages/blog/first-post.md` 对应 `/blog/first-post/`。
4. 修改文章时直接编辑对应的 `.md` 文件；修改首页时编辑 `src/pages/index.astro`。
5. 图片等静态文件放入 `public/`，例如 `public/images/photo.jpg`，页面中使用 `/images/photo.jpg` 引用。

## 本地预览和构建

需要安装 Node.js 22 和 npm。首次拉取项目或依赖锁文件变更后，在项目根目录运行：

```sh
npm ci
npm run dev
```

开发服务器启动后，按终端提示打开本地地址。提交前运行正式构建：

```sh
npm run build
npm run preview
```

`npm run build` 应成功并生成 `dist/`。`npm run preview` 用于本地预览构建产物。当前 `npm test` 是未配置测试的占位命令，会返回失败，不要把它当作项目测试结果。

## 提交和自动部署

部署工作流只监听 `main` 分支的 `push`。推送到 `main` 会自动构建和部署；同一分支的部署会串行执行。

1. 查看修改并确认只包含本次要提交的文件：

   ```sh
   git status --short
   git diff
   ```

2. 本地构建成功后，暂存文章或页面文件并提交：

   ```sh
   git add src/pages/blog/first-post.md
   git commit -m "content: add first post"
   ```

   修改首页时，将暂存路径换为 `src/pages/index.astro`。不要把密钥、`.env`、`node_modules/` 或本地缓存提交到仓库。

3. 推送到部署分支：

   ```sh
   git push origin main
   ```

4. 在 GitHub 仓库的 **Actions** 页面打开最新的 `Deploy Astro to VPS` 运行，确认 `Build Astro`、`Upload dist to VPS` 和 `Fix permissions` 均成功。
5. 工作流使用 GitHub Actions Secrets `ECS_HOST`、`ECS_USER`、`ECS_SSH_KEY` 和 `ECS_PORT` 连接服务器；这些值只在仓库设置中配置，不写入代码。
6. 构建产物 `dist/` 会上传至服务器 `/var/www/astro-blog`。部署成功后访问网站检查文章或页面；必要时执行强制刷新，或在 URL 后添加查询参数排除浏览器缓存。

## 页面仍未更新时

按顺序核对：

1. Actions 最新运行的提交 SHA 是否与刚推送的提交一致，运行结果是否为成功。
2. 部署服务器上的 `/var/www/astro-blog/index.html` 是否为本次构建生成的内容。
3. 服务器上对应域名的 Nginx 虚拟主机 `root` 是否指向 `/var/www/astro-blog`。工作流上传成功不代表 Web 服务器一定从该目录提供页面。
4. 分别检查 `http://` 和 `https://`，以及 CDN、反向代理或 DNS 是否将请求转发到同一台服务器和站点目录。

## 修改站点域名

站点域名配置位于 `astro.config.mjs` 的 `site` 字段。修改域名后还需确认服务器上的域名解析、HTTPS 证书和 Web 服务器虚拟主机配置与之匹配。