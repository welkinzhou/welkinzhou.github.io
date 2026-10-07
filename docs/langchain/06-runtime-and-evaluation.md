---
sidebar_position: 6
slug: runtime-and-evaluation
title: "运行与评估：流式输出、恢复和质量检查"
description: "观察 RAG 执行轨迹，用 checkpoint 与 interrupt 暂停恢复，并分别检查检索与答案质量。"
tags: [Python, LangGraph, LangSmith, RAG]
---

# 运行与评估：流式输出、恢复和质量检查

前面已经把同一份知识库接进固定 Workflow 和 Agent Graph。现在不再增加工具，先处理实际运行时最容易遇到的问题：正在执行哪一步？答案需要检查时怎样暂停？修改代码后质量有没有变好？

## 流式观察的是哪一种数据

第四篇使用 `stream_mode="updates"`，看到的是节点完成后的字段更新。需要查看每一步累计状态时，可以选择 `values`：

```python
from rag_common import QUESTION, build_answer_chain, build_retriever
from workflow import build_workflow

graph = build_workflow(build_retriever(), build_answer_chain())
for state in graph.stream({"question": QUESTION}, stream_mode="values"):
    print(state.get("attempts"), state.get("answer", ""))
```

这两个模式都不等于逐 token 显示答案。传统 `stream()` 也支持 `messages` 模式；当前官方文档还推荐统一的 `stream_events(..., version="v3")` 接口。本文使用兼容 1.x 基础版本的节点流接口，便于先检查控制流；采用新的事件流前应按所装版本核对支持情况。[官方流式接口](https://docs.langchain.com/oss/python/langgraph/streaming)

对 RAG 来说，应同时记录检索词、候选来源、索引版本、工具轮数和耗时。只显示最终答案，无法判断错误出在资料检索还是生成阶段。

## checkpoint 保存图状态，thread_id 标识执行线程

有了 checkpointer，可以在图的执行边界保存状态。继续同一段对话或恢复暂停时，需要使用相同的 `thread_id`。它是应用传给 LangGraph 的标识，和操作系统线程不是一回事。

`InMemorySaver` 适合本地练习：同一进程里可以继续读取状态，进程退出后数据丢失。需要跨进程恢复时应使用持久化 checkpointer，并保存稳定的线程 ID。向量库的持久化与图状态持久化也是两个不同问题。[官方持久化说明](https://docs.langchain.com/oss/python/langgraph/persistence)

## 暂停审核一个 RAG 答案

为了不依赖模型密钥，下面用一条固定的答案演示审核节点。它可以替换成前面 Workflow 的生成结果，但这里作为独立练习运行：

```python
from typing import TypedDict
from langgraph.types import interrupt


class ReviewState(TypedDict):
    answer: str
    approved: bool


def review(state: ReviewState) -> dict:
    decision = interrupt({"answer": state["answer"], "action": "确认引用后展示"})
    if not isinstance(decision, bool):
        raise ValueError("审批结果必须是 bool")
    return {"approved": decision}
```

`interrupt()` 暂停当前执行，并把可 JSON 序列化的载荷交给调用者。恢复值会成为这次 `interrupt()` 的返回值；这个练习只接受布尔结果。

完整的 [checkpoints.py](/examples/langchain/checkpoints.py) 包含 `review → finish` 两个节点，编译时传入 `InMemorySaver()`。运行端这样暂停和恢复：

```python
from langgraph.types import Command
from checkpoints import build_review_graph

graph = build_review_graph()
config = {"configurable": {"thread_id": "rag-review-1"}}

paused = graph.invoke({"answer": "更新文件后还要重建索引。[index.md]"}, config)
print(paused["__interrupt__"][0].value)

# 演示用固定决定；实际应用从审核界面或其他外部输入取得结果。
result = graph.invoke(Command(resume=True), config)
print(result["approved"])  # True
```

传 `False` 时，`finish` 会把答案替换为“答案未通过审核，请补充证据。”。要比较两条路径，应新建图或换一个 `thread_id` 分别开始，不要对已经结束的审核重复提交恢复命令。

暂停后恢复会从被中断节点的开头重新执行，`interrupt()` 之前的代码也会再次运行。因此，邮件发送、数据库写入或扣费等有副作用的操作不应直接放在暂停点之前；需要拆成独立步骤并考虑幂等性。[官方中断与恢复说明](https://docs.langchain.com/oss/python/langgraph/interrupts)

## RAG 评估先拆成两个问题

**检索有没有找对资料？** 对本系列的“知识库更新后还引用旧内容”，应该检查索引更新、版本管理和缓存三个方向是否被候选覆盖。还要加入改写后的问法和资料之外的问题，避免只验证样例原句。

**生成有没有正确使用资料？** 即使检索命中，也要检查回答是否遗漏关键条件、是否编造来源，以及每个结论是否能由引用片段支持。`sources` 字段记录候选来源，不会自动证明答案可靠。

可以先用一个很小的来源命中检查，下面的代码只跑检索，不调用聊天模型：

```python
from rag_common import build_retriever

cases = [
    ("只修改源文件会自动更新向量索引吗？", {"index.md"}),
    ("新旧版本片段为什么不能混在一起？", {"version.md"}),
    ("更新知识库后还要处理哪些缓存？", {"cache.md"}),
]
retriever = build_retriever()
for question, expected in cases:
    found = {doc.metadata["source"] for doc in retriever.invoke(question)}
    recall = len(found & expected) / len(expected)
    print(question, "source recall:", recall)
```

这是手工预期来源的命中比例，不是完整的 chunk 级 Recall@K，也没有衡量无关候选比例。这里仅三份短资料，`k=3` 很容易把它们全部取回，因此这个练习适合检查链路，不足以比较检索算法。需要增加更多候选文档、片段级标注和未命中样本，再看召回率、排序与拒答行为。

Workflow 的有限重试、空结果拒答和 Agent 的工具消息对应关系，则适合用固定返回值做程序检查。不要把这类检查当成真实模型的语义质量评估。

## LangSmith 可选接入

需要查看多次运行的调用轨迹时，可以在启动脚本前设置：

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="你的 LangSmith Key"
export LANGSMITH_PROJECT="rag-notes"
python workflow.py
```

这样可把模型、检索和图的运行串到一起观察。追踪可能记录输入、输出和检索内容；接入私人知识库时要按实际需求配置过滤与脱敏。[追踪快速开始](https://docs.langchain.com/langsmith/observability-quickstart)

当小规模人工检查稳定后，再把问题、预期证据与参考答案整理成数据集，分别评估检索相关性、答案正确性和 groundedness。评估模型的判断也需要用人工标注校准。[官方 RAG 评估教程](https://docs.langchain.com/langsmith/evaluate-rag-tutorial)

## 接下来怎样替换为自己的知识库

保持检索器接口不变，先把三份内置资料换成文件 loader，再为片段增加文档 ID、版本和权限元数据。知识库更新时处理旧片段删除和缓存失效，确保问答读取的是同一版本的索引。

有了代表性问题集，先验证固定 RAG 的效果；步骤明确就保留 Workflow，确实需要动态查询和多种工具时再用 Agent Graph。回到 [系列入口](./01-intro.md)，可以按当前需要重复查看对应阶段。
