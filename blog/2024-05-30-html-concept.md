---
slug: html-concept
title: HTML、DOM 中的几点小概念
authors: zhouyuan
tags: [HTML, DOM]
---

前端框架真的带来了很多便利，有些便利甚至你都不知道。比如，form 组件的包装。了解了之后，觉得 HTML 的规范有些地方，真是像草稿一样简陋，有很多的 exceptions。还有很多相近，又不完全相同的概念。比如说 Node 和 Element 两个类，Element 是 Node 的拓展，本身又实现了很多重复又名称不一样的功能。再比如 Element 的 attributes 和 properties 有什么区别。

<!-- truncate -->

最近在看浏览器相关内容，又重温了一些基础知识。这些基础知识，不怎么用的到，还是记录下，好记性不如烂笔头。

## Node 和 Element 的区别

### Node

Node 的意思是节点，要更加基础一些。DOM 中所有对象都是节点，包括一些我们平常不关注的内容，例如注释节点，文本节点。Node 中提供了 `appendChild()` 方法，将一个节点添加到指定父节点的子节点尾部。另外还有一个更加通用的方法，`insertBefore()`, `appendChild` 只能添加到尾部，`insertBefore` 可以指定添加的位置。举例说明：

```js
const p = document.createElement("p");
document.body.appendChild(p); // 会向 body 尾部插入一个 p 元素

const ref = document.getElementById('reference')
parentNode.insertBefore(newNode, ref); // 会将 newNode 插入到 parentNode 的 div#reference 元素前面
```

两个方法都有返回值，返回被执行插入操作的节点，例子中就分别为 `p` 元素和 newNode。

`insertBefore` 中第二个参数（ref）并非可选参数，如果传递 `undefined`，在不同的浏览器下表现会有区别。ref 还有一个有效值，就是 `null`，假设显示指定 `ref=null`，会将节点插入到父节点的子节点的末尾，和 `appendChild` 相似。假设 `ref` 并不是 `parentNode` 的子节点，会报错。

```html
<div id="container">
    <div id="anchor">anchor</div>
</div>

<div id="outer">outer</div>
<script>
    const container = document.getElementById('container')
    const newNode = document.createElement('div')
    newNode.textContent = 'new node'

    container.insertBefore(newNode, null) // 插入尾部

    const outer = document.getElementById('outer')
    const anchor = document.getElementById('anchor')
    container.insertBefore(outer, anchor) // 移动插入到指定位置
</script>
```

假设操作的是一个 `DocumentFragment`，则会将 fragment 中所有节点添加到指定位置，用来做批量操作很方便。

```js
const fruits = ["Apple", "Orange", "Banana", "Melon"];

const fragment = new DocumentFragment();

fruits.forEach((fruit) => {
    const li = document.createElement("li");
    li.textContent = fruit;
    fragment.appendChild(li);
});

container.insertBefore(fragment, anchor); // 批量添加
```

出于优化性能考虑，操作已经存在于 DOM 中的 Node，不会进行复制，只会移动位置，也就是同一个节点不会重复出现在 DOM 的不同位置。假设需要两个相同的节点，可以使用 `cloneNode` 复制一个节点。

接下来是一些属性，`Node.childNodes` 可以获取 Node 的所有子节点。`Node.parentNode` 可以获取 Node 的父节点，如果没有父节点返回 null。`Node.parentElement` 可以获取父元素，如果没有父节点或者父节点不是一个 DOM 元素（Element），返回 null（可能获取 parentElement 操作很频繁吧，提供了一个快捷方式）。`Node.nodeType`  可以获取 Node 的类型，很多种，可以看[这里](https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType)。

### Element

