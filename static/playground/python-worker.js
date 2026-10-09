/* Runs in a dedicated worker. No keys or model clients are installed here. */
const INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";
let runtime;
let langchainInstalled = false;
let running = false;

const status = message => self.postMessage({type: "status", message});

async function getRuntime(packages) {
  if (!runtime) {
    status("正在下载 Python 环境…");
    const {loadPyodide} = await import(`${INDEX_URL}pyodide.mjs`);
    runtime = await loadPyodide({indexURL: INDEX_URL});
  }
  if (packages === "langchain" && !langchainInstalled) {
    status("正在安装 LangChain 依赖…");
    await runtime.loadPackage(["micropip", "pydantic", "xxhash", "orjson"]);
    await runtime.runPythonAsync(`
import micropip
await micropip.install([
    "langchain-core==1.6.9", "langsmith==0.14.5",
    "uuid-utils==0.17.1", "langchain-protocol==0.0.19",
])
`);
    langchainInstalled = true;
  }
  return runtime;
}

self.onmessage = async ({data: project}) => {
  if (running) return;
  running = true;
  let output = "";
  let truncated = false;
  const append = line => {
    if (truncated) return;
    const text = `${line}\n`;
    const remaining = 65536 - output.length;
    output += text.slice(0, remaining);
    if (text.length > remaining) {
      output += "\n[输出超过 64 KB，后续内容已省略]";
      truncated = true;
    }
  };
  try {
    const py = await getRuntime(project.packages);
    py.setStdout({batched: append});
    py.setStderr({batched: append});
    py.globals.set("_playground_project_json", JSON.stringify(project));
    status("正在运行…");
    await py.runPythonAsync(`
import ast as _pg_ast
import importlib as _pg_importlib
import json as _pg_json
import os as _pg_os
import shutil as _pg_shutil
import sys as _pg_sys

_pg_project = _pg_json.loads(_playground_project_json)
_pg_root = "/playground-workspace"
_pg_os.chdir("/")
for _pg_name, _pg_module in list(_pg_sys.modules.items()):
    if str(getattr(_pg_module, "__file__", "")).startswith(_pg_root + "/"):
        del _pg_sys.modules[_pg_name]
if _pg_os.path.exists(_pg_root):
    _pg_shutil.rmtree(_pg_root)
_pg_os.mkdir(_pg_root)
for _pg_path, _pg_content in _pg_project["files"].items():
    if _pg_os.path.isabs(_pg_path) or ".." in _pg_path.split("/"):
        raise ValueError("文件路径不能越出实验目录")
    _pg_full_path = _pg_os.path.join(_pg_root, _pg_path)
    _pg_os.makedirs(_pg_os.path.dirname(_pg_full_path), exist_ok=True)
    with open(_pg_full_path, "w", encoding="utf-8") as _pg_file:
        _pg_file.write(_pg_content)
_pg_os.chdir(_pg_root)
if _pg_root not in _pg_sys.path:
    _pg_sys.path.insert(0, _pg_root)
_pg_importlib.invalidate_caches()
_pg_sys.dont_write_bytecode = True
_pg_os.environ["LANGSMITH_TRACING"] = "false"
_pg_os.environ["LANGCHAIN_TRACING_V2"] = "false"

def _pg_echo(value):
    if value is not None:
        print(repr(value))

_pg_entry = _pg_project["entry"]
_pg_source = _pg_project["files"][_pg_entry]
_pg_tree = _pg_ast.parse(_pg_source, filename=_pg_entry)
# Echo top-level expressions like a notebook; preserve a module docstring.
for _pg_index, _pg_node in enumerate(_pg_tree.body):
    if isinstance(_pg_node, _pg_ast.Expr) and not (
        _pg_index == 0 and isinstance(_pg_node.value, _pg_ast.Constant)
        and isinstance(_pg_node.value.value, str)
    ):
        _pg_tree.body[_pg_index] = _pg_ast.copy_location(
            _pg_ast.Expr(value=_pg_ast.Call(func=_pg_ast.Name(id="__playground_echo__", ctx=_pg_ast.Load()),
                args=[_pg_node.value], keywords=[])), _pg_node)
_pg_ast.fix_missing_locations(_pg_tree)
_pg_namespace = {"__name__": "__main__", "__file__": _pg_os.path.join(_pg_root, _pg_entry),
    "__playground_echo__": _pg_echo}
_pg_compiled = compile(_pg_tree, _pg_entry, "exec", flags=_pg_ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
_pg_result = eval(_pg_compiled, _pg_namespace)
if _pg_result is not None:
    await _pg_result
`);
    const filesJson = py.runPython(`
_pg_saved = {}
_pg_saved_size = 0
for _pg_directory, _pg_dirs, _pg_names in _pg_os.walk(_pg_root):
    _pg_dirs[:] = [name for name in _pg_dirs if name != "__pycache__"]
    for _pg_filename in _pg_names:
        _pg_full_path = _pg_os.path.join(_pg_directory, _pg_filename)
        if _pg_os.path.getsize(_pg_full_path) > 1048576 or len(_pg_saved) >= 50:
            continue
        try:
            with open(_pg_full_path, encoding="utf-8") as _pg_file:
                _pg_text = _pg_file.read()
            if _pg_saved_size + len(_pg_text) <= 1048576:
                _pg_saved[_pg_os.path.relpath(_pg_full_path, _pg_root)] = _pg_text
                _pg_saved_size += len(_pg_text)
        except (UnicodeError, OSError):
            pass
_pg_json.dumps(_pg_saved)
`);
    self.postMessage({type: "done", output, files: JSON.parse(filesJson)});
  } catch (error) {
    self.postMessage({type: "error", message: String(error.message ?? error), output});
  } finally {running = false;}
};
