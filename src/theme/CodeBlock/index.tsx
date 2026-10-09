import React, {lazy, Suspense, useState, type ReactNode} from "react";
import OriginalCodeBlock from "@theme-original/CodeBlock";
import type {Props} from "@theme/CodeBlock";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "../../components/PythonPlayground/styles.module.css";

const PythonPlayground = lazy(() => import("../../components/PythonPlayground"));

export default function CodeBlock(props: Props): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const [open, setOpen] = useState(false);
  const marker = props.metastring?.match(/(?:^|\s)playground(?:=([\w-]+))?(?=\s|$)/);
  const language = props.language ?? props.className?.replace(/^language-/, "");
  const eligible = siteConfig.customFields?.playgroundEnabled !== false &&
    (language === "python" || language === "py") && marker &&
    typeof props.children === "string";

  if (!eligible) return <OriginalCodeBlock {...props} />;

  return (
    <div className={styles.wrapper}>
      {open ? (
        <Suspense fallback={<p role="status">正在打开 Playground…</p>}>
          <PythonPlayground code={props.children as string} exampleId={marker[1]}
            onClose={() => setOpen(false)} />
        </Suspense>
      ) : (
        <>
          <OriginalCodeBlock {...props} />
          <button type="button" className={styles.openButton} onClick={() => setOpen(true)}>
            打开 Playground
          </button>
        </>
      )}
    </div>
  );
}
