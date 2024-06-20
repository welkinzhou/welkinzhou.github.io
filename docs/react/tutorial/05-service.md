---
sidebar_position: 5
tags: [node, server]
---

# 拓展，简单的 Node Server

之前保存商品信息，使用的是 Redux。如果想调用接口，保存相关信息。可以 Node 修改本地 JSON 文件，实现一个简单的 server。

## 基本静态文件响应服务

下面是一个简单

```js
const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "application/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const dataRequestSum = ["products"];

// 一个静态资源返回给前端
const server = http.createServer((req, res) => {
  console.log(req.method); // 请求方式
  console.log(req.url); // 请求地址
  // 根据不同的方式分别处理
  switch (req.method) {
    case "GET":
      // 拼接路径
      let filePath = path.resolve(__dirname, path.join("www", req.url));
      // 判断 url 文件是否存在
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath); //读取文件的详细参数
        const isDir = stats.isDirectory(); // 用来判断读到的是文件还是文件夹
        if (isDir) {
          // 默认文件夹的 index.html
          filePath = path.join(filePath, "index.html");
        }

        if (!isDir || fs.existsSync(filePath)) {
          // 读取资源文件向前端返回
          const content = fs.readFileSync(filePath); // 读取文件
          const { ext } = path.parse(filePath); // 文件拓展名
          console.log(ext);
          const mimeType =
            MIME_TYPES[ext.replace(".", "")] || MIME_TYPES.default;

          const timeStamp = req.headers["if-modified-since"];
          console.log("time", timeStamp, stats.mtimeMs);
          let status = 200;
          if (timeStamp && Number(timeStamp) === stats.mtimeMs) {
            // 该资源没有被修改
            status = 304; // 资源未修改
          }

          // 请求头
          res.writeHead(status, {
            // mime.lookup 查找对应响应体名
            "Content-Type": mimeType,
            "Cache-control": "max-age=86400", // 一天 强缓存设置过期时间
            "Last-Modified": stats.mtimeMs, // 时间戳  资源修改的时间
          });

          return res.end(content);
        }
      }
      
      // TODO 文件查找失败，做其他接口处理
      ...
      
      // 找不到返回 404
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end("<h1>Not Found</h1>");
      break;
		// 其他请求方式处理	
    ...
    default:
     
      break;
  }
});

// 监听 3000 端口
server.listen(3000, () => {
  console.log("server is running at port 3000");
});

```

假设这里要添加接口处理，get 请求加在 TODO 位置即可。

## node 处理 JSON 文件

node 对 JSON 文件支持很好，导入的 JSON 文件会被转化成 JavaScript 对象，对象处理很方便。接下来就是根据路径拦截相应处理逻辑，逻辑很简单。

假设有一个 test.json 文件，内容是：

```json
{
    "good": [
        {
            "id": 1
        },
        {
            "id": 2
        }
    ]
}
```

在 index.js 中导入，并做处理，看一下结果：

```javascript
const sourceData = require("./test.json");

console.log(sourceData); // 得到对象 { good: [ { id: 1 }, { id: 2 } ] }
// 遍历写入文件名
sourceData.good.forEach((data) => {
  data.name = new Date().getTime() + "-file";
});
// 修改后数据输出到文件
// 注意这里的第二个参数，也就是数据必须是 String
fs.writeFile("./test.json", JSON.stringify(sourceData), (err) => {
  if (err) throw err;
  console.log("The file has been saved!");
});
```

最终 test.json 中结果：

```json
{
    "good": [
        {
            "id": 1,
            "name": "1718880423570-file"
        },
        {
            "id": 2,
            "name": "1718880423570-file"
        }
    ]
}
```

有了这些，实现一个简单的 JSON server 就没什么难度了。感兴趣可以修改下代码，通过接口形式保存商品数据。
