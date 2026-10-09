import React, {useEffect, useId, useRef, useState, type ReactNode} from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import {loadProject, validPath, validateProject, type Project} from "./project";
import styles from "./styles.module.css";

type Props = {code: string; exampleId?: string; onClose: () => void};
type WorkerMessage = {type: "status" | "done" | "error"; message?: string;
  output?: string; files?: Record<string, string>};

export default function PythonPlayground({code, exampleId, onClose}: Props): ReactNode {
  const id = useId();
  const workerUrl = useBaseUrl("/playground/python-worker.js");
  const manifestUrl = useBaseUrl("/playground/examples.json");
  const [project, setProject] = useState<Project>();
  const [activeFile, setActiveFile] = useState("main.py");
  const [status, setStatus] = useState("正在加载实验文件…");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newFile, setNewFile] = useState("");
  const initial = useRef<Project>();
  const worker = useRef<Worker>();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const fileInput = useRef<HTMLInputElement>(null);

  function terminate() {
    clearTimeout(timer.current);
    worker.current?.terminate();
    worker.current = undefined;
  }

  useEffect(() => {
    const controller = new AbortController();
    const baseUrl = (url: string) => manifestUrl.replace(/playground\/examples\.json$/, "") + url.replace(/^\//, "");
    loadProject(code, exampleId, baseUrl, controller.signal).then(value => {
      initial.current = value;
      setProject(value);
      setActiveFile(value.entry);
      setStatus("准备就绪");
    }).catch(reason => {
      if (!controller.signal.aborted) {setError(String(reason.message ?? reason)); setStatus("实验加载失败");}
    });
    return () => {controller.abort(); terminate();};
  }, [code, exampleId, manifestUrl]);

  function armTimeout(milliseconds: number) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      terminate(); setBusy(false); setStatus("已停止");
      setError("运行超时，已停止。可缩短代码或重试；首次加载需要网络连接。");
    }, milliseconds);
  }

  function run() {
    if (!project || busy) return;
    setBusy(true); setError(""); setOutput(""); setStatus("正在准备 Python…");
    armTimeout(180000);
    try {
      const current = worker.current ?? new Worker(workerUrl, {type: "module"});
      worker.current = current;
      current.onmessage = ({data}: MessageEvent<WorkerMessage>) => {
        if (data.type === "status") {
          setStatus(data.message ?? "运行中…");
          if (data.message === "正在运行…") armTimeout(15000);
          return;
        }
        clearTimeout(timer.current); setBusy(false);
        setOutput(data.output || (data.type === "done" ? "运行完成，没有输出。可添加 print(...) 查看结果。" : ""));
        if (data.type === "error") {setError(data.message ?? "运行失败。"); setStatus("运行失败");}
        else {
          setStatus("运行完成");
          if (data.files) setProject(previous => previous ? {...previous, files: data.files!} : previous);
        }
      };
      current.onerror = () => {
        terminate(); setBusy(false); setStatus("运行失败");
        setError("Python 环境加载失败，请检查网络连接后重试。");
      };
      current.postMessage(validateProject(project));
    } catch (reason) {
      terminate(); setBusy(false); setStatus("运行失败"); setError(String(reason));
    }
  }

  function reset() {
    terminate(); setBusy(false); setError(""); setOutput("");
    setProject(initial.current); setActiveFile(initial.current?.entry ?? "main.py");
    setNewFile(""); setStatus(initial.current ? "准备就绪" : "实验加载失败");
  }

  async function importFiles(files: FileList | null) {
    if (!files || !project || busy) return;
    try {
      const uploads = Array.from(files);
      if (uploads.reduce((size, file) => size + file.size, 0) > 1024 * 1024) throw new Error("导入内容不能超过 1 MB。");
      let next: Project;
      if (uploads.length === 1 && uploads[0].name.endsWith(".json")) {
        next = validateProject(JSON.parse(await uploads[0].text()));
      } else {
        if (uploads.some(file => !file.name.endsWith(".py") || !validPath(file.name))) throw new Error("请选择 .py 文件，或一个导出的 .json 项目。");
        const contents = await Promise.all(uploads.map(async file => [file.name, await file.text()] as const));
        next = validateProject({...project, files: {...project.files, ...Object.fromEntries(contents)}});
      }
      terminate(); setProject(next); setActiveFile(next.entry); setOutput(""); setError(""); setStatus("文件已导入");
    } catch (reason) {setError(String((reason as Error).message ?? reason));}
    finally {if (fileInput.current) fileInput.current.value = "";}
  }

  function download() {
    if (!project) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], {type: "application/json"}));
    const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = `${exampleId ?? "python-playground"}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function addFile() {
    if (!project || !validPath(newFile) || Object.hasOwn(project.files, newFile)) {
      setError("请输入未使用的相对文件名，例如 helpers.py 或 utils/__init__.py。"); return;
    }
    try {
      const next = validateProject({...project, files: {...project.files, [newFile]: ""}});
      setProject(next); setActiveFile(newFile); setNewFile(""); setError("");
    } catch (reason) {setError(String((reason as Error).message));}
  }

  return (
    <section className={styles.playground} aria-label="Python Playground">
      <div className={styles.header}>
        <strong>Python Playground</strong>
        <button type="button" className={styles.quietButton} onClick={onClose}>收起</button>
      </div>
      <p className={styles.hint}>代码在当前浏览器运行。首次运行会下载 Python{project?.packages === "langchain" ? " 和 LangChain 依赖" : ""}；文件保存在实验目录，重置后恢复初始内容。</p>
      {project && <>
        <div className={styles.files} aria-label="实验文件">
          {Object.keys(project.files).map(path => (
            <button type="button" key={path} className={activeFile === path ? styles.activeFile : styles.file}
              aria-pressed={activeFile === path} onClick={() => setActiveFile(path)}>{path}</button>
          ))}
        </div>
        <label className={styles.editorLabel} htmlFor={`${id}-code`}>{activeFile}{activeFile === project.entry ? " · 入口文件" : ""}</label>
        <textarea id={`${id}-code`} className={styles.editor} spellCheck={false} autoCapitalize="off" autoCorrect="off"
          value={project.files[activeFile] ?? ""} disabled={busy} rows={Math.min(20, Math.max(6, (project.files[activeFile] ?? "").split("\n").length))}
          onChange={event => setProject({...project, files: {...project.files, [activeFile]: event.target.value}})} />
        <div className={styles.toolbar}>
          <button type="button" className={styles.runButton} disabled={busy} onClick={run}>运行</button>
          {busy && <button type="button" className={styles.quietButton} onClick={() => {terminate(); setBusy(false); setStatus("已停止");}}>停止</button>}
          <button type="button" className={styles.quietButton} onClick={reset}>重置</button>
          <button type="button" className={styles.quietButton} disabled={busy} onClick={() => fileInput.current?.click()}>导入文件</button>
          <button type="button" className={styles.quietButton} disabled={busy} onClick={download}>导出项目</button>
          <span role="status" className={styles.status}>{status}</span>
        </div>
        <input ref={fileInput} type="file" accept=".py,.json" multiple hidden onChange={event => void importFiles(event.target.files)} />
        <details className={styles.fileOptions}>
          <summary>添加文件与入口设置</summary>
          <div className={styles.settings}>
            <label htmlFor={`${id}-entry`}>入口文件</label>
            <select id={`${id}-entry`} value={project.entry} disabled={busy} onChange={event => setProject({...project, entry: event.target.value})}>
              {Object.keys(project.files).filter(path => path.endsWith(".py")).map(path => <option key={path}>{path}</option>)}
            </select>
            <label htmlFor={`${id}-file`}>新文件名</label>
            <input id={`${id}-file`} value={newFile} disabled={busy} placeholder="helpers.py" onChange={event => setNewFile(event.target.value)} />
            <button type="button" className={styles.quietButton} disabled={busy} onClick={addFile}>添加文件</button>
          </div>
          <p className={styles.hint}>可导入自己的 .py 文件。导出项目会保存所有文本文件和入口设置，可重新导入 .json 继续编辑。</p>
        </details>
      </>}
      {!project && <p role="status">{status}</p>}
      <div className={styles.outputHeader}>输出</div>
      <pre className={styles.output} tabIndex={0} aria-label="运行输出">{output || (busy ? "等待运行结果…" : "运行后在这里查看输出。")}</pre>
      {error && <pre role="alert" className={styles.error}>{error}</pre>}
    </section>
  );
}
