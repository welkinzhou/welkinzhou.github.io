---
sidebar_position: 5
slug: dictionaries
title: "字典：读写、分组与链式调用"
description: "掌握键值读写、动态视图、setdefault 分组，以及链式调用的返回值。"
tags: [Python]
---

# 字典：读写、分组与链式调用

掌握键值读写、动态视图、setdefault 分组，以及链式调用的返回值。

## 创建和读取

```python
user = {"name": "Ada", "age": 36}

user["name"]          # "Ada"
user.get("name")      # "Ada"
user.get("email")     # None
user.get("email", "未填写")  # "未填写"
```

`user["missing"]` 在键不存在时会抛 `KeyError`；`get` 会返回 `None` 或指定的默认值。

## 添加和更新

```python
user["city"] = "Beijing"       # 添加新键
user["age"] = 37                # 更新已有键

user.update({"age": 38, "job": "engineer"})
# 同时更新 age，并添加 job
```

`update` 也可以接收关键字参数：

```python
user.update(city="Shanghai", active=True)
```

如果多个来源存在同名键，后面的值会覆盖前面的值。

## `setdefault`

`setdefault(key, default)`：键已存在时返回原值，不覆盖；键不存在时写入默认值并返回它。

```python
config = {"timeout": 30}

config.setdefault("timeout", 60)  # 返回 30，原值不变
config.setdefault("retries", 3)   # 写入 retries: 3

print(config)
# {"timeout": 30, "retries": 3}
```

它适合“如果没有就初始化”的场景，例如按类别分组：

```python
groups: dict[str, list[str]] = {}

for name, category in [("a", "x"), ("b", "y"), ("c", "x")]:
    groups.setdefault(category, []).append(name)

# {"x": ["a", "c"], "y": ["b"]}
```

## 遍历键、值和键值对

```python
scores = {"math": 90, "english": 85}

for key in scores.keys():
    print(key)

for value in scores.values():
    print(value)

for key, value in scores.items():
    print(key, value)
```

实际代码中通常可以直接写 `for key in scores`，效果等同于遍历键。`keys()`、`values()` 和 `items()` 返回动态视图，不是独立列表；如果需要列表，可以显式转换：

```python
list(scores.keys())
list(scores.values())
list(scores.items())
```

## 删除和清空

```python
user = {"name": "Ada", "age": 36, "city": "Beijing"}

age = user.pop("age")              # 删除并返回值
city = user.pop("missing", None)   # 不存在时返回默认值
last = user.popitem()               # 删除并返回最后插入的键值对

user.clear()                        # 清空字典
```

`del user["key"]` 也能删除键，但键不存在时会抛 `KeyError`；需要安全删除时优先使用 `pop(key, default)`。

## 字典推导式

```python
scores = {"math": 90, "english": 85, "art": 92}
passed = {subject: score for subject, score in scores.items() if score >= 90}
# {"math": 90, "art": 92}
```

## 常见注意点

- 字典键必须是可哈希对象，字符串、整数、元组通常可以；列表和字典不能作为键。
- 字典键唯一，重复赋值会覆盖旧值。
- `in` 默认检查键：`"name" in user`；检查值要用 `value in user.values()`。
- `keys()`、`values()`、`items()` 在遍历期间不应直接改变字典大小，否则可能抛 `RuntimeError`。

## 补充：链式调用中的返回值与原地修改

```python
groups.setdefault(category, []).append(name)
```

这句可以拆成：

```python
bucket = groups.setdefault(category, [])
bucket.append(name)
```

第一步中，`setdefault` 的行为是：

- `category` 已存在：返回已有的列表，不覆盖它。
- `category` 不存在：先写入一个空列表，再返回这个空列表。

因此 `bucket` 一定是列表，接着可以调用 `bucket.append(name)`。

但 `list.append` 是原地修改方法，修改列表后返回 `None`：

```python
result = bucket.append(name)
print(result)  # None
```

所以要区分：

```python
returned_list = groups.setdefault(category, [])  # 返回列表
returned_value = returned_list.append(name)       # 返回 None
```

整句 `groups.setdefault(...).append(...)` 的最终返回值也是 `None`，但字典内部的列表已经被修改。

常见 API 的返回值规律：

```python
new_list = sorted(nums)  # 返回新列表
result = nums.sort()     # 原地排序，返回 None
item = nums.pop()        # 删除并返回元素
result = nums.append(1)  # 原地添加，返回 None
value = data.get("key") # 返回值或默认值
```

判断一个方法能否继续链式调用时，要看前一个方法返回的对象类型；不要只看它是否修改了对象。通常返回新对象的方法可以继续处理，而 `append/extend/insert/sort/reverse` 这类原地列表方法返回 `None`，不适合继续链式调用。
