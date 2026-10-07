import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import homepageContent from "./plugins/homepage-content";

const config: Config = {
  title: "Welkin blog",
  tagline: "记录，若干年回首也会惊喜吧",
  favicon: "img/ava.png",

  // Set the production url of your site here
  url: "https://welkinzhou.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  deploymentBranch: "gh-pages",
  organizationName: "welkinzhou", // Usually your GitHub org/user name.
  projectName: "welkinzhou.github.io", // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: "throw",
  onDuplicateRoutes: "throw",
  markdown: {
    mermaid: true,
    hooks: { onBrokenMarkdownLinks: "warn" },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "zh-Hans",
    locales: ["zh-Hans"],
  },
  themes: ["@docusaurus/theme-live-codeblock", "@docusaurus/theme-mermaid"],
  plugins: [
    homepageContent,
    [
      "@docusaurus/plugin-client-redirects",
      {
        // GitHub Pages has no server redirect rules. Generate static redirect
        // pages for every old post, tag, author, archive and paginated list URL.
        createRedirects(existingPath: string) {
          if (existingPath.startsWith("/blog/")) {
            return [existingPath.slice("/blog".length)];
          }
          return undefined;
        },
      },
    ],
  ],
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          routeBasePath: "/blog",
          blogTitle: "写过的，想过的。",
          blogDescription: "关于技术、实践，以及一路走来的思考。",
          blogSidebarTitle: "最近文章",
          postsPerPage: 8,
          showReadingTime: true,
          readingTime: ({ content, locale, frontMatter, defaultReadingTime }) =>
            defaultReadingTime({
              content,
              locale,
              options: { wordsPerMinute: 300 },
            }),
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/background/summer-1600.webp",
    colorMode: { defaultMode: "light", respectPrefersColorScheme: true },
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: "Welkin.",
      logo: {
        alt: "Welkin 的头像",
        src: "img/ava.png",
      },
      items: [
        { to: "/", label: "首页", position: "right", activeBaseRegex: "^/$" },
        { to: "/blog", label: "博客", position: "right" },
        {
          label: "学习笔记",
          position: "right",
          items: [
            {
              label: "Python",
              to: "/docs/python/intro",
            },
            {
              label: "LangChain",
              to: "/docs/langchain/intro",
            },
            {
              label: "Vue",
              to: "/docs/vue/intro",
            },
          ],
        },
        { href: "/#about", label: "关于", position: "right" },
        { href: "https://github.com/welkinzhou", label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "学习笔记",
          items: [
            {
              label: "Python",
              to: "/docs/python/intro",
            },
            {
              label: "LangChain",
              to: "/docs/langchain/intro",
            },
            {
              label: "Vue",
              to: "/docs/vue/intro",
            },
          ],
        },
        {
          title: "这个小站",
          items: [
            { label: "全部文章", to: "/blog" },
            { label: "文章归档", to: "/blog/archive" },
            {
              label: "GitHub 代码",
              href: "https://github.com/welkinzhou/welkinzhou.github.io",
            },
          ],
        },
        {
          title: "在别处",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/welkinzhou",
            },
            {
              label: "掘金",
              href: "https://juejin.cn/user/1702497163682365",
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Welkin · 记录与思考 · Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "python"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
