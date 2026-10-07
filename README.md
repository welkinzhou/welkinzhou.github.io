## Welkin 的个人博客

一名全栈工程师的学习笔记网站，偶尔也有些其他的随笔。

网站使用 [Docusaurus](https://docusaurus.io/), 一个基于 React 的静态网站生成器构建。

### 开发与验证

使用 Node.js 20 或更新版本（GitHub Actions 使用 Node.js 24）：

```sh
npm ci
npm start
```

发布前运行类型检查与生产构建：

```sh
npm run typecheck
npm run build
npm run serve
```

### 首页与博客

- 首页位于 `/`，分为背景与 slogan、最近文章、学习笔记、关于。
- 博客列表位于 `/blog`。原来的文章、标签、归档和分页地址在生产构建时生成静态重定向；重定向保留查询参数与锚点。`npm run build` 完成后还会保留根目录的 `rss.xml`、`atom.xml`，兼容已有订阅。
- `plugins/homepage-content.ts` 使用博客插件的真实元数据，自动选取最近三篇公开文章和常用主题；草稿和未列出文章不会进入首页。
- 全局配色、导航和阅读排版在 `src/css/custom.css`；首页使用 `src/pages/index.module.css`，博客列表使用独立的主题覆盖组件，文章内容与文档仍由 Docusaurus 渲染。

### 背景图片

当前首页选用自己的 `static/img/background/summer.jpeg`，雪景原图保留。首页只加载压缩后的 WebP，原始 JPEG 不会随首页请求下载：

- 桌面：`summer-1600.webp`，宽 1600px，约 102 KB。
- 手机：`summer-800.webp`，宽 800px，约 37 KB。

使用 `srcSet` 与 `sizes` 自动选择合适分辨率。替换图片时保留两个尺寸并更新首页路径；默认裁切位置为桌面 `center 58%`、手机 `45% center`，可在首页 CSS 中调整。

背景高度约为 61svh，有上下限，保证首屏能露出文章。背景随页面正常滚走，slogan、说明和操作入口停留在首屏位置，前半段保持较高透明度，接近文章面板时再加深淡出；文章面板距离操作区下方约 20px 时完全隐藏并退出键盘焦点顺序。系统开启减少动态效果时使用普通滚动并停用渐隐。项目不依赖在线字体和第三方背景图片。

`preview/homepage/` 保留最初的独立 HTML 设计稿；正式页面以 `src/` 和生产构建为准。
