---
sidebar_position: 1
slug: collections
title: "collections：计数、分组与双端队列"
description: "用 Counter 统计频次、defaultdict 初始化分组、deque 管理两端进出的数据。"
tags: [Python]
---

# collections：计数、分组与双端队列

用 Counter 统计频次、defaultdict 初始化分组、deque 管理两端进出的数据。

## `Counter`：计数器

`Counter` 是字典的子类，专门用于统计可迭代对象中每个元素出现的次数：

```python playground
from collections import Counter

counts = Counter("banana")
print(counts)
# Counter({"a": 3, "n": 2, "b": 1})

counts["a"]          # 3
counts["z"]          # 0，不会抛 KeyError
counts.most_common(2) # [("a", 3), ("n", 2)]
```

也可以直接从字典或关键字参数创建：

```python playground=python-standard-library-01-collections
Counter({"red": 2, "blue": 1})
Counter(red=2, blue=1)
```

计数器支持加减和集合式操作：

```python playground=python-standard-library-01-collections
a = Counter("aab")
b = Counter("abc")

a + b  # 计数相加
+a      # 只保留正计数
```

## `defaultdict`：自动初始化默认值

普通字典按键读取不存在的键会抛 `KeyError`；`defaultdict` 会调用默认工厂函数创建值：

```python playground
from collections import defaultdict

numbers_by_type = defaultdict(list)

numbers_by_type["even"].append(2)
numbers_by_type["even"].append(4)
numbers_by_type["odd"].append(1)

# {"even": [2, 4], "odd": [1]}
```

常见默认工厂：

```python playground=python-standard-library-01-collections
counts = defaultdict(int)   # 新键默认 0
unique = defaultdict(set)   # 新键默认空集合
queues = defaultdict(list)   # 新键默认空列表
```

注意：访问不存在的键本身就会创建该键：

```python playground=python-standard-library-01-collections
values = defaultdict(list)
print(values["missing"])  # []
print(values)             # {"missing": []}
```

如果不希望访问时创建键，可以继续使用普通字典的 `get`。

## `deque`：双端队列

`deque` 适合在左右两端高效添加和删除：

```python playground
from collections import deque

queue = deque(["a", "b"])

queue.append("c")       # 右端添加
queue.appendleft("x")   # 左端添加
queue.pop()              # 右端删除
queue.popleft()          # 左端删除
```

两端的 `append`、`appendleft`、`pop`、`popleft` 通常为 O(1)。这比 `list.pop(0)` 和 `list.insert(0, value)` 更适合队列操作。

## `deque` 的其他 API

```python playground=python-standard-library-01-collections
queue = deque([1, 2, 3])

queue.extend([4, 5])
queue.extendleft([0, -1])  # 从左侧逐个加入，最终顺序会反过来
queue.rotate(1)            # 向右旋转一位
queue.clear()
```

`deque(maxlen=3)` 可以创建固定长度的滑动窗口：

```python playground=python-standard-library-01-collections
window = deque(maxlen=3)
for value in [1, 2, 3, 4]:
    window.append(value)
    print(list(window))
# [1]
# [1, 2]
# [1, 2, 3]
# [2, 3, 4]
```

## 三者如何选择

- 统计频次：`Counter`。
- 按键分组，首次访问自动创建列表/集合/计数值：`defaultdict`。
- 两端进出、队列、BFS 或滑动窗口：`deque`。
- 需要按键存储任意结构且不希望访问时自动创建：普通 `dict`。

## 补充：列表头部插入与 `deque`

`list` 没有单独的 `prepend` 或 `appendleft` API。头部插入通常写成：

```python playground
items = ["a", "b"]
items.insert(0, "x")
# ["x", "a", "b"]
```

但列表底层是连续数组，在下标 0 插入时，需要把原有元素整体向后移动，因此时间复杂度是 O(n)。`append` 末尾添加通常是均摊 O(1)，所以列表更适合在末尾追加。

如果需要频繁在两端添加和删除，使用 `collections.deque`：

```python playground
from collections import deque

items = deque(["a", "b"])
items.appendleft("x")  # 左端添加，O(1)
items.append("c")       # 右端添加，O(1)
items.popleft()          # 左端删除并返回，O(1)
items.pop()              # 右端删除并返回，O(1)
```

`deque` 支持按索引读取，但中间位置访问不如列表适合；它的优势是两端操作高效。

其他写法的区别：

```python playground
items = ["a", "b"]
new_items = ["x"] + items  # 创建新列表，O(n)，不修改 items
items[:0] = ["x"]          # 原地头部插入，仍需移动元素，O(n)
```
