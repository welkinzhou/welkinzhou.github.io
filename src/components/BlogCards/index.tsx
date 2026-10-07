import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import type { PostSummary } from "./types";
import styles from "./styles.module.css";

export function Arrow(): React.JSX.Element {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.arrow}><path d="M5 12h14m-5-5 5 5-5 5" /></svg>;
}

export function PostMeta({ post }: { post: PostSummary }): React.JSX.Element {
  return <div className={styles.meta}>
    <time dateTime={post.date}>{post.date.slice(0, 10).replaceAll("-", ".")}</time>
    {post.tags[0] && <span className={styles.category}>{post.tags[0].label}</span>}
    {post.readingTime !== undefined && <span>约 {Math.max(1, Math.ceil(post.readingTime))} 分钟</span>}
  </div>;
}

export default function BlogCard({ post, variant = "article" }: {
  post: PostSummary;
  variant?: "featured" | "compact" | "article";
}): React.JSX.Element {
  return <Link to={post.permalink} className={clsx(styles.card, styles[variant])}>
    {variant !== "compact" && <PostMeta post={post} />}
    <Heading as={variant === "article" ? "h2" : "h3"}>{post.title}</Heading>
    {variant === "compact" ? <PostMeta post={post} /> : <>
      <p className={styles.description}>{post.description}</p>
      <div className={styles.bottom}>
        <span>{variant === "featured" ? post.tags.slice(0, 3).map((tag) => tag.label).join(" / ") : "继续阅读"}</span>
        <Arrow />
      </div>
    </>}
  </Link>;
}
