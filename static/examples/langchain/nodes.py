"""Run with Python 3.10+; no model credentials needed."""
import operator
from typing import Annotated, TypedDict

from langchain_core.runnables import RunnableLambda
from langgraph.graph import END, START, StateGraph


def clean_query(text: str) -> str:
    return " ".join(text.split())


def add_keywords(query: str, hint: str = "索引版本") -> str:
    return f"{query} {hint}"


normalize_query = RunnableLambda(clean_query)
add_hint = RunnableLambda(add_keywords)
pipeline = normalize_query | add_hint

prepare_query = RunnableLambda(
    lambda data: add_keywords(clean_query(data["question"]), data["hint"])
)


class QueryState(TypedDict):
    question: str
    query: str


def normalize(state: QueryState) -> dict:
    return {"query": " ".join(state["question"].split())}


def build_graph():
    builder = StateGraph(QueryState)
    builder.add_node("normalize", normalize)
    builder.add_edge(START, "normalize")
    builder.add_edge("normalize", END)
    return builder.compile()


class TracedQueryState(QueryState):
    steps: Annotated[list[str], operator.add]


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


def build_traced_graph():
    builder = StateGraph(TracedQueryState)
    builder.add_node("normalize", normalize_with_trace)
    builder.add_node("expand_query", expand_query)
    builder.add_edge(START, "normalize")
    builder.add_edge("normalize", "expand_query")
    builder.add_edge("expand_query", END)
    return builder.compile()


if __name__ == "__main__":
    question = "  RAG   怎么更新？  "

    print("普通函数：", clean_query(question))
    print("手动串联：", add_keywords(clean_query(question)))
    print("Runnable 调用：", normalize_query.invoke(question))
    print("LCEL 串联：", pipeline.invoke(question))
    print("字典输入：", prepare_query.invoke({
        "question": question,
        "hint": "缓存失效",
    }))

    # 直接调用节点函数得到字段更新；图运行时将更新应用到状态。
    print("节点函数返回：", normalize({"question": question}))
    print("图运行后的状态：", build_graph().invoke({"question": question}))
    print("带执行记录的状态：", build_traced_graph().invoke({
        "question": question,
        "steps": [],
    }))
