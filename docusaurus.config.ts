import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Welkin blog',
  tagline: '记录，若干年回首也会惊喜吧',
  favicon: 'img/ava.png',

  // Set the production url of your site here
  url: 'https://welkinzhou.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  deploymentBranch: 'gh-pages',
  organizationName: 'welkinzhou', // Usually your GitHub org/user name.
  projectName: 'welkinzhou.github.io', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },
  themes: ['@docusaurus/theme-live-codeblock'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          routeBasePath: '/',
          showReadingTime: true,
          readingTime: ({ content, frontMatter, defaultReadingTime }) =>
            defaultReadingTime({ content, options: { wordsPerMinute: 300 } }),
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    docs: {
      sidebar: {
        hideable: true,
      },
    },
    navbar: {
      title: '经验日省，智慧日增',
      logo: {
        alt: 'My Site Logo',
        src: 'img/ava.png',
      },
      items: [
        {
          label: "学习",
          position: "right",
          items: [
            {
              label: "前端基础",
              to: "docs/basic/intro",
            },
            {
              label: "Vue",
              to: "docs/vue/intro",
            },
            {
              label: "React",
              to: "docs/react/intro",
            },
          ],
        },
        { to: '/', label: 'Blog', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '学习笔记',
          items: [
            {
              label: '前端基础',
              to: 'docs/basic/intro',
            },
            {
              label: "Vue",
              to: "docs/vue/intro",
            },
            {
              label: "React",
              to: "docs/react/intro",
            },
          ],
        },
        {
          title: '网址源代码',
          items: [
            {
              label: 'GitHub 代码',
              href: 'https://github.com/welkinzhou/welkinzhou.github.io',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/welkinzhou',
            },
            {
              label: '掘金',
              href: 'https://juejin.cn/user/1702497163682365',
            }
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Welkin, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['Bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
