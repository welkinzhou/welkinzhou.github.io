import React, { useEffect, useRef } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { usePluginData } from "@docusaurus/useGlobalData";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import BlogCard, { Arrow } from "@site/src/components/BlogCards";
import type { HomepageContent } from "@site/src/components/BlogCards/types";
import styles from "./index.module.css";

function HomepageHero({ contentRef }: { contentRef: React.RefObject<HTMLDivElement> }): React.JSX.Element {
  const heroRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const desktopImage = useBaseUrl("/img/background/summer-1600.webp");
  const mobileImage = useBaseUrl("/img/background/summer-800.webp");
  const { siteConfig } = useDocusaurusContext();

  useEffect(() => {
    const hero = heroRef.current;
    const copy = copyRef.current;
    const links = linksRef.current;
    const content = contentRef.current;
    if (!hero || !copy || !links || !content) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fadeDistance = 1;
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const progress = reducedMotion.matches ? 0 : Math.min(1, Math.max(0, window.scrollY / fadeDistance));
      // Retain more opacity early in the scroll, then fade near the article panel.
      const eased = progress * progress * progress;
      copy.style.setProperty("--hero-opacity", String(1 - eased));
      copy.inert = progress === 1;
    };
    const schedule = () => { if (frame === null) frame = window.requestAnimationFrame(update); };
    const measure = () => {
      // Measure the normal-flow position even when restoring an already scrolled page.
      copy.style.removeProperty("--hero-pin-top");
      const top = copy.getBoundingClientRect().top + window.scrollY;
      const gap = content.getBoundingClientRect().top - links.getBoundingClientRect().bottom;
      // Finish fading when the article panel is 20px below the pinned controls.
      fadeDistance = Math.max(1, gap - 20);
      copy.style.setProperty("--hero-pin-top", `${top}px`);
      schedule();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    observer.observe(copy);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    reducedMotion.addEventListener("change", measure);
    measure();
    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      reducedMotion.removeEventListener("change", measure);
    };
  }, [contentRef]);

  return <section className={styles.hero} ref={heroRef} aria-labelledby="homepage-slogan">
    <img className={styles.heroImage} src={desktopImage} srcSet={`${mobileImage} 800w, ${desktopImage} 1600w`} sizes="100vw" alt="" width="1600" height="1067" loading="eager" />
    <div className={styles.heroInner}><div className={styles.heroCopy} ref={copyRef}>
      <h1 id="homepage-slogan">经验日省，<br />智慧日增。</h1>
      <p>{siteConfig.tagline}。</p>
      <div className={styles.heroLinks} ref={linksRef}>
        <Link className={styles.readButton} to="/blog">读一篇博客 <Arrow /></Link>
        <a className={styles.scrollLink} href="#recent">向下看看 <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14m-5-5 5 5 5-5" /></svg></a>
      </div>
    </div></div>
  </section>;
}

function NoteIcon({ kind }: { kind: "python" | "langchain" | "vue" }): React.JSX.Element {
  return <svg aria-hidden="true" viewBox="0 0 24 24">
    {kind === "python" && <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14" />}
    {kind === "langchain" && <><circle cx="5" cy="12" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><path d="m7 11 9-5M7 13l9 5" /></>}
    {kind === "vue" && <path d="m3 5 9 15 9-15h-5l-4 7-4-7Z" />}
  </svg>;
}

const notes = [
  { kind: "python", title: "Python", description: "从基础类型与常用 API，到标准库、算法练习与日常工程。", to: "/docs/python/intro" },
  { kind: "langchain", title: "LangChain", description: "沿着 RAG 实例，从 Node、Workflow 走到 Agent Graph。", to: "/docs/langchain/intro" },
  { kind: "vue", title: "Vue", description: "从框架的使用走向源码，理解响应式与渲染的过程。", to: "/docs/vue/intro" },
] as const;

export default function Home(): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null);
  const { recentPosts, topics } = usePluginData("welkin-homepage-content") as HomepageContent;
  const avatar = useBaseUrl("/img/ava.png");
  return <Layout title="首页" description="Welkin 的个人博客，记录一名全栈工程师的技术实践与学习思考。">
    <main className={styles.home}>
      <HomepageHero contentRef={contentRef} />
      <div className={styles.content} ref={contentRef}>
        <section className={styles.floatingPanel} aria-labelledby="recent">
          <div className={styles.sectionHeading}><div><Heading as="h2" id="recent">最近在写</Heading><p>开发中的尝试，学习时的思考。</p></div><Link className={styles.textLink} to="/blog">全部文章 <Arrow /></Link></div>
          <div className={styles.contentGrid}>
            <div>{recentPosts.map((post, index) => <BlogCard key={post.permalink} post={post} variant={index === 0 ? "featured" : "compact"} />)}</div>
            <aside className={styles.homeSidebar}>
              <div className={styles.sideIntro}><Heading as="h3">你好，我是 Welkin。</Heading><p>一名全栈工程师。<br />这里收集学习笔记、开发实践，<br />也留一点空间给日常的想法。</p></div>
              <p className={styles.sideTitle}>顺着兴趣阅读</p>
              <div className={styles.topicLinks}>{topics.map((topic) => <Link key={topic.permalink} to={topic.permalink}>{topic.label}</Link>)}</div>
              <p className={styles.sideNote}>持续学习，偶尔写作。</p>
            </aside>
          </div>
        </section>
        <section className={styles.notesSection} aria-labelledby="notes">
          <div className={styles.sectionHeading}><div><Heading as="h2" id="notes">把知识慢慢串起来</Heading><p>系统整理过的内容，放在这里。</p></div></div>
          <div className={styles.noteGrid}>{notes.map((note) => <article className={styles.noteEntry} key={note.kind}>
            <div className={styles.noteIcon}><NoteIcon kind={note.kind} /></div>
            <Heading as="h3">{note.title}</Heading><p>{note.description}</p>
            <Link className={styles.textLink} to={note.to}>翻开笔记 <Arrow /></Link>
          </article>)}</div>
        </section>
        <section className={styles.about} aria-labelledby="about">
          <img src={avatar} alt="Welkin 的头像" width="64" height="64" loading="lazy" />
          <div><Heading as="h2" id="about">留下一点思考的痕迹。</Heading><p>写作是整理知识的方式，也是和未来的自己对话。这个小站记录一名全栈工程师的学习与探索。</p></div>
          <Link className={styles.textLink} href="https://juejin.cn/user/1702497163682365">在掘金找到我 <Arrow /></Link>
        </section>
      </div>
    </main>
  </Layout>;
}
