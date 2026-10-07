import type { Plugin } from "@docusaurus/types";
import type { BlogTag, PostSummary } from "../src/components/BlogCards/types";

type LoadedBlog = {
  blogPosts: {
    metadata: Omit<PostSummary, "date"> & {
      date: Date;
      unlisted: boolean;
      frontMatter: { draft?: boolean };
    };
  }[];
  blogTags: Record<string, BlogTag & { items: string[]; unlisted: boolean }>;
};

// Reuse the blog plugin's parsed metadata, including its canonical permalinks.
// Keep global data small: three summaries and six topic links, never MDX bodies.
export default function homepageContent(): Plugin {
  return {
    name: "welkin-homepage-content",
    allContentLoaded({ allContent, actions }) {
      const blog = allContent["docusaurus-plugin-content-blog"]?.default as LoadedBlog | undefined;
      if (!blog) throw new Error("Homepage requires the default Docusaurus blog plugin.");

      const posts = blog.blogPosts
        .filter(({ metadata }) => !metadata.unlisted && !metadata.frontMatter.draft)
        .sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());

      actions.setGlobalData({
        recentPosts: posts.slice(0, 3).map(({ metadata }) => ({
          title: metadata.title,
          permalink: metadata.permalink,
          description: metadata.description,
          date: new Date(metadata.date).toISOString(),
          readingTime: metadata.readingTime,
          tags: metadata.tags,
        })),
        topics: Object.values(blog.blogTags)
          .filter((tag) => !tag.unlisted)
          .sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label))
          .slice(0, 6)
          .map(({ label, permalink, items }) => ({ label, permalink, count: items.length })),
        totalCount: posts.length,
      });
    },
  };
}
