import React from "react";
import BlogListPage from "@theme-original/BlogListPage";
import type BlogListPageType from "@theme/BlogListPage";
import type { WrapperProps } from "@docusaurus/types";

type Props = WrapperProps<typeof BlogListPageType>;

/**
 * TODO refactor BlogList
 * origin components
 * node_modules -> @docusaurus -> theme-classic
 */
export default function BlogListPageWrapper(props: Props): JSX.Element {
  return (
    <>
      <BlogListPage {...props} />
    </>
  );
}
