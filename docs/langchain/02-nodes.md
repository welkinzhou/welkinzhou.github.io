---
sidebar_position: 2
slug: nodes
title: "Node 与 Runnable"
description: "从获取用户输入开始，逐步串联 RAG 的处理步骤、传递数据，理解 Runnable 与 Node 的作用。"
tags: [Python, LangChain, LangGraph]
---

# Node 与 Runnable

上一篇提出了知识库问答的需求：让模型根据项目文档回答问题。我们更新了文档，模型并不会自动知道其中的新内容。要让回答有资料依据，就需要在回答前，把与当前问题有关的内容提供给模型。

RAG（检索增强生成）就是为此采用的一种方法：根据用户的问题检索相关资料，再把找到的片段和问题一起交给模型，让它根据这些资料生成回答。检索负责找到回答所需的信息，模型负责理解问题和资料、组织答案。这也解释了为什么文档更新后，还需要同步更新用于检索的内容。

要把这套问答流程实现出来，我们需要先获取用户输入，再根据问题查找资料，最后把相关资料与问题一起交给模型。各个步骤之间需要传递数据，原始问题和中间结果也需要保留。本篇从获取用户输入开始，逐步串联处理步骤、组织数据和执行顺序，在完善流程的过程中理解 Runnable 与 Node 的作用。

## 获取用户输入

用户提交的内容可能是知识库问题，也可能只是闲聊。应用需要先获取输入，后续再根据任务决定怎样处理。这里直接传入一段文本，模拟收到的用户输入。

输入可能带有多余空白，我们可以去掉首尾空白，并把连续空白合并成一个空格，供后续步骤使用。用 Python 就可以完成这个处理：

```python playground
def clean_query(text: str) -> str:
    return " ".join(text.split())


print(clean_query("  RAG   怎么更新？  "))
# RAG 怎么更新？
```

`split()` 不传分隔符时会按连续空白拆分，`join()` 再用一个空格连接各部分。示例中的输入变成了“RAG 怎么更新？”，后续可以用它查找资料。`clean_query()` 负责处理获取到的输入，返回整理后的文本。

## Runnable

拿到用户的问题后，接下来还有一系列处理：整理输入、检索资料、组织提示、调用模型，再把模型的输出整理成答案。要完成一次问答，我们需要把这些步骤串联起来，让问题和资料沿着流程传递，最终得到回答。

用普通 Python 函数也能完成串联。以前面的输入处理为例，知识库更新的问题涉及索引版本，我们可以在清理后的文本中补上“索引版本”，作为后续检索的关键词。手动调用时，先执行清理函数，再把它的结果交给关键词补充函数：

```python playground=langchain-python
def add_keywords(query: str, hint: str = "索引版本") -> str:
    return f"{query} {hint}"


query = clean_query("  RAG   怎么更新？  ")
query = add_keywords(query)
print(query)
# RAG 怎么更新？ 索引版本
```

只有两个步骤时，这样写很直接。想想步骤增加后会怎么样？我们要加入检索器、提示模板和模型调用等，它们对数据的要求各不相同。如何处理不同对象的调用方式，如何在步骤之间传递数据？一次处理多个问题或使用异步调用时，整套流程又该怎样执行？

Runnable 用统一的接口规范串联这些处理步骤。提示模板、模型和检索器都支持这套接口，普通函数也可以用 `RunnableLambda` 包装。

