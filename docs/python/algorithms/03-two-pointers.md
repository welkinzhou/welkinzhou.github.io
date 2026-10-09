---
sidebar_position: 3
slug: two-pointers
title: "双指针：原地整理与合并"
description: "用读写指针整理有效前缀，用逆向合并避免覆盖尚未处理的数据。"
tags: [Python]
---

# 双指针：原地整理与合并

用读写指针整理有效前缀，用逆向合并避免覆盖尚未处理的数据。

## 移除元素

### 示例题目

给定列表 `nums` 和指定值 `val`，原地移除列表中所有等于 `val` 的元素，并返回移除后剩余元素的数量 `k`。不要求保留 `k` 之后的内容。例如 `nums = [3, 2, 2, 3]`、`val = 3`，返回 `2`，并保证 `nums[:2]` 是 `[2, 2]`。

### 思路

用 `write` 作为慢指针，表示下一个应该写入的位置；用 `read` 作为快指针遍历每个元素。如果 `nums[read]` 不等于 `val`，就把它写到 `nums[write]`，然后让 `write` 前进。遇到要删除的值则跳过。

遍历结束后，`write` 就是保留下来的元素数量，列表前 `write` 个位置是结果。这个方法只覆盖列表内容，不会改变 `len(nums)`；题目通过返回的 `k` 指定有效前缀。

每个元素检查一次，时间复杂度 O(n)；只使用两个下标，额外空间复杂度 O(1)。

### 示例代码

```python playground=python-algorithms-03-two-pointers
def remove_element(nums: list[int], val: int) -> int:
    write = 0

    for read in range(len(nums)):
        if nums[read] != val:
            nums[write] = nums[read]
            write += 1

    return write


nums = [3, 2, 2, 3]
k = remove_element(nums, 3)
print(k)        # 2
print(nums[:k]) # [2, 2]
```

### 关键点

- `read` 负责检查所有元素；`write` 负责写入应该保留的元素。
- 满足保留条件时才写入，所以被跳过的值不会进入有效前缀。
- 覆盖写入不会让 Python 列表变短；`nums[:k]` 才是题目要求的有效结果部分。
- 不要在遍历列表时直接逐项 `remove`，删除会移动后续元素，还可能跳过检查。

## 移动零

### 示例题目

给定整数列表 `nums`，把所有 `0` 移到末尾，同时保持非零元素的相对顺序，并且必须原地修改。例如 `[0, 1, 0, 3, 12]` 变成 `[1, 3, 12, 0, 0]`。

### 思路

用 `write` 记录下一个非零元素应该放置的位置。第一次遍历时，把每个非零数依次写到列表前面。由于只按原顺序写入，非零元素的相对顺序会保留。第二次把从 `write` 到列表末尾的位置都填成 `0`。

最多遍历列表两次，仍是 O(n) 时间；只用一个下标和循环变量，额外空间 O(1)。

### 示例代码

```python playground
def move_zeroes(nums: list[int]) -> None:
    write = 0

    # 把所有非零元素按原顺序写到前面
    for num in nums:
        if num != 0:
            nums[write] = num
            write += 1

    # 剩余位置全部补零
    for index in range(write, len(nums)):
        nums[index] = 0


nums = [0, 1, 0, 3, 12]
move_zeroes(nums)
print(nums)  # [1, 3, 12, 0, 0]
```

### 关键点

- `write` 左侧始终放着已经整理好的非零元素。
- 第一次遍历时 `for num in nums` 读取元素，同时把结果写回列表前部；这里写入的位置不会跑到当前读到的位置之后。
- 第二次循环补零，保证列表长度不变且零全部在末尾。
- 函数直接修改原列表，所以返回 `None` 即可；调用后查看原列表。

## 合并两个有序数组

### 示例题目

两个数组 `nums1` 和 `nums2` 都按非递减顺序排列。`nums1` 的长度为 `m + n`，前 `m` 个位置是有效数据，后 `n` 个位置预留为 `0`；`nums2` 有 `n` 个有效元素。请把 `nums2` 合并进 `nums1`，合并后仍按非递减顺序排列，并原地修改 `nums1`。

例如 `nums1 = [1, 2, 3, 0, 0, 0]`、`m = 3`、`nums2 = [2, 5, 6]`、`n = 3`，结果为 `[1, 2, 2, 3, 5, 6]`。

### 思路

从后往前填结果。用三个下标分别指向 `nums1` 的最后一个有效元素、`nums2` 的最后一个元素、以及 `nums1` 的最后一个位置。每次比较前两者，把较大的值放到结果位置，再向左移动对应下标。

从后往前写可避免覆盖 `nums1` 中尚未比较的有效值。`nums2` 若先用完，`nums1` 剩余元素已经在正确位置；若 `nums1` 先用完，则把 `nums2` 剩余部分复制到前面。

最多处理 `m + n` 个元素，时间复杂度 O(m+n)；只用下标，额外空间复杂度 O(1)。

### 示例代码

```python playground=python-algorithms-03-two-pointers
def merge(nums1: list[int], m: int, nums2: list[int], n: int) -> None:
    i = m - 1          # nums1 有效数据的末尾
    j = n - 1          # nums2 的末尾
    write = m + n - 1  # 合并结果的末尾

    while j >= 0:
        if i >= 0 and nums1[i] > nums2[j]:
            nums1[write] = nums1[i]
            i -= 1
        else:
            nums1[write] = nums2[j]
            j -= 1
        write -= 1


nums1 = [1, 2, 3, 0, 0, 0]
merge(nums1, 3, [2, 5, 6], 3)
print(nums1)  # [1, 2, 2, 3, 5, 6]
```

### 关键点

- 只需以 `j >= 0` 为循环条件：`nums2` 剩余元素必须拷贝；若 `nums1` 先耗尽，条件 `i >= 0` 会让代码转而拷贝 `nums2`。
- 如果 `nums2` 先耗尽，`nums1` 尚存的元素无需移动，它们已经处于正确位置。
- 预留的零不是有效数据；比较范围由 `m` 和 `n` 指定。
- 这是“从后向前合并”的典型技巧，适用于目标数组已有足够空位的场景。
