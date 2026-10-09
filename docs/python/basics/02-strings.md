---
sidebar_position: 2
slug: strings
title: "字符串：索引、切片与常用 API"
description: "用索引和切片访问文本，组合字符串 API 清理和规范化输入。"
tags: [Python]
---

# 字符串：索引、切片与常用 API

用索引和切片访问文本，组合字符串 API 清理和规范化输入。

## 字符串索引和切片

字符串是有序序列，可以按位置读取。索引从 `0` 开始；负数索引从末尾倒数。单个索引越界会抛出 `IndexError`，切片越界则会自动截到有效范围。

```python playground
text = "python"

text[0]     # "p"
text[-1]    # "n"
text[1:4]   # "yth"，左闭右开
text[:2]    # "py"
text[2:]    # "thon"
text[::2]   # "pto"，步长为 2
text[::-1]  # "nohtyp"，反向切片
```

## 字符串不可变

字符串创建后不能通过下标修改字符；字符串方法通常返回一个新字符串，不会修改原字符串。

```python playground
name = " Ada "
clean_name = name.strip().lower()

print(clean_name)  # "ada"
print(name)        # " Ada "，原字符串不变

# name[0] = "a"  # TypeError：字符串不支持按下标赋值
```

## 常用字符串 API

```python playground
line = "  alpha,beta,,gamma  "

line.strip()                   # 去掉两端空白
line.split(",")                # 按逗号切分，保留中间的空字段
" ".join(["alpha", "beta"])   # 用空格连接字符串序列
line.replace(",", "|")         # 替换所有匹配内容
line.lower()                   # 转为小写
line.startswith("  alpha")     # 判断前缀
line.endswith("gamma  ")       # 判断后缀
line.find("beta")              # 返回首次出现位置；未找到返回 -1
line.count(",")                # 统计子串出现次数
```

要注意调用方向：`split` 是字符串方法，`join` 也是字符串的方法，接收一个字符串序列。用非字符串元素调用 `join` 会报 `TypeError`。

## API 组合小例子：规范化逗号分隔输入

```python playground
raw = "  red, green,, BLUE  "

items = [part.strip().lower() for part in raw.split(",") if part.strip()]
normalized = ", ".join(items)

print(items)       # ["red", "green", "blue"]
print(normalized)  # "red, green, blue"
```

这里 `split` 负责切分，`strip` 清理每段两端空白，`lower` 统一大小写，`if part.strip()` 过滤空字段，最后用 `join` 拼回一个字符串。
