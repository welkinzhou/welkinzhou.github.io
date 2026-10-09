---
sidebar_position: 2
slug: heapq-bisect
title: "heapq 与 bisect：堆、Top-K 与有序查找"
description: "区分堆结构与完整排序，理解 Top-K 的候选堆，以及二分插入的位置和成本。"
tags: [Python]
---

# heapq 与 bisect：堆、Top-K 与有序查找

区分堆结构与完整排序，理解 Top-K 的候选堆，以及二分插入的位置和成本。

## `heapq`：最小堆

堆是一种特殊的列表结构，`heapq` 默认维护最小堆：下标 0 始终是当前最小值。

```python playground
import heapq

heap = []
heapq.heappush(heap, 5)
heapq.heappush(heap, 2)
heapq.heappush(heap, 8)

heap[0]        # 2，查看最小值
heapq.heappop(heap)  # 2，删除并返回最小值
```

也可以把已有列表原地转换成堆：

```python playground=python-standard-library-02-heapq-bisect
nums = [5, 2, 8, 1]
heapq.heapify(nums)
# nums 现在满足堆结构，nums[0] == 1
```

不要把堆列表当作完整排序列表；只有最小元素保证在 `heap[0]`，其他位置只保证堆约束。

## 用堆取 Top-K

```python playground=python-standard-library-02-heapq-bisect
scores = [5, 1, 9, 3, 7]

heapq.nlargest(3, scores)   # [9, 7, 5]
heapq.nsmallest(2, scores)  # [1, 3]
```

对对象按字段取 Top-K：

```python playground=python-standard-library-02-heapq-bisect
items = [("a", 5), ("b", 9), ("c", 3)]
top = heapq.nlargest(2, items, key=lambda item: item[1])
# [("b", 9), ("a", 5)]
```

`heappush` 和 `heappop` 通常是 O(log n)；查看最小值 `heap[0]` 是 O(1)。

## 最大堆写法

Python 3.14 起提供公开的最大堆 API，可以直接维护堆顶为最大值的列表：

```python playground
import heapq

max_heap = [5, 2, 8]
heapq.heapify_max(max_heap)
heapq.heappush_max(max_heap, 9)
largest = heapq.heappop_max(max_heap)  # 9
```

较早版本可对数值取负，再使用最小堆 API：

```python playground=python-standard-library-02-heapq-bisect
values = [5, 2, 8]
max_heap = [-value for value in values]
heapq.heapify(max_heap)

largest = -heapq.heappop(max_heap)
# 8
```

## `bisect`：有序列表上的二分

`bisect` 要求列表已经有序。`bisect_left` 返回目标值应该插入的最左位置，`bisect_right` 返回最右位置：

```python playground
import bisect

nums = [1, 3, 3, 5, 8]

bisect.bisect_left(nums, 3)   # 1
bisect.bisect_right(nums, 3)  # 3
bisect.bisect_left(nums, 4)   # 3
```

保持列表有序地插入：

```python playground=python-standard-library-02-heapq-bisect
bisect.insort(nums, 4)
# [1, 3, 3, 4, 5, 8]
```

二分查找位置是 O(log n)，但向列表中间插入仍需要移动元素，`insort` 的整体插入成本是 O(n)。

## 判断是否存在和统计范围

```python playground=python-standard-library-02-heapq-bisect
nums = [1, 3, 3, 5, 8]
left = bisect.bisect_left(nums, 3)
right = bisect.bisect_right(nums, 3)

exists = left < len(nums) and nums[left] == 3
count = right - left
```

`bisect` 只负责查找插入位置，不负责验证列表是否有序；如果输入无序，结果没有意义。

## 补充：堆操作是否修改原对象

不同 API 的行为不同：

```python playground
import heapq

heap = [2, 5, 8]
heapq.heapify(heap)

smallest = heap[0]
# 只读取最小值，heap 不变

removed = heapq.heappop(heap)
# 删除并返回最小值，heap 被修改

heapq.heappush(heap, 1)
# 添加元素，heap 被修改
```

`heapq.nlargest` 和 `heapq.nsmallest` 返回新的列表，通常不会修改传入的原列表：

```python playground=python-standard-library-02-heapq-bisect
values = [5, 1, 9, 3]
top = heapq.nlargest(2, values)

print(top)     # [9, 5]
print(values)  # [5, 1, 9, 3]
```

它们内部会维护自己的临时堆。相反，`heapify`、`heappush`、`heappop`、`heapreplace` 和 `heappushpop` 都会原地修改作为堆使用的列表。

## 补充：`heapq.nlargest` 的核心实现

以最小堆为例，只保证每个父节点 `<=` 子节点；同层元素之间、不同分支之间不保证全局顺序。因此堆顶是最小值，但堆列表不是排序列表。

`nlargest(k, iterable)` 的核心策略是维护一个大小最多为 `k` 的**最小堆**：

1. 先把前 `k` 个元素放入最小堆。
2. 堆顶是这 `k` 个候选中的最小值，也就是当前 Top-K 的门槛。
3. 继续扫描新元素：如果新元素不大于堆顶，跳过；如果更大，用 `heapreplace` 替换堆顶，让新的候选进入 Top-K。
4. 扫描结束后，堆中正好保存最大的 `k` 个元素。
5. 最后对这 `k` 个元素排序，返回降序结果。堆本身不能直接作为有序结果返回。

伪代码：

```python
def simple_nlargest(k, values):
    if k <= 0:
        return []
    heap = list(values[:k])
    heapq.heapify(heap)

    for value in values[k:]:
        if value > heap[0]:
            heapq.heapreplace(heap, value)

    return sorted(heap, reverse=True)
```

例如 `values = [5, 1, 9, 3, 7]`、`k = 2`：初始堆保存 `[5, 1]`，扫描到 `9` 后替换堆顶 `1`，候选变为 `[5, 9]`；`3` 跳过；`7` 替换堆顶 `5`，最终堆保存 `7` 和 `9`，最后排序得到 `[9, 7]`。

复杂度是 O(N log K)，额外空间 O(K)。标准库还会做优化：`k == 1` 时使用 `max`；如果 `k` 大于等于输入长度，直接整体排序通常更快；传入 `key` 时，堆中会保存键值和原元素。

## 官方参考

- [heapq：堆 API 与 Python 3.14 最大堆接口](https://docs.python.org/3/library/heapq.html)
- [bisect：二分位置查找与有序插入](https://docs.python.org/3/library/bisect.html)
