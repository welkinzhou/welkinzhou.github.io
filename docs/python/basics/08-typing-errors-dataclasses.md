---
sidebar_position: 8
slug: typing-errors-dataclasses
title: "类型标注、异常与 dataclass"
description: "声明预期类型、处理缺失值和异常，并用 dataclass 表达结构化数据。"
tags: [Python]
---

# 类型标注、异常与 dataclass

声明预期类型、处理缺失值和异常，并用 dataclass 表达结构化数据。

## 类型标注

类型标注用于表达函数参数、返回值和变量的预期类型，主要帮助编辑器、静态检查工具和读代码的人；Python 默认不会因为类型标注不匹配而自动阻止运行。

```python

def average(values: list[float]) -> float:
    return sum(values) / len(values)

name: str = "Ada"
count: int = 3
enabled: bool = True
```

常见复合类型：

```python
from typing import Any

metadata: dict[str, str | int] = {"source": "a.md", "page": 3}
items: list[str] = ["a", "b"]
result: tuple[int, str] = (200, "ok")
unknown: Any = get_external_value()
```

`A | B` 表示值可以是 A 或 B；`Any` 表示暂不约束类型，应在外部输入边界谨慎使用。

## `None` 和可选值

`None` 表示没有值、缺失或尚未产生结果。判断时使用 `is None` / `is not None`，不要使用 `== None`：

```python
value = lookup("missing")

if value is None:
    print("没有找到")
```

类型标注中可以写：

```python
def find_name(user_id: int) -> str | None:
    if user_id == 1:
        return "Ada"
    return None
```

调用者必须处理 `None`，不能直接假设返回值一定是字符串。

## 异常捕获

可能失败的代码放在 `try` 中，用具体异常类型处理：

```python
try:
    number = int("abc")
except ValueError:
    number = 0
```

完整结构还可以包含 `else` 和 `finally`：

```python
try:
    value = int(text)
except ValueError as error:
    print(f"输入无效: {error}")
else:
    print("转换成功", value)
finally:
    print("这部分总会执行")
```

- `except`：发生指定异常时执行。
- `else`：没有异常时执行。
- `finally`：无论是否异常都会执行，常用于清理资源。

不要直接写裸 `except:`，它会捕获包括 `KeyboardInterrupt` 在内的过多异常。也不要用异常替代正常的条件判断。

## 主动抛出异常

用 `raise` 表示参数或状态不符合要求：

```python
def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("除数不能为 0")
    return a / b
```

自定义异常可以继承 `Exception`：

```python
class ConfigurationError(Exception):
    pass
```

## `dataclass`：定义数据对象

`dataclass` 根据字段声明自动生成初始化方法、比较和表示方法，适合承载结构化数据：

```python
from dataclasses import dataclass

@dataclass
class Document:
    text: str
    source: str
    page: int | None = None


doc = Document("内容", "guide.md", 3)
print(doc.text)
print(doc)
```

默认情况下字段仍然可修改：

```python
doc.page = 4
```

如果希望阻止字段重新赋值，可以使用 `frozen=True`；它不会冻结字段内部的可变对象：

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int
```

## 默认值和 `default_factory`

`dataclass` 会拒绝直接使用列表或字典这样的默认值；需要为每个实例分别创建对象。使用 `field(default_factory=...)`：

```python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    tags: list[str] = field(default_factory=list)
```

每个 `User` 实例都会得到自己的空列表。

## 补充：实例化参数和 `frozen=True`

`dataclass` 默认生成的 `__init__` 支持位置参数和关键字参数：

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int
    label: str = "point"

p1 = Point(10, 20)                    # 位置参数
p2 = Point(x=10, y=20)                # 关键字参数
p3 = Point(10, y=20, label="origin")  # 可以混用
```

位置参数必须写在关键字参数前面；同一个参数不能重复传递：

```python
# Point(x=10, 20)       # SyntaxError：位置参数不能放在关键字参数后
# Point(10, x=20, y=30) # TypeError：x 被传了两次
```

`@dataclass(frozen=True)` 会阻止实例化完成后给字段重新赋值：

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int

p = Point(1, 2)
# p.x = 10  # FrozenInstanceError
```

它是“字段不能重新绑定”，不是深度冻结。若字段本身是可变对象，内部内容仍可能改变：

```python
@dataclass(frozen=True)
class Config:
    tags: list[str]

config = Config(["python"])
config.tags.append("rag")  # 可以修改列表内容
# config.tags = []          # 不允许给字段重新赋值
```

需要真正不可变的数据结构时，字段也应使用不可变类型，例如 `tuple`、`frozenset`，或使用不可变数据模型。

## 补充：`p.x` 和 `p["x"]` 是两套访问协议

默认情况下，属性访问和下标访问不能混用：

```python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

p = Point(1, 2)
p.x = 10       # 正确：访问对象属性
# p["x"] = 10  # TypeError：Point 默认不支持下标访问
```

字典则相反：

```python
data = {"x": 1}
data["x"] = 10  # 正确：访问字典键
# data.x = 10    # AttributeError：x 不是字典属性
```

两种写法含义不同：

- `p.x` 调用属性访问机制，读取对象字段或属性。
- `p["x"]` 调用下标协议，本质上会尝试执行 `p.__getitem__("x")`。
- `p["x"] = value` 会尝试执行 `p.__setitem__("x", value)`。

自定义类可以实现这两个方法，从而同时支持两种写法：

```python
class Config:
    def __init__(self):
        self.x = 1

    def __getitem__(self, key):
        return getattr(self, key)

    def __setitem__(self, key, value):
        setattr(self, key, value)

config = Config()
config.x = 2
config["x"] = 3
print(config.x)     # 3
print(config["x"])  # 3
```

工程中通常按数据模型选择一种风格：对象用点号，字典/映射用方括号。不要因为对象有 `__dict__` 就认为它自动支持 `p["x"]`；`__dict__` 只是保存实例属性的一个字典。
