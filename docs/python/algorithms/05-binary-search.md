---
sidebar_position: 5
slug: binary-search
title: "二分查找：开闭区间与结束条件"
description: "统一搜索区间、初始化、循环条件与边界更新，避免越界或死循环。"
tags: [Python]
---

# 二分查找：开闭区间与结束条件

统一搜索区间、初始化、循环条件与边界更新，避免越界或死循环。

## 示例题目

给定一个升序排列的整数列表和目标值，返回目标值的下标；如果不存在，返回 `-1`。

```python
nums = [1, 3, 5, 7, 9]
target = 7
# 返回 3
```

## 思路

在当前搜索区间 `[left, right]` 中取中点 `mid`：

- `nums[mid] == target`：找到答案。
- `nums[mid] < target`：目标只可能在右半部分，令 `left = mid + 1`。
- `nums[mid] > target`：目标只可能在左半部分，令 `right = mid - 1`。

每次排除一半元素，时间复杂度 O(log n)，额外空间复杂度 O(1)。

## 示例代码

```python
def binary_search(nums: list[int], target: int) -> int:
    left = 0
    right = len(nums) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1


print(binary_search([1, 3, 5, 7, 9], 7))  # 3
print(binary_search([1, 3, 5, 7, 9], 4))  # -1
```

## 关键边界

这里使用闭区间 `[left, right]`，所以：

- 初始 `right = len(nums) - 1`。
- 循环条件是 `left <= right`。
- 排除中点时必须使用 `mid + 1` 或 `mid - 1`，否则可能重复检查同一个位置造成死循环。

Python 中也可以使用标准库 `bisect` 查找插入位置：

```python
from bisect import bisect_left

nums = [1, 3, 5, 7, 9]
index = bisect_left(nums, 7)

if index < len(nums) and nums[index] == 7:
    print(index)  # 3
```

`bisect_left` 返回目标值应插入的最左位置；它本身不保证目标存在，所以还要检查 `index < len(nums)` 和 `nums[index] == target`。

## 补充：二分查找的开闭区间与结束条件

二分代码必须先确定区间定义，再统一初始化、循环条件和更新方式。常见有两种。

### 闭区间 `[left, right]`

区间包含左右端点，初始化为 `left = 0`、`right = n - 1`。只要 `left <= right`，区间就可能还有元素；当 `left > right` 时区间为空。

```python
def search_closed(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = (left + right) // 2

        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1   # 排除 mid 和左侧
        else:
            right = mid - 1  # 排除 mid 和右侧

    return -1
```

因为 `mid` 已经比较过，所以排除它时必须使用 `mid + 1` 或 `mid - 1`。

### 左闭右开区间 `[left, right)`

区间包含 `left`，不包含 `right`，初始化为 `left = 0`、`right = n`。区间为空的条件是 `left == right`，因此循环通常写 `left < right`。

这种写法特别适合查找“第一个满足条件的位置”（lower bound）：

```python
def lower_bound(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)

    while left < right:
        mid = (left + right) // 2

        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid

    return left  # left == right，是 target 的最左插入位置
```

因为 `nums[mid] >= target` 时，`mid` 仍可能是答案，所以不能写 `right = mid - 1`，而要保留 `mid`，写成 `right = mid`。

如果要判断目标是否真的存在：

```python
def search_half_open(nums: list[int], target: int) -> int:
    index = lower_bound(nums, target)
    if index < len(nums) and nums[index] == target:
        return index
    return -1
```

### 判断口诀

- `[left, right]`：`right = n - 1`，循环 `left <= right`，排除中点用 `mid ± 1`。
- `[left, right)`：`right = n`，循环 `left < right`；如果中点仍可能是答案，保留它用 `right = mid`。
- 每次更新后，都要保证答案没有被错误排除，并且区间一定缩小，否则可能死循环。

不要混用两套规则，例如用 `right = n` 却写 `while left <= right`，或在左闭右开模板中随意写 `right = mid - 1`。
