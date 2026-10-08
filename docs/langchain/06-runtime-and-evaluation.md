---
sidebar_position: 6
slug: runtime-and-evaluation
title: "运行与评估"
description: "查看问答执行过程，加入人工审核，并检查检索结果与答案是否可靠。"
tags: [Python, LangGraph, LangSmith, RAG]
---

# 运行与评估

前面已经用 Workflow 和 Agent Graph 完成了知识库问答。程序运行起来后，还需要知道每一步做了什么，在审核答案时暂停执行，以及检查改动是否改善了检索和回答。本篇围绕这些问题，介绍执行记录、状态恢复和质量评估。

## 查看执行过程

如果答案仍然引用旧内容，我们需要查看检索到了什么、哪些步骤已经完成，才能判断问题出在哪里。Workflow 篇使用 `stream_mode="updates"` 查看节点完成后的字段更新。需要看到每一步执行后的完整状态时，可以选择 `values`：

```python
from rag_common import QUESTION, build_answer_chain, build_retriever
from workflow import build_workflow

graph = build_workflow(build_retriever(), build_answer_chain())
for state in graph.stream({"question": QUESTION}, stream_mode="values"):
    print(state.get("attempts"), state.get("answer", ""))
```

`updates` 返回节点的字段更新，`values` 返回完整状态，适合查看程序执行到了哪里。逐 token 展示模型回答需要使用消息流，而不是这两种状态输出模式。

<details>
<summary>其他流式接口（选读）</summary>

`stream()` 支持 `messages` 模式，官方文档还介绍了 `stream_events(..., version="v3")` 事件接口。使用事件接口前，需要按已安装版本确认支持情况，具体用法见 [官方流式接口](https://docs.langchain.com/oss/python/langgraph/streaming)。

</details>

对 RAG 来说，应同时记录检索词、候选来源、索引版本、工具轮数和耗时。只显示最终答案，无法判断错误出在资料检索还是生成阶段。

## 保存执行状态

如果问答需要暂停后继续执行，我们就需要保存当时的状态。LangGraph 用 checkpointer 在图的执行边界保存状态，保存的记录称为 checkpoint。继续同一段对话或恢复暂停时，需要使用相同的 `thread_id`。它是应用传给 LangGraph 的标识，和操作系统线程不是一回事。

`InMemorySaver` 把状态保存在内存中，适合本地练习。同一进程内可以继续读取，进程退出后数据丢失。需要跨进程恢复时应使用持久化 checkpointer，并保存稳定的线程 ID。向量库的持久化与图状态持久化也是两个不同问题。[官方持久化说明](https://docs.langchain.com/oss/python/langgraph/persistence)

## 人工审核答案

对于需要审核的回答，我们希望先确认引用是否支持结论，再把答案展示给用户。这就需要在答案生成后暂停流程，收到人工决定后继续执行。下面用一条固定答案演示审核过程，可以直接运行，也可以把输入替换为前面 Workflow 生成的回答：

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

`interrupt()` 暂停当前执行，并把可 JSON 序列化的载荷交给调用者。恢复时传入的值会成为 `interrupt()` 的返回值，这里用布尔值表示是否通过审核。

完整的 [checkpoints.py](/examples/langchain/checkpoints.py) 包含 `review → finish` 两个节点，编译时传入 `InMemorySaver()`。下面先调用图取得审核内容，再传入决定继续执行：

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

传入 `False` 时，`finish` 会把答案替换为“答案未通过审核，请补充证据。”。比较通过和未通过两条路径时，分别新建图或使用不同的 `thread_id`，让每次审核从独立状态开始。已经结束的审核无需再次提交恢复命令。

暂停后恢复会从被中断节点的开头重新执行，`interrupt()` 之前的代码也会再次运行。邮件发送、数据库写入或扣费等操作如果放在暂停点之前，就可能被重复执行。这类操作需要拆成独立步骤，并保证重复执行时不会造成额外影响。[官方中断与恢复说明](https://docs.langchain.com/oss/python/langgraph/interrupts)

## 评估问答效果

回答出错可能是没有找到合适资料，也可能是模型没有正确使用资料。评估时分别检查这两个阶段。

### 检查检索结果

对于“知识库更新后还引用旧内容”，检查返回的片段是否包含索引更新、版本管理和缓存的信息。问题集中还需要有不同的问法，以及知识库范围之外的问题，才能看出检索是否适用于更多情况。

每个测试问题都有预期找到的资料来源。把实际检索结果与预期来源比较，就能检查这些资料是否被找到了。下面只调用检索器，先检查这一阶段：

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

这段代码计算检索结果中命中了多少预期来源，用来确认检索和来源记录能正常工作。示例只有三份短资料，`k=3` 很容易全部取回，不能据此判断哪种检索方法更好。

比较检索方法时，需要增加更多候选文档，标注问题对应的片段，并加入未命中的样本，再检查召回率、排序和拒答行为。上面的来源命中比例不等同于片段级 Recall@K，也没有统计无关候选占多少。

### 检查回答质量

找到资料后，还要检查回答是否遗漏关键条件、是否编造来源，以及每个结论能否由引用片段支持。`sources` 记录的是检索候选的来源，答案的引用需要另外核对。

Workflow 的有限重试、空结果拒答和 Agent 的工具消息对应关系，可以用固定返回值检查执行是否正确。模型能否理解问题、正确使用资料，则需要用真实问题和回答评估。

人工检查稳定后，可以把问题、预期证据和参考答案整理成数据集，分别评估检索相关性、答案正确性，以及回答是否有资料支持（groundedness）。评估模型的判断也需要用人工标注校准。[官方 RAG 评估教程](https://docs.langchain.com/langsmith/evaluate-rag-tutorial)

<details>
<summary>LangSmith 追踪（选读）</summary>

需要集中查看多次运行的调用记录时，可以在启动脚本前设置：

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="你的 LangSmith Key"
export LANGSMITH_PROJECT="rag-notes"
python workflow.py
```

LangSmith 可以把模型、检索和图的调用记录放在一起查看。追踪可能记录输入、输出和检索内容，接入私人知识库时需要配置过滤与脱敏。[追踪快速开始](https://docs.langchain.com/langsmith/observability-quickstart)

</details>

## 接入项目文档

把示例用于自己的知识库时，保持检索器接口不变，用文件 loader 读取项目文档，替换三份内置资料，再为片段增加文档 ID、版本和权限元数据。知识库更新时处理旧片段删除和缓存失效，确保问答读取的是同一版本的索引。

用有代表性的问题检查检索和回答后，再根据任务选择执行方式：步骤明确时使用 Workflow，需要模型选择查询方式或工具时使用 Agent Graph。各阶段的文章和运行说明见 [系列入口](./01-intro.md)。
