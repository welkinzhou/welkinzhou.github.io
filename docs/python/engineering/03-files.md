---
sidebar_position: 3
slug: files
title: "pathlib、文件读写与 with"
description: "用 Path 管理跨平台路径，明确编码，并用 with 可靠地关闭文件。"
tags: [Python]
---

# pathlib、文件读写与 with

用 Path 管理跨平台路径，明确编码，并用 with 可靠地关闭文件。

## 用 `Path` 表示路径

```python
from pathlib import Path

root = Path("data")
file_path = root / "notes.txt"

file_path.name    # "notes.txt"
file_path.stem    # "notes"
file_path.suffix  # ".txt"
file_path.parent  # Path("data")
```

使用 `/` 拼接路径，不要手动拼接字符串；`pathlib` 会按当前操作系统使用正确的路径分隔符。

## 判断和创建路径

```python
from pathlib import Path

path = Path("data")

path.exists()   # 是否存在
path.is_file()  # 是否是文件
path.is_dir()   # 是否是目录

path.mkdir(parents=True, exist_ok=True)
```

`parents=True` 会同时创建不存在的父目录；`exist_ok=True` 允许目录已经存在时不报错。

## 写入和读取文本

```python
from pathlib import Path

path = Path("data/notes.txt")
path.parent.mkdir(parents=True, exist_ok=True)

path.write_text("第一行\n第二行\n", encoding="utf-8")
text = path.read_text(encoding="utf-8")

print(text)
```

明确指定 `encoding="utf-8"`，避免不同操作系统默认编码不一致。`write_text` 会覆盖原文件；追加内容要使用 `open(..., mode="a")`。

## `with open(...)` 上下文管理器

```python
from pathlib import Path

path = Path("data/notes.txt")

with path.open("r", encoding="utf-8") as file:
    for line in file:
        print(line.rstrip("\n"))
```

`with` 代码块结束时会自动关闭文件，即使代码块中抛出异常也会执行清理。常见模式：

```python
with path.open("w", encoding="utf-8") as file:
    file.write("hello\n")

with path.open("a", encoding="utf-8") as file:
    file.write("append\n")
```

模式含义：

- `"r"`：读取，文件不存在会报 `FileNotFoundError`。
- `"w"`：写入并覆盖，不存在则创建。
- `"a"`：追加，不存在则创建。
- `"x"`：独占创建，文件已存在时报错。
- `"rb"` / `"wb"`：二进制读取/写入。

## 遍历目录

```python
root = Path("data")

for path in root.iterdir():
    print(path)

for markdown in root.glob("**/*.md"):
    print(markdown)
```

`glob("**/*.md")` 递归查找所有 Markdown 文件。`rglob("*.md")` 是类似的递归写法。

## 文件操作和异常

```python
try:
    text = Path("missing.txt").read_text(encoding="utf-8")
except FileNotFoundError:
    text = ""
```

删除文件前可以判断：

```python
path = Path("old.txt")
if path.exists():
    path.unlink()
```

`Path.unlink(missing_ok=True)` 可以忽略文件不存在的情况，避免先检查再删除之间文件已被移除的问题。`Path.unlink()` 删除文件；删除目录需要 `rmdir()`（只能删除空目录）或使用 `shutil` 处理非空目录。

## 为什么优先用 `pathlib`

旧式 `os.path.join("data", "notes.txt")` 仍然可用，但 `Path` 把路径操作、判断和读写统一成对象 API，代码通常更易读，也更适合跨平台项目。

## 官方参考

- [pathlib：路径、目录和文件操作](https://docs.python.org/3/library/pathlib.html)
- [Python 教程：读写文件](https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files)