Element 就是 Document 中的元素，也是前端最常接触的基类。Element 是从 Node 拓展而来的，`document.getElementById` 通常认为返回的是一个 Element 而非 Node。当我们看到 Element 上的属性后，立马就能了解 Element 和 Node 的区别。例如 `Element.classList` 可以获取 Element 的 class 的动态 [`DOMTokenList`](https://developer.mozilla.org/zh-CN/docs/Web/API/DOMTokenList) 集合，通过 API 可以修改元素的 class 属性。

相较于 Node，Element 更加贴近用户，操作内容和页面展示内容相关性更高，而不是侧重于 Document 结构调整。

作为子类，Element 除了可以调用 Node 的方法、属性外，自身也做了一些拓展。

`Element.append()` 方法，可以向 Element 子节点之后插入节点。`Element.children`属性，可以获取 Element 的所有子 Elements。

### **总结：**

Element 是 Node 的子类，两个类型侧重点不同。假设需要修改 DOM 结构，可以多从 Node 角度思考。如果需要修改页面上的元素表现，可以多看看 Element 相关的属性或方法。更简单的记忆方法是，DOM 元素（Element）是指 DOM 树中的特定 [HTML 元素](https://developer.mozilla.org/docs/Web/API/HTMLElement)。DOM 节点（Node）与 DOM 元素术语的含义重叠，但其定义在扩展后加入了注释、空白和文本等。

补充一点，Node 也有一个父类 `EventTarget`。为什么  `EventTarget` 会是 Node 的父类，需要从事件系统角度考虑。我们一般会在事件处理方法中，使用到  `EventTarget`，难免就会觉得它会不会是 Element 的子类封装。实际上事件系统是由浏览器进程来收集的，例如点击事件，浏览器会记录点击发生的位置，通过**进程间通信（IPC, Inter-Process Communication）**，将数据传送给渲染进程。渲染进程计算后，会确定事件源。基于这样的架构，`EventTarget` 就需要是一个更基础的类。

## HTML attributes 和 DOM properties

中文 attributes 和 properties 中文，一般都翻译成属性，这两者概念上是有区别的。对于前端框架使用者来说，这两者的区别并没有那么重要，甚至是混用的，框架的工作抹平两者差异。我曾经被这两个东西搞迷糊过，刚好看到有人科普，记录一下（参考文章贴在后面了）。

### HTML attributes

加上了 HTML，这个东西就和 HTML 元素有关。比如说向下面这种：

```html
<input id="demo" class="test" type="text" />
<script>
      const el = document.getElementById('demo')
      console.log(el.attributes); // 通过 Element 提供的接口，打印属性
</script>
```

最终会得到一个 `NamedNodeMap` 对象，是一个类数组。可以看到其中包含三个属性，分别是 id、class、type。所以 attributes（后续缩写为 attr） 就是写在标签内的属性，HTML 规范决定了这些属性值只能是字符串。在标签内，实际上可以任意写 attribute，Element 提供了 `setAttribute()` 方法，设置元素的 attribute。设置相应 attribute 后，可以在浏览器 Elements 标签中看到结果，每个 attribute 都会出现在标签中。需要注意的是，setAttribute 如果写入的不是字符串，会被转换成字符串，再写入元素。

```html
<script>
  	-- snip --
    el.setAttribute('welkin', true)
    el.setAttribute('obj', { name: 'welkin' })
</script>

<!-- 最终的结果 -->
<input id="demo" class="test" type="text" welkin="true" obj="[object Object]">
```

HTML attr 还有一个特点，就是大小写不敏感。和上面同理，假设写入了一个 `FOO` 的属性，最终也会被转换成 `foo`。归根结底，这些 attr 需要符合 HTML 规范的要求。

### DOM properties

顾名思义，是 DOM 对象上的属性。对于 properties 来说，要求就比较松散了，可以把它当作 JS 对象的属性看待。比如说可以新增一个 welkin property，这个属性可以随便写入值。

```js
el.setAttribute('welkin', true)
el.welkin = {
    name: 'welkin'
}
console.log(el.getAttribute('welkin')); // 'true'
console.log(el.welkin); // { name: 'welkin' }，值为对象
```

上面例子，可以看出来，attribute 和 property 是两个东西，可以同时存在，值互不相同。

这样看，区分还是挺明显的，为什么有时候会混淆呢？因为 DOM 做了一些处理。

#### 反射

welkin 并非标签原有的属性，假设设置 id 这个标签通用属性会发生什么？

```js
const el = document.getElementById('demo')
el.setAttribute('id', 'myId')

console.log(el.getAttribute('id')); // 'myId'
console.log(el.id, typeof el.id); // 'myId' string

el.id = 'something'

console.log(el.getAttribute('id')); // 'something'
console.log(el.id, typeof el.id); // 'something' string
```

两种修改方式，变动 id 后，修改被同步了。也就是 HTML 原有的属性，DOM API 修改到会做处理。在这里 id 在两个集合中，属性名都一样。其他的属性名可能不一样，例如 label 的 for，在 properties 中为 htmlFor（可能是考虑到关键字冲突），或者多个单词的元素（一般会变成驼峰命名），命名规范上会有区别。

也就是说，普通的属性，会直接写入，就像在对象上写入属性。特殊的属性，DOM 会通过一定的机制，同步两边数据。或者说，这些 HTML 中规定的 attribute，会在 Element 拥有自己的 reflect property。读取这些 property 实际上是通过 getter 获取 attribute。

我们通常需要操作的，都是这种可能直接改变页面表现的属性，就会觉得二者是等价的。

#### 类型校验

`setAttribute` 不会校验类型，直接就写到标签内了，而通过 property 修改，DOM 会做校验，不通过就回退到默认值。例如修改 img 和 height。

```js 
img.height = 'px500' // 无效值，应用默认值，img 的 height="0"
img.setAttribute('height', 'px500') // 无效值，直接写入，img 的 height="px500"，px500 无效，保持默认行为，也就是 img 不设置 height 的样子
```

#### `<input>` 的 vlaue

`<input>` 的 value 很有意思，大多数框架对这部分的处理都是很强的。如果离开框架，很多人可能会在这上面栽跟头。Attribute 和 properties 中都有 value，但是两者并没有 reflect 关系。

例如下面的代码：

```html
<input id="demo" name="test" class="test" type="text" value="123" />
<button onclick="handleClick()">输出 value</button>

<script>
    const input = document.getElementById('demo')
    input.value = 'welkin'
    function handleClick() {
        console.log(input.getAttribute('value'));
        console.log(input.value);
    }

</script>
```

无论触发多少次 `handleClick`，Attributes 中的 value 永远是初始的 '123'，标签中的值也不会变。但是 `input.value` 中的值，和用户输入、JS 中设置的是一样的。实际上 attributes 中的 value 对应的是 properties 中 defaultValue。首次创建 Element，会读取 HTML 标签中的 value，设置进 properties。之后两者就没关系了。同样，checked 属性也是如此，如果手动设置 `<input type="checkbox" />` 的 checked 属性，会发现只有第一次有用，随后修改就没有用了。这种情况，在弹框重新初始默认值时，可能会遇到。这种情况下，需要设置 properties 而不是 attributes。



## 参考文章：

[深入了解现代网络浏览器（第 4 部分）](https://developer.chrome.com/blog/inside-browser-part4?hl=zh-cn)

[DOM 大小对互动的影响以及应对措施](https://web.dev/articles/dom-size-and-interactivity?hl=zh-cn#consider_an_additive_approach)

[DOM 概述](https://developer.mozilla.org/zh-CN/docs/Web/API/Document_Object_Model/Introduction)

[HTML attributes vs DOM properties](https://jakearchibald.com/2024/attributes-vs-properties/#html-serialisation)
