---
sidebar_position: 1
slug: functions
title: "函数参数与参数解包"
description: "设计位置参数、关键字参数和默认值，掌握 args、kwargs 与可变默认值陷阱。"
tags: [Python]
---

# 函数参数与参数解包

设计位置参数、关键字参数和默认值，掌握 args、kwargs 与可变默认值陷阱。

## 位置参数和关键字参数

```python playground=python-engineering-01-functions
def connect(host: str, port: int, timeout: float = 5.0):
    return f"{host}:{port}, timeout={timeout}"

connect("localhost", 8000)                    # 位置参数
connect(host="localhost", port=8000)         # 关键字参数
connect("localhost", port=8000, timeout=10)  # 混用
```

位置参数必须放在关键字参数前面，同一个参数不能传两次。

## `*args`：接收任意多个位置参数

```python playground=python-engineering-01-functions
def total(*numbers: int) -> int:
    return sum(numbers)

total(1, 2, 3)  # 6
```

函数内部的 `numbers` 是一个元组：

```python playground
# numbers == (1, 2, 3)
```

## `**kwargs`：接收任意多个关键字参数

```python playground=python-engineering-01-functions
def build_config(**options: str) -> dict[str, str]:
    return options

build_config(model="gpt", region="cn")
# {"model": "gpt", "region": "cn"}
```

函数内部的 `options` 是一个字典。

## 关键字专用参数

在参数列表中放一个单独的 `*`，后面的参数必须使用关键字传递：

```python playground
def request(url: str, *, timeout: float = 5.0, retries: int = 2):
    ...

request("https://example.com", timeout=10)
# request("https://example.com", 10)  # TypeError
```

这能让调用代码更清晰，适合配置项较多的函数。

## 位置专用参数

在参数列表中使用 `/`，前面的参数只能按位置传递：

```python playground=python-engineering-01-functions
def repeat(value, count, /, separator=" "):
    return separator.join([value] * count)

repeat("a", 3)
# repeat(value="a", count=3)  # TypeError
```

标准库中常见这种设计，用于稳定参数名称或提高调用灵活性。

## 参数解包

调用函数时，列表或元组前加 `*`，字典前加 `**`：

```python playground=python-engineering-01-functions
def connect(host: str, port: int, timeout: float):
    return host, port, timeout

args = ("localhost", 8000, 5.0)
connect(*args)

options = {"host": "localhost", "port": 8000, "timeout": 5.0}
connect(**options)
```

构建新字典时也可以合并：

```python playground
defaults = {"timeout": 5, "retries": 2}
custom = {"timeout": 10}
config = {**defaults, **custom}
# {"timeout": 10, "retries": 2}
```

后面的同名键覆盖前面的值。

## 可变默认参数陷阱

不要把列表或字典直接作为默认参数：

```python playground=python-engineering-add-item-shared
# 不推荐

def add_item(item, items=[]):
    items.append(item)
    return items
```

默认列表只会创建一次，多个调用会共享它。正确写法是使用 `None`：

```python playground=python-engineering-add-item
def add_item(item: str, items: list[str] | None = None) -> list[str]:
    if items is None:
        items = []
    items.append(item)
    return items
```

## 参数设计建议

- 必须提供的业务数据放在前面。
- 配置项使用默认值，并考虑设为关键字专用参数。
- `*args` 和 `**kwargs` 适合包装器、转发参数和高度通用的工具函数，不要为了省定义而滥用。
- 函数参数和返回值写类型标注，外部输入边界做校验。
