---
sidebar_position: 1
slug: traversal
title: "遍历与状态更新：求最大值"
description: "通过最简单的遍历练习理解条件判断、状态更新和空输入边界。"
tags: [Python]
---

# 遍历与状态更新：求最大值

通过最简单的遍历练习理解条件判断、状态更新和空输入边界。

## 示例题目

给定一个非空整数列表，返回其中最大的数字。例如 `[3, 1, 8, 2]` 应返回 `8`。

## 思路

先把第一个元素当作当前最大值。然后从第二个元素开始逐个比较：发现更大的数，就更新当前最大值。遍历结束后，当前最大值就是答案。

列表长度为 `n` 时，每个元素最多检查一次，所以时间复杂度是 O(n)。只使用一个变量保存当前最大值，额外空间复杂度是 O(1)。题目说明列表非空，因此可以安全地用 `nums[0]` 初始化。

## 示例代码

```python playground=python-algorithms-01-traversal
def find_max(nums: list[int]) -> int:
    if not nums:
        raise ValueError("nums 不能为空")

    current_max = nums[0]

    for index in range(1, len(nums)):
        num = nums[index]
        if num > current_max:
            current_max = num

    return current_max


print(find_max([3, 1, 8, 2]))  # 8
```

## 关键点

- `nums[0]` 取第一个元素；`range(1, len(nums))` 从下标 1 开始遍历，不创建额外切片。
- `nums[index]` 读取当前下标对应的元素。直接遍历 `nums[1:]` 会复制切片，增加 O(n) 额外空间。
- `current_max` 保存遍历到当前位置时的最大值。
- 空列表没有最大值，所以函数明确抛出 `ValueError`，避免访问 `nums[0]` 时出现难懂的 `IndexError`。
- Python 内置的 `max(nums)` 也能求最大值；这道题先手写，是为了理解遍历和状态更新。