`RunnableLambda` 接收 Python 可调用对象，既可以是 `def` 定义的函数，也可以是 `lambda` 表达式。最常见的函数形式是 `func(input) -> output`：接收一份输入，返回处理结果。输入和输出可以是字符串、字典、列表等，不要求类型相同。这里的 `clean_query(text: str) -> str` 接收字符串，也返回字符串，适合直接包装。类型标注用于说明接口，包装不会自动把传入的数据转换成标注的类型。[RunnableLambda API](https://reference.langchain.com/python/langchain-core/runnables/base/RunnableLambda)

包装时传入 `clean_query` 这个函数本身，创建 Runnable 不会执行清理。调用 `invoke()` 时才把输入交给它：

```python playground=langchain-runnable
from langchain_core.runnables import RunnableLambda

normalize_query = RunnableLambda(clean_query)
print(normalize_query.invoke("  RAG   怎么更新？  "))
# RAG 怎么更新？
```

这里的参数传递相当于调用 `clean_query("  RAG   怎么更新？  ")`。`invoke()` 将输入作为函数的第一个位置参数传入，对应 `text`，函数返回的字符串就是这次调用的结果。参数名不必叫 `input`，按位置传入即可。[函数调用与参数传递](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/runnables/config.py)

我们也可以把补充关键词的函数包装起来，声明两个步骤的先后关系：

```python playground=langchain-runnable
add_hint = RunnableLambda(add_keywords)
pipeline = normalize_query | add_hint
print(pipeline.invoke("  RAG   怎么更新？  "))
# RAG 怎么更新？ 索引版本
```

`normalize_query | add_hint` 把清理输入和补充关键词串联成了一个 `pipeline`，这种写法称为 LCEL 组合。**用 `|` 串联时，每个步骤接收上一步的返回值作为输入，自己的返回值再交给下一步。** 第一个步骤接收 `pipeline.invoke()` 传入的输入，最后一个步骤的返回值就是整个流程的结果。[LCEL 的顺序组合](https://reference.langchain.com/python/langchain-core/runnables/base/RunnableSequence)

在这个 `pipeline` 中，原始文本传给 `clean_query()`，它返回的字符串传给 `add_keywords()` 的 `query` 参数，`hint` 使用默认值“索引版本”。最终返回补充关键词后的字符串，相当于 `add_keywords(clean_query(text))`。调用方只需要提交输入，不用再逐个调用内部函数、传递中间结果。

如果关键词也由调用方提供，就需要同时传入问题和关键词。可以把它们放在同一份字典里，让包装函数读取字段，再调用原来的函数：

```python playground=langchain-runnable
prepare_query = RunnableLambda(
    lambda data: add_keywords(clean_query(data["question"]), data["hint"])
)

print(prepare_query.invoke({
    "question": "  RAG   怎么更新？  ",
    "hint": "缓存失效",
}))
# RAG 怎么更新？ 缓存失效
```

`lambda` 接收的是整个字典，`data["question"]` 和 `data["hint"]` 由我们取出并传给业务函数。RunnableLambda 不会根据字典的键自动拆分参数，也不会把列表或元组自动展开成多个位置参数。函数需要多项业务数据时，可以像这样增加适配函数，也可以直接让业务函数接收字典。

函数还可以声明名为 `config` 或 `run_manager` 的参数，RunnableLambda 会按需传入运行配置或回调管理器；它们与问题、关键词这些业务输入用途不同。异步函数可以用 `async def` 定义，直接包装后使用 `await runnable.ainvoke(input)` 调用；同时提供同步和异步实现时，使用 `RunnableLambda(sync_func, afunc=async_func)`。[RunnableLambda 函数形式](https://reference.langchain.com/python/langchain-core/runnables/base/RunnableLambda)

统一接口的价值会随着流程变长而更明显。步骤串联好后，整个流程仍然使用同一套接口：用 `invoke()` 处理一个问题，用 `batch()` 处理多个问题，也可以使用 `ainvoke()` 等异步方法，不需要为每种调用方式重新组织步骤的执行顺序。流式调用使用 `stream()`，能否逐步返回内容仍取决于各个步骤的实现。[Runnable 接口与组合说明](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/runnables/base.py#L127)

后面生成 RAG 回答时，我们会把提示模板、模型和输出解析器串联成 `prompt | model | parser`：提示模板准备模型输入，模型生成回答，解析器整理输出。串联时仍需让前一步的输出符合后一步的输入要求。例如，这里的清理函数返回字符串，关键词补充函数也接收字符串。[Runnable API 参考](https://reference.langchain.com/python/langchain-core/runnables/)

## 共享状态

前面的 LCEL 示例在步骤之间传递一个字符串。问答流程继续完善时，需要保留的数据会更多：检索需要当前检索词，生成回答需要原始问题和找到的资料，检查执行过程时还需要中间结果。可以把这些数据放在同一份字典中，让各个步骤读取所需字段。

以前面的输入处理为例，补充关键词后得到的检索词可能继续调整，但模型最终要回答的仍是用户原来的问题。把原始问题和当前检索词分别保存在状态中，检索和回答生成就可以读取各自需要的内容。

LCEL 也可以传递字典，传递规则仍然是“上一步返回什么，下一步就接收什么”。某一步只返回 `{"query": ...}`，下一步拿到的就只有这个字典，先前输入中的 `question` 不会自动保留下来。要继续传递原始问题，这一步的输出就需要同时包含 `question` 和 `query`，可以在函数中组织这份输出，也可以使用 LCEL 的字段组合能力。

LangGraph 则由图维护一份共享状态，处理步骤作为 Node（节点）读取状态、返回字段更新。**节点可以只返回需要更新的字段，图会将这些字段应用到已有状态中，未更新的字段继续保留。** 这是图的状态更新机制，与 LCEL 直接传递步骤返回值的方式不同。下面先定义状态和节点函数，用 `question` 保存原始问题，让 `normalize` 返回整理后的 `query`：

```python
from typing import TypedDict


class QueryState(TypedDict):
    question: str
    query: str


def normalize(state: QueryState) -> dict:
    return {"query": " ".join(state["question"].split())}
```

`normalize` 本身是普通 Python 函数，接收一个字典，返回只包含 `query` 的字典。这里按 LangGraph 节点的约定，把返回值作为状态的局部更新。图应用更新后，状态中同时有原有的 `question` 和新的 `query`。[LangGraph 节点与状态](https://docs.langchain.com/oss/python/langgraph/graph-api)

如果把同一个函数用 `RunnableLambda(normalize)` 包装并接入 LCEL，它返回的 `{"query": ...}` 就是下一步的完整输入，LCEL 不会自动把原有的 `question` 合并进去。函数接收字典、返回字典这一形式两边都能使用；将返回值解释为局部更新并合并到共享状态，是 LangGraph 在本例中完成的工作。

`QueryState` 中的两个字段对应问答流程需要保留的数据。`TypedDict` 表达这些字段的类型约定，运行时仍然是字典，不会自动验证输入，也不会初始化字段。首次调用图时只传 `question`，节点执行后再产生 `query`。这里返回 `dict`，是为了明确它是部分更新，避免把只返回部分字段的结果标成完整 `QueryState`。

节点不用把整个状态复制回来，只返回自己产生的字段。图运行时会应用这些更新。不要在函数里直接修改传入的字典或嵌套列表，否则重试和状态追踪会变得难以判断。

## 组织执行顺序

定义了 `normalize`，还需要把它注册为节点，指定图的入口与结束位置，才能由图运行这个处理步骤。LangGraph 用 `StateGraph` 构图。下面只注册一个输入处理节点，让流程从 `START` 进入 `normalize`，处理完成后到达 `END`：

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

`START` 和 `END` 标记入口与结束，`add_node()` 注册执行步骤，`add_edge()` 规定下一步。构图之后调用 `compile()`，才能得到可以 `invoke()` 的图。运行后，状态中同时保留原始问题和清理后的检索词，后续节点就可以根据各自的用途读取它们。[官方 Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)

这里的 `normalize` 是图中的 Node，图负责何时执行它，以及怎样把返回的字段合并到状态中。前面的 `normalize_query` 和 `pipeline` 则是 Runnable，负责按输入得到输出。两者可以配合使用：如果希望节点同时清理输入、补充关键词，可以在 `normalize` 中调用 `pipeline.invoke(state["question"])`，把得到的检索词放进 `{"query": ...}` 返回。节点内部的处理交给 Runnable，节点之间的执行与状态更新交给图。

目前的示例只有线性处理，虽然两者组织数据的方式不同，从完成输入整理、保留数据的效果看，差异还不大，使用 LCEL 也能完成。本篇先熟悉图的节点、状态与执行顺序；后面的 [Workflow](./04-workflow.md) 会加入根据检索结果选择分支、调整检索词并返回检索步骤的流程，届时再看图如何组织这些执行路径。

## 更新状态

流程接上检索后，除了问题和检索词，我们还需要保存找到的资料。如果调整检索词后重新查找，就需要用新结果替换旧资料。LangGraph 默认用节点返回的字段覆盖对应旧值，适合这种更新方式。

如果还想知道一次问答经过了哪些步骤，执行记录就需要保留之前的内容，并在每完成一步时追加新记录。可以为记录字段指定合并函数，称为 reducer。**reducer 配置在状态字段上，由图应用该字段的更新时调用，无需把它注册成节点。**

我们在前面的 `QueryState` 上增加 `steps` 字段。`TracedQueryState` 继承原有的 `question` 和 `query`，仍然保存同一次问答的数据，只是多了一份执行记录：

```python
import operator
from typing import Annotated


class TracedQueryState(QueryState):
    steps: Annotated[list[str], operator.add]
```

`Annotated` 在字段类型之外附加合并规则。这里的 `operator.add` 接收已有的 `steps` 和节点本次返回的 `steps`，对列表执行拼接。例如，已有 `["normalize"]`，本次返回 `["expand_query"]`，合并结果就是 `["normalize", "expand_query"]`。`question` 和 `query` 没有指定 reducer，继续按默认规则覆盖更新。[状态与 reducer](https://docs.langchain.com/oss/python/langgraph/graph-api#reducers)

为了看到连续两次更新的效果，我们在清理输入之后增加补充关键词的节点 `expand_query`。它复用前面的 `add_keywords()`，为检索词补上“索引版本”。两个业务节点在返回处理结果时，各自附带本步的记录，不需要额外增加记录节点：

```python
def normalize_with_trace(state: TracedQueryState) -> dict:
    return {
        "query": clean_query(state["question"]),
        "steps": ["normalize"],
    }


def expand_query(state: TracedQueryState) -> dict:
    return {
        "query": add_keywords(state["query"]),
        "steps": ["expand_query"],
    }
```

构图时要使用扩展后的 `TracedQueryState`，图才能采用 `steps` 的合并规则。下面重新构建一个图，把原来的单节点流程扩展为 `START → normalize → expand_query → END`。图中的 `normalize` 这次使用带记录的 `normalize_with_trace` 函数：

```python
builder = StateGraph(TracedQueryState)
builder.add_node("normalize", normalize_with_trace)
builder.add_node("expand_query", expand_query)
builder.add_edge(START, "normalize")
builder.add_edge("normalize", "expand_query")
builder.add_edge("expand_query", END)
traced_graph = builder.compile()

result = traced_graph.invoke({
    "question": "  RAG   怎么更新？  ",
    "steps": [],
})
print(result)
# {
#     'question': '  RAG   怎么更新？  ',
#     'query': 'RAG 怎么更新？ 索引版本',
#     'steps': ['normalize', 'expand_query']
# }
```

`normalize` 执行后，图写入清理后的 `query`，把 `["normalize"]` 追加到初始的空记录中。`expand_query` 读取更新后的 `query`，返回补充关键词的结果和 `["expand_query"]`。图用新检索词覆盖旧 `query`，用 reducer 将新记录追加到已有 `steps`；两个节点都没有更新 `question`，原始问题一直保留。

同一次节点更新中，`query` 按覆盖规则处理，`steps` 按累积规则处理。选择哪种规则取决于字段的状态定义，而不是节点的位置或函数名称。修改状态定义后需要按新定义重新构图并 `compile()`，此前已经编译的 `graph` 仍是原来的单节点示例。

这里的 `steps` 已经配置了列表拼接规则，节点只需要返回本步新增的记录。比如 `expand_query` 执行前，状态里已有 `["normalize"]`，它返回 `["expand_query"]`，图会将两者拼成 `["normalize", "expand_query"]`。

如果在节点里先把旧记录也加上，写成下面这样：

```python
# 错误写法：返回值包含了状态中已有的记录。
return {"steps": state["steps"] + ["expand_query"]}
```

这个节点返回的是 `["normalize", "expand_query"]`。图应用更新时，reducer 仍会把已有记录与节点返回的记录拼接，得到：

```text
["normalize"] + ["normalize", "expand_query"]
= ["normalize", "normalize", "expand_query"]
```

旧记录因此出现了两次。节点负责提供本次新增内容，已有内容的累积交给图中的 reducer 完成。

<details>
<summary>补充说明：并行节点更新同一字段（选读）</summary>

本例的 `normalize` 和 `expand_query` 按顺序执行：前一个节点的更新应用完成，后一个节点才读取状态。它们依次更新 `query`，新值可以正常覆盖旧值。

如果两个节点在同一轮并行执行，并且都返回 `query` 的新值，图就会同时收到两份更新。`query` 使用默认的覆盖规则，不能接收同一轮的多个值，LangGraph 会报更新冲突。可以调整执行顺序，或为字段定义符合业务需要的合并规则；例如需要收集多个节点的记录时，使用 `steps` 这样的列表累积规则。[官方并行更新冲突说明](https://docs.langchain.com/oss/python/langgraph/errors/INVALID_CONCURRENT_GRAPH_UPDATE)

</details>

完整代码见 [nodes.py](/examples/langchain/nodes.py)，运行 `python nodes.py` 可以查看用户输入如何经过连续处理，以及图如何更新检索词、累积执行记录。我们已经从获取到的用户输入中准备了检索词，也了解了怎样串联处理步骤、保留数据和安排执行顺序。下一篇 [RAG](./03-rag.md) 会继续接上资料检索与回答生成。
