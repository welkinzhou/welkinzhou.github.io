"""A fixed RAG workflow with a bounded retrieval retry."""
from typing import Literal, TypedDict

from langchain_core.documents import Document
from langgraph.graph import END, START, StateGraph

from rag_common import QUESTION, build_answer_chain, build_retriever, format_docs


class RagState(TypedDict):
    question: str
    query: str
    docs: list[Document]
    attempts: int
    answer: str


def build_workflow(retriever, answer_chain):
    def prepare(state: RagState) -> dict:
        return {
            "query": " ".join(state["question"].split()),
            "attempts": 0,
            "docs": [],
            "answer": "",
        }

    def retrieve(state: RagState) -> dict:
        return {
            "docs": retriever.invoke(state["query"]),
            "attempts": state["attempts"] + 1,
        }

    def route(state: RagState) -> Literal["generate", "rewrite", "abstain"]:
        if state["docs"]:
            return "generate"
        if state["attempts"] < 2:
            return "rewrite"
        return "abstain"

    def rewrite(state: RagState) -> dict:
        # A fixed expansion for this lesson's index-update question, not a general rewriter.
        return {"query": state["query"] + " 索引更新 旧版本 缓存失效"}

    def generate(state: RagState) -> dict:
        return {"answer": answer_chain.invoke({
            "question": state["question"],
            "context": format_docs(state["docs"]),
        })}

    def abstain(state: RagState) -> dict:
        return {"answer": "检索两次仍无资料，请补充文档或缩小问题范围。"}

    builder = StateGraph(RagState)
    for name, node in [
        ("prepare", prepare), ("retrieve", retrieve), ("rewrite", rewrite),
        ("generate", generate), ("abstain", abstain),
    ]:
        builder.add_node(name, node)
    builder.add_edge(START, "prepare")
    builder.add_edge("prepare", "retrieve")
    builder.add_conditional_edges("retrieve", route)
    builder.add_edge("rewrite", "retrieve")
    builder.add_edge("generate", END)
    builder.add_edge("abstain", END)
    return builder.compile()


if __name__ == "__main__":
    graph = build_workflow(build_retriever(), build_answer_chain())
    for update in graph.stream({"question": QUESTION}, stream_mode="updates"):
        print(update)
