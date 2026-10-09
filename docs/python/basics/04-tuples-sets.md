---
sidebar_position: 4
slug: tuples-sets
title: "元组、解包与集合"
description: "用元组表达固定结构，用解包接收多个值，用集合去重和判断成员。"
tags: [Python]
---

# 元组、解包与集合

用元组表达固定结构，用解包接收多个值，用集合去重和判断成员。

## `tuple`：不可变序列

`tuple` 和 `list` 一样有顺序、支持索引和切片，但创建后不能修改元素。适合表示固定结构的数据，例如坐标、键值对、函数返回的多个结果。

```python playground
point = (10, 20)

point[0]     # 10
point[1:]    # (20,)
len(point)   # 2

# point[0] = 99  # TypeError
```

单元素元组必须带逗号，否则只是普通括号表达式：

```python playground
one = (1,)  # 元组
not_tuple = (1)  # 整数
```

## 序列解包

解包可以把序列中的元素一次性赋给多个变量：

```python playground
user = ("Ada", 36)
name, age = user

first, second, third = [10, 20, 30]
```

变量数量必须匹配元素数量，否则会抛 `ValueError`。使用 `*` 可以接收多个剩余元素：

```python playground
head, *middle, tail = [1, 2, 3, 4, 5]
# head == 1, middle == [2, 3, 4], tail == 5
```

交换变量也可以用解包，不需要临时变量：

```python playground
a, b = 1, 2
a, b = b, a
# a == 2, b == 1
```

函数可以返回元组，调用时直接解包：

```python playground=python-basics-tuples-min-max
def min_max(values: list[int]) -> tuple[int, int]:
    return min(values), max(values)

smallest, largest = min_max([3, 1, 8])
# smallest == 1, largest == 8
```

## `set`：无序且不重复

集合只保存唯一元素，不保证顺序，适合去重和成员判断：

```python playground
tags = {"python", "rag", "python"}
print(tags)  # {"python", "rag"}，顺序不应依赖

"rag" in tags       # True
"java" not in tags  # True

tags.add("agent")
tags.discard("java")  # 不存在也不报错
```

`remove` 和 `discard` 的区别：`remove` 删除不存在的元素会抛 `KeyError`，`discard` 不会。

空集合必须写 `set()`，因为 `{}` 是空字典：

```python playground
empty_set = set()
empty_dict = {}
```

## 集合运算

```python playground
a = {1, 2, 3}
b = {3, 4, 5}

a | b  # 并集：{1, 2, 3, 4, 5}
a & b  # 交集：{3}
a - b  # 差集：{1, 2}
a ^ b  # 对称差集：{1, 2, 4, 5}
```

集合也支持比较：

```python playground
{1, 2} <= {1, 2, 3}  # True，子集
{1, 2, 3} >= {1, 2}  # True，超集
```

## 常见转换

```python playground
items = [1, 2, 2, 3, 1]
unique_items = set(items)       # {1, 2, 3}
restored = list(unique_items)   # 转回列表，但顺序不保证

text = "banana"
chars = set(text)               # {"b", "a", "n"}
```

如果既要去重又要保留原顺序，不要直接转集合，可以使用字典键：

```python playground
items = [1, 2, 2, 3, 1]
ordered_unique = list(dict.fromkeys(items))
# [1, 2, 3]
```

## 补充：`list(dict.fromkeys(items))` 为什么能有序去重

`dict.fromkeys(iterable)` 会根据可迭代对象创建一个字典，把每个元素作为键，值默认是 `None`：

```python playground
items = [1, 2, 2, 3, 1]
step1 = dict.fromkeys(items)
# {1: None, 2: None, 3: None}
```

字典的键不能重复；重复键再次出现时不会新增条目。Python 3.7 及之后，普通字典保证保留键的插入顺序，因此字典的键已经完成了“去重且保序”。

再用 `list(...)` 取出字典的键：

```python playground=python-basics-04-tuples-sets
ordered_unique = list(step1)
# [1, 2, 3]
```

合并写成一行就是：

```python playground=python-basics-04-tuples-sets
ordered_unique = list(dict.fromkeys(items))
```

它与 `list(set(items))` 的区别是：集合去重但不保证顺序；`dict.fromkeys` 去重并保留第一次出现的顺序。这个写法要求元素可以作为字典键，也就是必须是可哈希对象，例如整数、字符串、元组通常可以，列表和字典不能直接作为键。
