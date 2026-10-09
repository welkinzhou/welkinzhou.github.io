---
sidebar_position: 4
slug: sliding-window
title: "滑动窗口：无重复字符的最长子串"
description: "维护左右边界，用集合或最近下标记录保证窗口内没有重复字符。"
tags: [Python]
---

# 滑动窗口：无重复字符的最长子串

维护左右边界，用集合或最近下标记录保证窗口内没有重复字符。

## 示例题目

给定字符串 `s`，找出其中不含重复字符的最长连续子串长度。例如：

```text
"abcabcbb" -> 3  # "abc"
"bbbbb"    -> 1  # "b"
"pwwkew"   -> 3  # "wke"
```

## 思路

维护一个窗口 `[left, right]`，表示当前不含重复字符的连续子串。`right` 从左到右扩展窗口；如果新字符已经在窗口中，就不断移动 `left` 并移除左侧字符，直到窗口重新满足“无重复”。每一步用当前窗口长度更新最大值。

集合适合判断当前窗口中是否已经存在某字符，平均查找和删除为 O(1)。每个字符最多被 `right` 加入一次、被 `left` 删除一次，所以整体时间复杂度是 O(n)，空间复杂度 O(k)，其中 k 是字符集大小。

## 示例代码：集合版

```python playground=python-algorithms-04-sliding-window
def length_of_longest_substring(s: str) -> int:
    window: set[str] = set()
    left = 0
    best = 0

    for right, char in enumerate(s):
        while char in window:
            window.remove(s[left])
            left += 1

        window.add(char)
        best = max(best, right - left + 1)

    return best


print(length_of_longest_substring("abcabcbb"))  # 3
```

## 字典优化版

可以记录字符最近一次出现的下标，重复时直接把 `left` 跳到更靠右的位置，避免逐个移除：

```python playground=python-algorithms-sliding-window-fast
def length_of_longest_substring_fast(s: str) -> int:
    last_index: dict[str, int] = {}
    left = 0
    best = 0

    for right, char in enumerate(s):
        if char in last_index:
            left = max(left, last_index[char] + 1)

        last_index[char] = right
        best = max(best, right - left + 1)

    return best
```

`max(left, last_index[char] + 1)` 很重要：`left` 只能向右移动，不能因为旧记录而向左退回。
