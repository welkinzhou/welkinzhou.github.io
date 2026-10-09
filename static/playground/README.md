# Python Playground

文章中只有明确标记的 Python 代码块会显示“打开 Playground”。普通代码块、Vue、模型 API 示例和当前无法在浏览器安装依赖的 LangGraph 示例保留原有展示。

独立片段使用 `python playground`。需要初始化、演示调用或辅助模块时，使用 `python playground=实验-id`，并在 `examples.json` 中添加同名配置：

````markdown
```python playground=python-modules
from helpers import square
print(square(4))
```
````

```json
{
  "python-modules": {
    "entry": "main.py",
    "files": {
      "main.py": "# __PLAYGROUND_CODE__\n",
      "helpers.py": "def square(value):\n    return value * value\n"
    }
  }
}
```

实验 ID 使用英文、数字和短横线，例如 `python-modules`。`# __PLAYGROUND_CODE__` 放在要插入文章片段的文件中，每个实验只放一个。入口可以在片段前后补充初始化与调用。辅助文件也可以使用 `{"url": "/examples/python/helpers.py"}` 引用站点示例目录中的文件。

使用 Runnable / LCEL 时添加 `"packages": "langchain"`，运行环境会加载已验证的 LangChain Core 依赖；不安装模型集成包或 LangGraph。不要给依赖模型、embedding、外部网络或缺少上下文的代码添加运行标记。需要新依赖时先验证真实浏览器执行，不能用替代模块假装原库可运行。

组件按需打开，Python 只在点击“运行”后加载。Pyodide 固定为 314.0.7，提供 Python 3.14；首次运行需要访问官方 CDN，LangChain 依赖还需要访问包索引。执行在 Web Worker 中进行，超过 15 秒会停止；初始化最多等待 180 秒。顶层表达式自动回显，函数内部保持普通 Python 行为。

每次运行重新建立工作目录和主模块命名空间，清除实验目录下模块的导入缓存。运行后保留产生的文本文件，下一次运行带入当前文件内容；“重置”恢复最初实验。支持导入 `.py`、导入导出的项目 `.json`、新增模块及包文件、选择入口。项目导出包含所有文本文件，不保存 Python 对象或二进制文件，最多 50 个文件、1 MB。包内模块作为入口时，应另用根入口通过正常包导入调用。

设置构建环境变量 `PLAYGROUND_ENABLED=false` 可以关闭所有 Playground 入口，默认开启。这是公开功能开关，不能通过 Docusaurus `customFields` 或构建产物传递密钥。本功能没有模型代理、API Key 或远程 Python 执行服务。
