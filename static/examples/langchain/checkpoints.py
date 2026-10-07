"""Pause to review an answer, then resume; no model credentials needed."""
from typing import TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


class ReviewState(TypedDict):
    answer: str
    approved: bool


def review(state: ReviewState) -> dict:
    decision = interrupt({"answer": state["answer"], "action": "确认引用后展示"})
    if not isinstance(decision, bool):
        raise ValueError("审批结果必须是 bool")
    return {"approved": decision}


def finish(state: ReviewState) -> dict:
    if not state["approved"]:
        return {"answer": "答案未通过审核，请补充证据。"}
    return {}


def build_review_graph():
    builder = StateGraph(ReviewState)
    builder.add_node("review", review)
    builder.add_node("finish", finish)
    builder.add_edge(START, "review")
    builder.add_edge("review", "finish")
    builder.add_edge("finish", END)
    return builder.compile(checkpointer=InMemorySaver())


if __name__ == "__main__":
    graph = build_review_graph()
    config = {"configurable": {"thread_id": "rag-review-1"}}
    paused = graph.invoke({"answer": "更新文件后还要重建索引。[index.md]"}, config)
    print(paused["__interrupt__"][0].value)
    print(graph.invoke(Command(resume=True), config))
