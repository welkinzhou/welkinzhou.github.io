import React from "react";
import Link from "@docusaurus/Link";
import { usePluginData } from "@docusaurus/useGlobalData";
import { HtmlClassNameProvider, ThemeClassNames } from "@docusaurus/theme-common";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import BlogListPaginator from "@theme/BlogListPaginator";
import BlogListPageStructuredData from "@theme/BlogListPage/StructuredData";
import type { Props } from "@theme/BlogListPage";
import BlogCard from "@site/src/components/BlogCards";
import type { HomepageContent } from "@site/src/components/BlogCards/types";
import styles from "./styles.module.css";

// Customize only the list layout; preserve Docusaurus pagination, metadata,
// structured data and canonical post/tag URLs. Post rendering stays original.
export default function BlogListPage(props: Props): React.JSX.Element {
  const { metadata, items } = props;
  const { topics } = usePluginData("welkin-homepage-content") as HomepageContent;
  const title = metadata.page > 1 ? `${metadata.blogTitle} · 第 ${metadata.page} 页` : metadata.blogTitle;
  return <HtmlClassNameProvider className={`${ThemeClassNames.wrapper.blogPages} ${ThemeClassNames.page.blogListPage}`}>
    <Layout title={title} description={metadata.blogDescription}>
      <BlogListPageStructuredData {...props} />
      <main className={styles.page}>
        <header className={styles.heading}><Heading as="h1">{metadata.blogTitle}</Heading><p>{metadata.blogDescription}</p></header>
        <div className={styles.layout}>
          <div><section className={styles.posts} aria-label="博客文章">{items.map(({ content }) => <BlogCard key={content.metadata.permalink} post={content.metadata} />)}</section><div className={styles.paginator}><BlogListPaginator metadata={metadata} /></div></div>
          <aside className={styles.sidebar}>
            <Heading as="h2">按主题阅读</Heading>
            <nav aria-label="博客主题" className={styles.topics}>
              <Link to="/blog" className={styles.active}>全部文章 <span>{metadata.totalCount}</span></Link>
              {topics.map((topic) => <Link key={topic.permalink} to={topic.permalink}>{topic.label} <span>{topic.count}</span></Link>)}
              <Link to="/blog/tags">所有主题</Link><Link to="/blog/archive">按时间归档</Link>
            </nav>
            <p className={styles.quote}>记录，<br />若干年回首<br />也会惊喜吧。</p>
          </aside>
        </div>
      </main>
    </Layout>
  </HtmlClassNameProvider>;
}
