"""Retrieve first, then generate an answer."""
from rag_common import QUESTION, build_answer_chain, build_retriever, format_docs


def answer_question(question, retriever, answer_chain):
    docs = retriever.invoke(question)
    if not docs:
        return {"answer": "知识库没有返回资料，暂时无法回答。", "sources": []}
    answer = answer_chain.invoke({
        "question": question,
        "context": format_docs(docs),
    })
    return {
        "answer": answer,
        "sources": sorted({doc.metadata["source"] for doc in docs}),
    }


if __name__ == "__main__":
    print(answer_question(QUESTION, build_retriever(), build_answer_chain()))
