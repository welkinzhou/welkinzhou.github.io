---
sidebar_position: 1
slug: numbers
title: "数值运算：取整、取余与位运算"
description: "理解向下取整、向零截断、舍入到偶数，以及负数的取余和位运算规则。"
tags: [Python]
---

# 数值运算：取整、取余与位运算

理解向下取整、向零截断、舍入到偶数，以及负数的取余和位运算规则。

## 除法和整除

```python playground
7 / 2   # 3.5，普通除法，结果通常是 float
7 // 2  # 3，向下取整除法
```

`//` 的含义是 floor division，结果向负无穷方向取整，不是简单截断：

```python playground
7 // 2    # 3
-7 // 2   # -4
```

如果想向 0 截断，可以使用 `int`（对浮点数也适用）：

```python playground
int(7 / 2)    # 3
int(-7 / 2)   # -3
```

注意 `int` 是截断，不是四舍五入：

```python playground
int(3.9)   # 3
int(-3.9)  # -3
```

## 四舍五入

```python playground
round(3.6)   # 4
round(3.4)   # 3
round(3.14159, 2)  # 3.14
```

Python 的 `round` 使用“舍入到偶数”规则处理正好在中间的情况：

```python playground
round(2.5)  # 2
round(3.5)  # 4
```

浮点数存在二进制表示误差，金额计算不要直接依赖二进制浮点数的 `round`，可考虑 `decimal.Decimal`。

## 取余 `%`

```python playground
7 % 2   # 1
```

Python 满足：

```python playground=python-basics-01-numbers
a == (a // b) * b + (a % b)
```

取余结果的符号与除数 `b` 相同：

```python playground
7 % 3    # 1
-7 % 3   # 2
7 % -3   # -2
```

这与某些语言中“余数跟随被除数符号”的规则不同。

## `divmod`

`divmod(a, b)` 一次返回整除结果和余数：

```python playground
quotient, remainder = divmod(17, 5)
# quotient == 3, remainder == 2
```

适合时钟换算、分页和进制拆分：

```python playground
hours, minutes = divmod(135, 60)
# 2 小时 15 分钟
```

## 位运算

Python 支持整数位运算：

```python playground
a = 6  # 二进制 110
b = 3  # 二进制 011

a & b   # 按位与：010，结果 2
a | b   # 按位或：111，结果 7
a ^ b   # 按位异或：101，结果 5
~a      # 按位取反，结果 -7
a << 1  # 左移一位，结果 12
a >> 1  # 右移一位，结果 3
```

常见含义：

- `&`：对应位都为 1 才为 1。
- `|`：对应位至少一个为 1。
- `^`：对应位不同为 1。
- `~x`：按补码规则取反，等价于 `-x - 1`。
- `x << n`：左移 n 位，整数场景通常相当于乘以 `2**n`。
- `x >> n`：右移 n 位，Python 对负数执行算术右移。

常见用途是位掩码：

```python playground
READ = 1      # 001
WRITE = 2     # 010
EXECUTE = 4   # 100

permissions = READ | WRITE
bool(permissions & WRITE)   # True，检查是否有写权限
permissions &= ~WRITE        # 移除写权限
```

位运算只适用于整数；布尔值也属于整数的子类，但业务代码中不要为了省字符混淆 `and/or`（逻辑运算）和 `&/|`（位运算）。
