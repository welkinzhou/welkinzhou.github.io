---
sidebar_position: 2
slug: nodes
title: "Node 与 Runnable：先把一步写清楚"
description: "从普通 Python 函数开始，理解 Runnable、StateGraph、状态更新与 reducer。"
tags: [Python, LangChain, LangGraph]
---

# Node 与 Runnable：先把一步写清楚

上一篇确定了要做知识库问答。不过，先别急着调用模型。用户输入可能有多余空白，我们先把这一件事写成函数，再看看它怎样成为图中的节点。

## 先写普通函数

```python
def clean_query(text: str) -> str:
    return " ".join(text.split())


print(clean_query("  RAG   怎么更新？  "))
# RAG 怎么更新？
```

`split()` 不传分隔符时会按连续空白拆分，`join()` 再把它们拼好。这个函数只负责规范化文本，不会把问题改写成另一个意思，也不负责检索。

输入、输出和职责清楚后，单独验证这个步骤就很容易。

## Runnable 给可执行对象统一的调用方式

LangChain 中许多提示模板、模型和检索器都使用 Runnable 接口。常见入口是 `invoke()`，也有 `batch()`、`stream()` 和相应的异步方法；具体对象是否支持真正的增量输出，要看它的实现。

普通函数可以用 `RunnableLambda` 包装：

```python
from langchain_core.runnables import RunnableLambda

normalize_query = RunnableLambda(clean_query)
print(normalize_query.invoke("  RAG   怎么更新？  "))

add_hint = RunnableLambda(lambda query: query + " 索引版本")
pipeline = normalize_query | add_hint
print(pipeline.invoke("  RAG   怎么更新？  "))
# RAG 怎么更新？ 索引版本
```

`|` 在这里表示把前一个对象的输出传给后一个对象，常被称为 LCEL 组合。它适合描述直接的数据流水线。后面 RAG 的 `prompt | model | parser` 也是同一思路。[Runnable API 参考](https://reference.langchain.com/python/langchain-core/runnables/)

Runnable 和 Node 没有一一对应关系。图节点可以直接是 Python 函数，也可以在函数内部调用 Runnable；一个 Runnable 流水线还可以整体作为一个节点的实现。

## Node 读取共享状态，返回本步更新

准备进入 LangGraph 时，需要明确状态里有哪些字段。原始问题保留在 `question`，规范化后的检索词写入 `query`：

```python
from typing import TypedDict


class QueryState(TypedDict):
    question: str
    query: str


def normalize(state: QueryState) -> dict:
    return {"query": " ".join(state["question"].split())}
```

`TypedDict` 表达字典字段的类型约定，运行时仍然是字典，不会自动验证输入，也不会初始化字段。首次调用只传 `question`；`query` 在节点完成后出现。这里返回 `dict`，是为了明确它是部分更新，避免把只返回部分字段的结果标成完整 `QueryState`。

节点不用把整个状态复制回来，只返回自己产生的字段。图运行时会应用这些更新。不要在函数里直接修改传入的字典或嵌套列表，否则重试和状态追踪会变得难以判断。

## 把节点接成最小图

```python
from langgraph.graph import END, START, StateGraph

builder = StateGraph(QueryState)
builder.add_node("normalize", normalize)
builder.add_edge(START, "normalize")
builder.add_edge("normalize", END)
graph = builder.compile()

result = graph.invoke({"question": "  RAG   怎么更新？  "})
print(result)
# {'question': '  RAG   怎么更新？  ', 'query': 'RAG 怎么更新？'}
```

`START` 和 `END` 标记入口与结束，`add_node()` 注册执行步骤，`add_edge()` 规定下一步。构图之后调用 `compile()`，才能得到可以 `invoke()` 的图。此时图里没有 LLM，它依然是完整的 LangGraph 程序。[官方 Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)

## reducer 决定怎样合并状态更新

默认情况下，节点返回的字段覆盖对应旧值。假设第一次检索得到两段资料，第二次检索应该用新结果替换它们，而不是不断累积无关片段，这种默认行为正合适。

如果希望累积执行记录，可以明确指定合并函数：

```python
import operator
from typing import Annotated, TypedDict


class TraceState(TypedDict):
    steps: Annotated[list[str], operator.add]


def record_step(state: TraceState) -> dict:
    return {"steps": ["normalize"]}
```

初始 `steps` 为 `[]` 时，这次更新得到 `["normalize"]`。下一个节点再返回 `["retrieve"]`，它们会合并成 `["normalize", "retrieve"]`。上面是 reducer 的独立示意，没有把它加入前面的 `QueryState` 图。[状态与 reducer](https://docs.langchain.com/oss/python/langgraph/use-graph-api)

注意每步只返回新增记录。如果返回旧列表加新列表，reducer 又追加一次，旧内容就会重复。并行节点同时写同一个没有 reducer 的字段，也可能造成更新冲突。

现在可以运行 [nodes.py](/examples/langchain/nodes.py)，先验证 Runnable 与单节点图的结果。下一步把查询交给检索器：[RAG：把文档变成可检索的证据](./03-rag.md)。
