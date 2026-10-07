---
sidebar_position: 2
slug: modules
title: "模块、包与导入"
description: "把代码组织为可复用模块，理解导入时的执行行为与脚本入口。"
tags: [Python]
---

# 模块、包与导入

把代码组织为可复用模块，理解导入时的执行行为与脚本入口。

## 模块就是一个 `.py` 文件

假设目录中有：

```text
project/
├── main.py
└── math_utils.py
```

`math_utils.py`：

```python
PI = 3.14159


def square(value: int) -> int:
    return value * value
```

`main.py` 可以导入它：

```python
import math_utils

print(math_utils.PI)
print(math_utils.square(4))
```

也可以导入指定名称：

```python
from math_utils import square

print(square(4))
```

使用别名：

```python
import math_utils as mu
from math_utils import square as sq
```

## 导入模块时，顶层代码会执行

如果 `math_utils.py` 里直接写：

```python
print("module loaded")
```

其他文件 `import math_utils` 时就会执行这行。函数和类定义通常不会立刻调用，但模块级变量和模块级语句会执行。

因此，不应把测试代码或启动逻辑直接放在模块顶层。

## `__name__ == "__main__"`

推荐写法：

```python
# math_utils.py

def square(value: int) -> int:
    return value * value


def main() -> None:
    print(square(4))


if __name__ == "__main__":
    main()
```

两种运行方式的区别：

```bash
python math_utils.py
```

此时该文件是入口文件，`__name__` 等于 `"__main__"`，会执行 `main()`。

```python
import math_utils
```

此时 `math_utils` 是被导入模块，`__name__` 等于模块名，不会执行 `main()`。

这个模式让同一个文件既可以被导入复用，也可以直接运行做演示或命令行入口。

## 包和 `__init__.py`

多个相关模块可以放进一个目录形成包：

```text
project/
├── main.py
└── utils/
    ├── __init__.py
    ├── text.py
    └── numbers.py
```

导入包内模块：

```python
from utils.text import normalize
from utils import numbers
```

`__init__.py` 可以为空，也可以暴露常用接口：

```python
# utils/__init__.py
from .text import normalize

__all__ = ["normalize"]
```

之后可以写：

```python
from utils import normalize
```

## 绝对导入和相对导入

包内模块可以使用相对导入：

```python
# utils/report.py
from .text import normalize
```

`.` 表示当前包，`..` 表示上一级包。项目代码通常优先使用清晰的绝对导入或包内相对导入，不要依赖修改 `sys.path` 来“凑出”导入路径。

## 导入执行方式

在项目根目录运行模块时，推荐使用：

```bash
python -m package.module
```

例如：

```bash
python -m utils.report
```

这样 Python 会按包结构解析导入，包内相对导入更可靠。

## 常见问题

- 文件名不要和标准库重名，例如不要把文件命名为 `json.py`、`typing.py`、`random.py`，否则可能遮蔽标准库。
- 避免循环导入：模块 A 导入 B，B 又导入 A，容易得到未完成初始化的模块。
- 导入模块和导入名称的区别：`import math` 后用 `math.sqrt`；`from math import sqrt` 后直接用 `sqrt`。
- `from module import *` 会污染命名空间，不推荐在业务代码中使用。
