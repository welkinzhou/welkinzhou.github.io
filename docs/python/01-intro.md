---
sidebar_position: 1
slug: intro
title: Python 学习笔记
description: 从基础类型和常用 API，到标准库、算法练习与日常 Python 工程。
tags: [Python]
---

# Python 学习笔记

这组笔记从 Python 基础学习的讨论中整理而来，按知识主题重新分类。每篇聚焦一组相关 API，结合短示例、返回值、可变性和边界条件说明；算法练习用于把这些知识串起来。

示例以 Python 3.10 及以上语法为基础，包括 `list[int]` 和 `str | None`。只有涉及 Python 3.14 最大堆 API 的段落要求 3.14 及以上，文中同时保留较早版本的写法。代码片段按小节展示用法，有些会承接前面的变量或表示函数内部模板；完整算法函数可以单独运行。

## 阅读顺序

先掌握基础类型、容器和迭代方式，再查看标准库与容器选型。通过少量算法理解边界和复杂度后，转向日常工程中的函数设计、模块组织和文件处理。已有其他语言经验时，可以直接从各篇常用 API 和注意事项开始。

## 基础类型与语法

建立数值、容器、迭代、类型标注与异常处理的基础。

- [数值运算：取整、取余与位运算](./basics/01-numbers.md)：理解向下取整、向零截断、舍入到偶数，以及负数的取余和位运算规则。
- [字符串：索引、切片与常用 API](./basics/02-strings.md)：用索引和切片访问文本，组合字符串 API 清理和规范化输入。
- [列表：增删改查、排序与复制](./basics/03-lists.md)：区分新对象和原地修改，理解切片、浅拷贝、深拷贝与返回值。
- [元组、解包与集合](./basics/04-tuples-sets.md)：用元组表达固定结构，用解包接收多个值，用集合去重和判断成员。
- [字典：读写、分组与链式调用](./basics/05-dictionaries.md)：掌握键值读写、动态视图、setdefault 分组，以及链式调用的返回值。
- [内置函数与迭代工具](./basics/06-builtins.md)：通过 enumerate、zip、map、filter、any、all 和 sorted 处理可迭代数据。
- [推导式、生成器与迭代器](./basics/07-iteration.md)：区分立即构造结果和惰性计算，理解可迭代对象、迭代器与一次性消费。
- [类型标注、异常与 dataclass](./basics/08-typing-errors-dataclasses.md)：声明预期类型、处理缺失值和异常，并用 dataclass 表达结构化数据。

## 标准库与容器选择

用 collections、heapq、bisect 处理计数、队列和有序数据，并理解复杂度。

- [collections：计数、分组与双端队列](./standard-library/01-collections.md)：用 Counter 统计频次、defaultdict 初始化分组、deque 管理两端进出的数据。
- [heapq 与 bisect：堆、Top-K 与有序查找](./standard-library/02-heapq-bisect.md)：区分堆结构与完整排序，理解 Top-K 的候选堆，以及二分插入的位置和成本。
- [容器操作复杂度与选型](./standard-library/03-complexity.md)：根据访问、查找、插入和删除模式选择容器，避免在循环中累积高成本操作。

## 算法练习

通过遍历、哈希、双指针、滑动窗口、二分和前缀和串起基础 API。

- [遍历与状态更新：求最大值](./algorithms/01-traversal.md)：通过最简单的遍历练习理解条件判断、状态更新和空输入边界。
- [哈希查找与频次统计](./algorithms/02-hashing.md)：把字典用于数字计数、两数之和、字母异位词和可重排回文串。
- [双指针：原地整理与合并](./algorithms/03-two-pointers.md)：用读写指针整理有效前缀，用逆向合并避免覆盖尚未处理的数据。
- [滑动窗口：无重复字符的最长子串](./algorithms/04-sliding-window.md)：维护左右边界，用集合或最近下标记录保证窗口内没有重复字符。
- [二分查找：开闭区间与结束条件](./algorithms/05-binary-search.md)：统一搜索区间、初始化、循环条件与边界更新，避免越界或死循环。
- [前缀和与区间求和](./algorithms/06-prefix-sums.md)：先预处理前缀累计值，再用一次减法回答闭区间求和查询。

## 日常工程

组织函数和模块，用 pathlib 与上下文管理器管理文件。

- [函数参数与参数解包](./engineering/01-functions.md)：设计位置参数、关键字参数和默认值，掌握 args、kwargs 与可变默认值陷阱。
- [模块、包与导入](./engineering/02-modules.md)：把代码组织为可复用模块，理解导入时的执行行为与脚本入口。
- [pathlib、文件读写与 with](./engineering/03-files.md)：用 Path 管理跨平台路径，明确编码，并用 with 可靠地关闭文件。

## 后续学习方向

原讨论已完成以上基础内容与日常工程的前三个主题，后续计划还包括 JSON、CSV、环境变量、正则、日期时间、日志、装饰器、`contextlib`、`async` / `await` / `asyncio`、HTTP 请求、线程与进程，以及测试与代码组织。这些主题尚未形成本文档中的独立教程。

完成这些基础后，可以继续阅读 [LangChain 生态：从 Node 到 Agent Graph](/docs/langchain/intro)。这组实战笔记用同一个知识库问答示例，串起文本切分、向量检索、Workflow、工具调用、状态恢复与 RAG 评估。

## 官方资料

- [Python 教程](https://docs.python.org/zh-cn/3/tutorial/index.html)
- [Python 标准库参考](https://docs.python.org/zh-cn/3/library/index.html)
