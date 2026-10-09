---
sidebar_position: 6
slug: builtins
title: "内置函数与迭代工具"
description: "通过 enumerate、zip、map、filter、any、all 和 sorted 处理可迭代数据。"
tags: [Python]
---

# 内置函数与迭代工具

通过 enumerate、zip、map、filter、any、all 和 sorted 处理可迭代数据。

## `enumerate`：同时获取下标和值

```python playground
names = ["Ada", "Bob"]

for index, name in enumerate(names):
    print(index, name)

for index, name in enumerate(names, start=1):
    print(index, name)  # 从 1 开始编号
```

`enumerate` 返回一个迭代器，不是列表；需要列表时显式转换：

```python playground
list(enumerate(["a", "b"]))  # [(0, "a"), (1, "b")]
```

## `zip`：按位置组合多个可迭代对象

```python playground
names = ["Ada", "Bob"]
scores = [90, 85]

for name, score in zip(names, scores):
    print(name, score)

list(zip(names, scores))
# [("Ada", 90), ("Bob", 85)]
```

`zip` 默认以最短对象为准，多出来的元素会被忽略。需要严格检查长度时，Python 3.10+ 可以使用 `strict=True`：

```python playground
list(zip([1, 2], ["a"], strict=True))  # ValueError
```

## `map`：对每个元素应用函数

```python playground
numbers = ["1", "2", "3"]
converted = map(int, numbers)

list(converted)  # [1, 2, 3]
```

`map` 返回惰性迭代器，只在遍历时计算。列表推导式通常更直观：

```python playground=python-basics-06-builtins
[int(number) for number in numbers]
```

## `filter`：保留满足条件的元素

```python playground=python-basics-06-builtins
numbers = [1, 2, 3, 4]
evens = filter(lambda number: number % 2 == 0, numbers)

list(evens)  # [2, 4]
```

`filter` 也返回惰性迭代器；复杂条件通常使用列表推导式更易读：

```python playground=python-basics-06-builtins-filter
[number for number in numbers if number % 2 == 0]
```

## `any` 和 `all`

```python playground
flags = [True, False, True]

any(flags)  # True，只要有一个为真
all(flags)  # False，必须全部为真
```

它们会短路：`any` 找到真值后停止，`all` 找到假值后停止。常见写法：

```python playground
scores = [80, 92, 76]
any(score >= 90 for score in scores)  # True
all(score >= 60 for score in scores)  # True
```

## `sorted`：返回排序后的新列表

```python playground
words = ["ccc", "a", "bb"]

sorted(words)                    # 按字典序
sorted(words, key=len)           # 按长度
sorted(words, key=len, reverse=True)  # 长度降序
```

`key` 接收一个函数，返回每个元素用于比较的值；`sorted` 不修改原对象。

## 返回值速查

```python playground=python-basics-06-builtins
enumerate(items)  # 迭代器
zip(a, b)         # 迭代器
map(func, items)  # 迭代器
filter(func, items) # 迭代器
any(iterable)     # bool
all(iterable)     # bool
sorted(iterable)  # 新列表
```

迭代器通常只能消费一次：

```python playground
iterator = map(int, ["1", "2"])
list(iterator)  # [1, 2]
list(iterator)  # []
```
