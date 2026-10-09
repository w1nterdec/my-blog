# 知行博客：个人小站维护

## 近况、项目与城市

编辑 `src/data/personal.ts`：

- `personal`：头像、签名、现居地、近期状态和项目。
- `places`：城市名称、经纬度（经度在前）、居住身份、旅行身份和城市故事。未提供的日期不显示。
- `photos`：摄影作品数据。

首页侧栏与关于页共用这些数据。`public/avatar.webp` 是本轮从公开 GitHub 头像获取的本地版本，不会在访问时请求 GitHub。

## 摄影集「映」

照片放到 `public/photos/`，然后在 `photos` 中添加：

```ts
{
  src: "photos/portrait-01.webp",
  alt: "描述画面内容，供屏幕阅读器使用",
  title: "照片标题",
  category: "人像", // 或 "猫犬"
  location: "武汉", // 可省略
}
```

空摄影集显示明确标注的 GitHub 头像临时封面。加入真实作品后，首页取第一张作为封面，接下来最多三张用于预览；摄影页自动显示分类、作品网格和大图浏览。

建议先压缩照片，保留原始比例，不需要修改界面组件。城市与作品说明只填写希望公开的信息。

## 配色与布局

- `src/styles/theme.css`：浅色、深色、地球仪颜色。
- `src/styles/site.css`：双栏、侧栏、摄影、地球仪、移动端与动效。
- 主题菜单提供浅色、深色和跟随系统，手动选择会保存；减少动态效果设置会关闭进入动画和地球仪自动旋转。
- `public/default-og.svg`：默认分享图的可编辑源文件，实际分享使用 `default-og.jpg`。
- 地图来源与数据处理说明见 `public/maps/README.md`。

## 本地检查

```sh
npm run lint
npm run build
npm run preview
```

文章为空时 Astro 会提示空内容集合，属于当前状态。真实照片、首篇文章、提交和部署均未由本轮美化代为完成。
