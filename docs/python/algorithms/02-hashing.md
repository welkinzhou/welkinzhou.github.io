---
sidebar_position: 2
slug: hashing
title: "哈希查找与频次统计"
description: "把字典用于数字计数、两数之和、字母异位词和可重排回文串。"
tags: [Python]
---

# 哈希查找与频次统计

把字典用于数字计数、两数之和、字母异位词和可重排回文串。

## 统计数字出现次数

### 示例题目

给定整数列表 `[2, 1, 2, 3, 1, 2]`，统计每个数字出现几次，结果应为 `{2: 3, 1: 2, 3: 1}`。

### 思路

创建一个空字典 `counts`。遍历列表时，把当前数字当作字典的键：如果它已经出现，就把次数加一；如果第一次出现，就从 0 加到 1。

遍历 n 个数字一次，字典插入和查找平均为 O(1)，所以平均时间复杂度为 O(n)。若有 k 种不同数字，字典需要 O(k) 额外空间。

### 示例代码

```python
def count_numbers(nums: list[int]) -> dict[int, int]:
    counts: dict[int, int] = {}

    for num in nums:
        counts[num] = counts.get(num, 0) + 1

    return counts


print(count_numbers([2, 1, 2, 3, 1, 2]))
# {2: 3, 1: 2, 3: 1}
```

### 关键点

- `dict[int, int]` 表示键和值都是整数的字典。
- `counts.get(num, 0)`：数字在字典里时取已有次数；不在时使用默认值 `0`。
- `counts[num] = ...` 将新次数写回字典。
- 同样的计数也可以用标准库 `collections.Counter(nums)` 完成；手写版本能帮助理解哈希表的查找和更新。

## 两数之和

### 示例题目

给定整数列表 `nums` 和目标值 `target`，找出两个不同元素，使它们的和等于 `target`，返回它们的下标。假设恰好有一个答案，且同一个元素不能使用两次。

例如 `nums = [2, 7, 11, 15]`、`target = 9`，答案是 `[0, 1]`，因为 `nums[0] + nums[1] == 9`。

### 思路

从左到右遍历每个数 `num`。如果它要和另一个数凑成 `target`，另一个数就是 `target - num`，称为补数。用字典保存已经看过的“数字 → 下标”：每一步先查补数是否出现过；若出现，就找到答案。否则把当前数字和下标存入字典。

一定要先查找，再存当前值，这样不会把同一个元素重复使用。遍历 n 个元素，字典查找和写入平均为 O(1)，时间复杂度 O(n)，额外空间复杂度 O(n)。

### 示例代码

```python
def two_sum(nums: list[int], target: int) -> list[int]:
    index_by_num: dict[int, int] = {}

    for index, num in enumerate(nums):
        complement = target - num

        if complement in index_by_num:
            return [index_by_num[complement], index]

        index_by_num[num] = index

    raise ValueError("没有找到符合条件的两个数")


print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
```

### 关键点

- `enumerate(nums)` 同时提供元素下标和值。
- `complement = target - num` 把“找两个数”转化为“查找一个补数”。
- `if complement in index_by_num` 用字典做平均 O(1) 查找。
- 字典记录的是已遍历元素，所以返回的是两个不同位置。
- 暴力枚举所有数对需要 O(n²) 时间；哈希表把时间降到 O(n)，代价是使用 O(n) 额外空间。

## 有效的字母异位词

### 示例题目

给定两个字符串 `s` 和 `t`，判断 `t` 是否由 `s` 中所有字符重新排列得到。字符及其出现次数都必须完全相同。例如 `s = "anagram"`、`t = "nagaram"` 返回 `True`；`s = "rat"`、`t = "car"` 返回 `False`。

### 思路

如果字符串长度不同，字符数量必然不同，可直接返回 `False`。否则用字典统计 `s` 中每个字符出现次数，再遍历 `t` 把对应次数减一。某个字符计数变成负数，说明 `t` 使用了过多的该字符，可以立即返回 `False`。遍历结束后长度相同且没有计数超额，两个字符串的字符频次就完全相同。

遍历两次字符串，时间复杂度 O(n)；若不同字符数为 k，字典空间复杂度 O(k)。

### 示例代码

```python
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False

    counts: dict[str, int] = {}

    for char in s:
        counts[char] = counts.get(char, 0) + 1

    for char in t:
        counts[char] = counts.get(char, 0) - 1
        if counts[char] < 0:
            return False

    return True


print(is_anagram("anagram", "nagaram"))  # True
print(is_anagram("rat", "car"))          # False
```

### 关键点

- 只比较集合是不够的：`"aab"` 和 `"abb"` 的字符集合都为 `{"a", "b"}`，但频次不同。
- `dict.get(char, 0)` 可以在字符第一次出现时从 0 开始计数。
- 负计数表示第二个字符串中某字符出现次数超过第一个字符串。
- Python 字符串按 Unicode 字符处理；若题目限定小写英文字母，也可用长度为 26 的整数列表代替字典。
- 若不需要练习哈希计数，也可以比较 `sorted(s) == sorted(t)`，但排序的时间复杂度是 O(n log n)。

## 最长回文串

### 示例题目

给定一个字符串，可以重新排列其中的字符。求这些字符最多能组成多长的回文串。例如 `"abccccdd"` 的答案是 `7`，因为可以组成 `"dccaccd"`。

### 思路

回文串左右两侧的字符必须成对出现，所以每种字符都可以贡献其频次中最大的偶数部分：`count // 2 * 2`。最多只能有一个字符出现奇数次，并把它放在正中间。因此，把所有字符频次的偶数部分相加；只要存在奇数频次，再额外加 1 作为中心字符。

先用字典统计频次，再遍历各个频次。设字符串长度为 n、不同字符数为 k，时间复杂度 O(n+k)，简写为 O(n)；字典空间复杂度 O(k)。

### 示例代码

```python
def longest_palindrome_length(text: str) -> int:
    counts: dict[str, int] = {}

    for char in text:
        counts[char] = counts.get(char, 0) + 1

    length = 0
    has_odd_count = False

    for count in counts.values():
        length += count // 2 * 2
        if count % 2 == 1:
            has_odd_count = True

    if has_odd_count:
        length += 1

    return length


print(longest_palindrome_length("abccccdd"))  # 7
```

### 关键点

- `count // 2 * 2` 取不超过 `count` 的最大偶数，例如 5 变成 4。
- 偶数频次可以全部使用；奇数频次会剩一个字符，可作为中心，但只能选一个中心。
- 这题求“重新排列后能组成的最长回文串长度”，不是求原字符串中最长的连续回文子串，两者是不同问题。
- 空字符串的频次字典为空，结果自然是 0。
