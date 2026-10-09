---
sidebar_position: 3
slug: lists
title: "列表：增删改查、排序与复制"
description: "区分新对象和原地修改，理解切片、浅拷贝、深拷贝与返回值。"
tags: [Python]
---

# 列表：增删改查、排序与复制

区分新对象和原地修改，理解切片、浅拷贝、深拷贝与返回值。

## 增删改查

```python playground
items = ["a", "b", "c"]

items[0] = "A"          # 修改
items.append("d")      # 末尾添加一个
items.extend(["e", "f"])  # 追加多个
items.insert(1, "x")    # 指定位置插入

items.pop()             # 删除并返回末尾元素
items.pop(0)            # 删除并返回指定下标元素
items.remove("x")      # 删除第一个值为 "x" 的元素
```

`remove` 找不到值会抛 `ValueError`，`pop` 下标越界会抛 `IndexError`。列表没有 `discard`，需要安全删除时先判断 `if value in items`。

## 切片和切片赋值

```python playground
nums = [0, 1, 2, 3, 4]
nums[1:4]   # [1, 2, 3]
nums[:3]    # [0, 1, 2]
nums[::2]   # [0, 2, 4]
nums[::-1]  # [4, 3, 2, 1, 0]
len(nums)   # 5

nums[1:3] = [10, 11, 12]
# nums 变为 [0, 10, 11, 12, 3, 4]
```

切片会创建新列表；切片赋值可以批量替换，也可以改变列表长度。

## 排序和反转

```python playground
nums = [3, 1, 2]
new_nums = sorted(nums)  # 返回新列表，nums 不变
nums.sort()              # 原地排序，返回 None
nums.sort(reverse=True)  # 原地降序
nums.reverse()           # 原地反转，返回 None

words = ["ccc", "a", "bb"]
sorted(words, key=len)    # ["a", "bb", "ccc"]
```

`sorted` 可处理其他可迭代对象并返回列表；`list.sort` 只适用于列表。

## 复制与可变性

列表是可变对象。简单赋值不会复制：

```python playground
a = [1, 2]
b = a
b.append(3)
print(a)  # [1, 2, 3]
```

复制一层可以使用切片、`copy()` 或 `list()`：

```python playground
a = [1, 2]
b = a.copy()
b.append(3)
print(a)  # [1, 2]
```

这些是浅拷贝，嵌套列表的内层对象仍可能共享。嵌套结构需要完全复制时使用 `copy.deepcopy`。

```python playground
import copy

a = [[1], [2]]
b = copy.deepcopy(a)
b[0].append(9)
print(a)  # [[1], [2]]
```

## 原地 API 的返回值

`append`、`extend`、`insert`、`sort`、`reverse` 都是原地修改，返回值是 `None`：

```python playground
nums = [3, 1, 2]
result = nums.sort()
print(result)  # None
print(nums)    # [1, 2, 3]
```
