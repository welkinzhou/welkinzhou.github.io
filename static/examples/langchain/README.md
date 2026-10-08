# LangChain / LangGraph 与 RAG 示例

配套教程：https://welkinzhou.github.io/docs/langchain/intro

需要 Python 3.10+，建议 Python 3.11+。在本目录创建独立环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python nodes.py
python checkpoints.py
```

Windows PowerShell 的激活命令为 `.venv\Scripts\Activate.ps1`。
以上两个脚本无需模型密钥；RAG 示例使用内置的三份短资料和内存向量索引。

运行真实 RAG 前，设置环境变量（以下为 macOS / Linux shell 写法）：

```bash
export OPENAI_API_KEY="你的 API Key"
export CHAT_MODEL="你账号可用的聊天模型 ID"
export EMBEDDING_MODEL="text-embedding-3-small"

python rag.py
python workflow.py
python agent_graph.py
python agent_graph.py --explicit
```

PowerShell 使用 `$env:变量名 = "值"` 设置环境变量。
Agent 示例要求聊天模型支持工具调用。模型调用需要网络，可能产生服务费用。
每次启动 RAG 脚本都会重新生成文档向量，进程退出后内存索引丢失。

`rag_common.py` 提供共享文档、检索器和模型配置，其他脚本需要和它保存在同一目录。
依赖采用稳定版本范围；需要固定完整环境时，安装成功后执行 `python -m pip freeze > requirements.lock.txt`。

已在 Python 3.12、LangChain 1.4.3、LangGraph 1.2.14 下完成离线接口与控制流检查。
这些检查使用模拟向量和固定模型返回值，不包含真实服务的检索与回答质量评估。
