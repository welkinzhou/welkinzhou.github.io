---
sidebar_position: 3
slug: complexity
title: "容器操作复杂度与选型"
description: "根据访问、查找、插入和删除模式选择容器，避免在循环中累积高成本操作。"
tags: [Python]
---

# 容器操作复杂度与选型

根据访问、查找、插入和删除模式选择容器，避免在循环中累积高成本操作。

复杂度用于估计数据规模变大后，操作耗时如何增长。以下以 CPython 的常见实现为背景；下面的 O(1)、O(n)、O(log n) 是常见的平均或典型复杂度；具体还受实现、哈希冲突和数据分布影响。

## `list`

```python playground=python-complexity-list
items[index]       # O(1)，按下标读取
items.append(x)    # 均摊 O(1)，末尾添加
items.pop()        # O(1)，末尾删除
items.insert(0, x) # O(n)，头部插入
items.pop(0)       # O(n)，头部删除
x in items        # O(n)，线性查找
items[a:b]         # O(k)，复制 k 个元素
items.sort()       # O(n log n)
```

列表底层是连续数组，随机访问快，但中间或头部插入/删除需要移动元素。

## `dict` 和 `set`

哈希表的查找、插入和删除平均为 O(1)：

```python playground=python-complexity-dict-set
key in data       # dict/set 平均 O(1)
data[key]         # dict 平均 O(1)
data[key] = value # dict 平均 O(1)
data.pop(key)     # dict 平均 O(1)
item in items     # set 平均 O(1)
items.add(item)   # set 平均 O(1)
```

最坏情况可能退化，但工程中通常按平均 O(1) 使用。`dict` 的键和 `set` 的元素必须是可哈希的；字典的值没有这个要求；列表和字典不能作为键或集合元素。

## `deque`

```python playground=python-complexity-deque
queue.append(x)       # O(1)
queue.appendleft(x)   # O(1)
queue.pop()           # O(1)
queue.popleft()       # O(1)
queue[index]          # 两端较快，中间访问不适合作为主要用途
```

需要两端进出时，用 `deque`，不要反复对列表执行 `pop(0)`。

## `heapq`

```python playground=python-complexity-heap
heapq.heapify(items)   # O(n)
heapq.heappush(heap,x)  # O(log n)
heapq.heappop(heap)    # O(log n)
heap[0]                # O(1)
heapq.nlargest(k, xs)  # 约 O(n log k)，实现会根据情况优化
```

堆适合维护动态 Top-K 或优先队列，不适合直接做完整排序。

## 如何根据需求选容器

```text
按下标随机访问       -> list
末尾追加/删除        -> list
按键查找             -> dict
只关心是否存在/去重  -> set
两端进出             -> deque
持续取最小/最大值    -> heapq
有序列表查找位置     -> bisect
```

例如，下面两种写法功能相近，但复杂度不同：

```python playground=python-standard-library-03-complexity
# 每次从头部删除，整体可能是 O(n²)
while items:
    items.pop(0)

# 双端队列逐个从左侧删除，整体约 O(n)
from collections import deque
items = [1, 2, 3]
queue = deque(items)
while queue:
    queue.popleft()
```
