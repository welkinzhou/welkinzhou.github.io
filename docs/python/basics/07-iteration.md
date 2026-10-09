---
sidebar_position: 7
slug: iteration
title: "推导式、生成器与迭代器"
description: "区分立即构造结果和惰性计算，理解可迭代对象、迭代器与一次性消费。"
tags: [Python]
---

# 推导式、生成器与迭代器

区分立即构造结果和惰性计算，理解可迭代对象、迭代器与一次性消费。

## 推导式的输入与结果类型

这段代码：

```python playground=python-basics-07-iteration
[part.strip().lower() for part in raw.split(",") if part.strip()]
```

是**列表推导式**，通用结构是：

```python
[表达式 for 变量 in 可迭代对象 if 条件]
```

执行顺序是：从可迭代对象取出元素，判断 `if` 条件，对通过的元素执行表达式，把结果放进新列表。`if` 部分可以省略。

只要 `for` 后面是可迭代对象，就可以使用推导式。常见可迭代对象包括 `list`、`tuple`、`str`、`set`、`dict`、`range`、文件对象和生成器：

```python playground
[x * 2 for x in [1, 2, 3]]       # [2, 4, 6]
[char.upper() for char in "ab"]  # ["A", "B"]
[x for x in range(5) if x % 2]    # [1, 3]
```

字典直接遍历时默认遍历的是**键**：

```python playground
data = {"a": 1, "b": 2}

[key for key in data]               # ["a", "b"]
[value for value in data.values()]  # [1, 2]
[(key, value) for key, value in data.items()]
# [("a", 1), ("b", 2)]
```

如果目标结果是字典，要使用**字典推导式**，语法是 `{键表达式: 值表达式 for ...}`：

```python playground
data = {"a": 1, "b": 2, "c": 3}
squared = {key: value * value for key, value in data.items()}
# {"a": 1, "b": 4, "c": 9}

even_values = {key: value for key, value in data.items() if value % 2 == 0}
# {"b": 2}
```

另外还有集合推导式和生成器表达式：

```python playground
{x * 2 for x in [1, 2, 2, 3]}      # 集合：{2, 4, 6}
(x * 2 for x in range(1_000_000))  # 生成器：惰性产生结果
```

结果类型由外层符号决定：`[]` 是列表，`{key: value ...}` 是字典，`{value ...}` 是集合，`(...)` 通常是生成器表达式。`{}` 表示空字典；空集合要写 `set()`。

## 列表推导式：立即创建列表

```python playground
squares = [x * x for x in range(5)]
# [0, 1, 4, 9, 16]
```

列表推导式会立即计算所有结果并保存到列表中，适合数据量有限、需要重复访问结果的情况。

## 生成器表达式：按需计算

```python playground
squares = (x * x for x in range(5))

next(squares)  # 0
next(squares)  # 1
list(squares)  # [4, 9, 16]
```

生成器表达式不会一次性创建所有结果，只在 `next()` 或 `for` 遍历时生成下一个值。它只能顺序消费，不能通过下标访问，也不能重复遍历已经消费过的内容。

```python playground
sum(x * x for x in range(1_000_000))
```

这种写法不需要先创建一百万个元素的列表，适合大数据或只需要遍历一次的场景。

## 生成器函数和 `yield`

包含 `yield` 的函数调用后不会立即执行函数体，而是返回生成器：

```python playground=python-basics-07-iteration
def count_up_to(limit: int):
    number = 1
    while number <= limit:
        yield number
        number += 1

numbers = count_up_to(3)
list(numbers)  # [1, 2, 3]
```

每次执行到 `yield`，函数暂停并返回一个值；下一次 `next()` 会从暂停位置继续。`yield` 适合处理大文件、分页数据或无限序列。

## 可迭代对象和迭代器的区别

- **可迭代对象（iterable）**：可以交给 `for` 遍历，例如列表、元组、字符串、字典、集合。
- **迭代器（iterator）**：保存遍历状态，可以调用 `next()`，通常只能消费一次。

```python playground
items = [1, 2, 3]
iterator = iter(items)

next(iterator)  # 1
next(iterator)  # 2
next(iterator)  # 3
# 再 next(iterator) 会抛 StopIteration
```

`for` 循环会自动调用 `iter()` 获取迭代器，并不断调用 `next()`，遇到 `StopIteration` 时结束，所以通常不需要手动处理这个异常。

## 内存与选择

```python playground=python-basics-07-iteration
# 立即创建完整列表
values = [transform(x) for x in data]

# 惰性生成，按需计算
values = (transform(x) for x in data)
```

选择原则：

- 后续需要多次遍历、索引或切片：使用列表。
- 只需要顺序处理一次、数据量很大：使用生成器。
- 需要知道总长度或随机访问：生成器通常不适合，应先物化为列表。
