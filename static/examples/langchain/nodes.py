"""Run with Python 3.10+; no model credentials needed."""
from typing import TypedDict

from langchain_core.runnables import RunnableLambda
from langgraph.graph import END, START, StateGraph


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


if __name__ == "__main__":
    clean_query = RunnableLambda(lambda text: " ".join(text.split()))
    print(clean_query.invoke("  RAG   怎么更新？  "))
    print(build_graph().invoke({"question": "  RAG   怎么更新？  "}))
