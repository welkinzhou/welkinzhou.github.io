export type Project = {
  entry: string;
  files: Record<string, string>;
  packages?: "langchain";
};

type Example = Omit<Project, "files"> & {
  files: Record<string, string | {url: string}>;
};

export const CODE_PLACEHOLDER = "# __PLAYGROUND_CODE__";
const MAX_PROJECT_SIZE = 1024 * 1024;

export function validPath(path: string): boolean {
  return path.length > 0 && path.length <= 200 &&
    !path.startsWith("/") && !path.includes("\\") &&
    path.split("/").every(part => part !== "." && part !== ".." && part !== "" &&
      /^[\w.\-\u4e00-\u9fff]+$/.test(part));
}

export function validateProject(value: unknown): Project {
  if (!value || typeof value !== "object") throw new Error("项目文件格式不正确。");
  const project = value as Project;
  if (!validPath(project.entry ?? "") || !project.entry.endsWith(".py") ||
      !project.files || typeof project.files !== "object" || Array.isArray(project.files) ||
      typeof project.files[project.entry] !== "string") {
    throw new Error("项目需要有效的 Python 入口和 files 文件集合。");
  }
  const files = Object.entries(project.files);
  if (files.length > 50 || files.some(([path, code]) => !validPath(path) || typeof code !== "string") ||
      JSON.stringify(project.files).length > MAX_PROJECT_SIZE ||
      (project.packages !== undefined && project.packages !== "langchain")) {
    throw new Error("项目最多包含 50 个文本文件、1 MB 内容，路径不能越出实验目录。");
  }
  return {entry: project.entry, files: Object.fromEntries(files), packages: project.packages};
}

export async function loadProject(code: string, exampleId: string | undefined,
  baseUrl: (url: string) => string, signal?: AbortSignal): Promise<Project> {
  if (!exampleId) return {entry: "main.py", files: {"main.py": code.trimEnd() + "\n"}};
  const response = await fetch(baseUrl("/playground/examples.json"), {signal});
  if (!response.ok) throw new Error("无法加载实验配置，请重试。");
  const manifest: Record<string, Example> = await response.json();
  if (!Object.hasOwn(manifest, exampleId)) throw new Error(`找不到实验：${exampleId}`);
  const example = manifest[exampleId];
  const entries = await Promise.all(Object.entries(example.files).map(async ([path, source]) => {
    if (typeof source === "string") return [path, source.replace(CODE_PLACEHOLDER, () => code.trimEnd())] as const;
    if (!source.url.startsWith("/examples/")) throw new Error("实验资源必须来自站点示例目录。");
    const file = await fetch(baseUrl(source.url), {signal});
    if (!file.ok) throw new Error(`无法加载辅助文件：${path}`);
    return [path, await file.text()] as const;
  }));
  return validateProject({...example, files: Object.fromEntries(entries)});
}
