---
sidebar_position: 6
slug: prefix-sums
title: "前缀和与区间求和"
description: "先预处理前缀累计值，再用一次减法回答闭区间求和查询。"
tags: [Python]
---

# 前缀和与区间求和

先预处理前缀累计值，再用一次减法回答闭区间求和查询。

## 示例题目

给定整数列表，多次查询某个闭区间 `[left, right]` 的元素和。例如：

```python playground=python-algorithms-06-prefix-sums
nums = [2, 4, 1, 3, 5]
query(1, 3)  # 4 + 1 + 3 = 8
```

如果每次查询都直接循环区间，单次查询最坏需要 O(n)。当查询次数很多时，可以先构造前缀和。

## 思路

定义 `prefix[i]` 表示原列表前 `i` 个元素的和，因此 `prefix[0] = 0`：

```text
prefix[0] = 0
prefix[1] = nums[0]
prefix[2] = nums[0] + nums[1]
...
```

闭区间 `[left, right]` 的和可以用：

```text
prefix[right + 1] - prefix[left]
```

因为 `prefix[right + 1]` 包含了 `0` 到 `right` 的和，减去 `prefix[left]` 后就只剩 `left` 到 `right`。

## 示例代码

```python playground=python-algorithms-06-prefix-sums
class RangeSum:
    def __init__(self, nums: list[int]):
        self.prefix = [0]

        for num in nums:
            self.prefix.append(self.prefix[-1] + num)

    def query(self, left: int, right: int) -> int:
        if left < 0 or right >= len(self.prefix) - 1 or left > right:
            raise IndexError("区间下标无效")

        return self.prefix[right + 1] - self.prefix[left]


range_sum = RangeSum([2, 4, 1, 3, 5])
print(range_sum.query(1, 3))  # 8
print(range_sum.query(0, 4))  # 15
```

预处理前缀和需要 O(n) 时间和 O(n) 空间；每次查询只做减法，时间复杂度 O(1)。适合“数组不变、查询很多”的场景。如果数组频繁修改，前缀和需要更新，通常要考虑树状数组或线段树等结构。

## 关键边界

这里使用长度为 `n + 1` 的前缀数组：

```python playground=python-algorithms-06-prefix-sums
prefix = [0] * (len(nums) + 1)
```

多出的第一个 `0` 让从下标 `0` 开始的区间也能统一计算：

```python playground=python-algorithms-06-prefix-sums
total = prefix[right + 1] - prefix[0]
```
