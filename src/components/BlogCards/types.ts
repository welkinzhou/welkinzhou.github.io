export type BlogTag = {
  label: string;
  permalink: string;
};

export type PostSummary = {
  title: string;
  permalink: string;
  description: string;
  date: string;
  readingTime?: number;
  tags: readonly BlogTag[];
};

export type HomepageContent = {
  recentPosts: PostSummary[];
  topics: (BlogTag & { count: number })[];
  totalCount: number;
};
