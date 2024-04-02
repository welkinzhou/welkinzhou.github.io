---
sidebar_position: 1
tags: [css]
---

# CSS

CSS 时常会出现各种各样的新问题，总有一些让你百思不得其解。与我而言，CSS 真是一个充满了惊奇的语言，如此让人着迷。

### 层叠上下文和层叠水平

css 中经常使用 z-index 去修改元素层叠水平（通俗讲，就是哪个元素覆盖在上面），但是 z-index 生效是有限定条件的。有些情况下，会出现怎么增加 z-index 都无法改变样式层叠关系。这个时候，就需要了解 **层叠上下文**，搞清 css 层叠的原理，参考 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)。

MDN 给出了很多属性，常用的就是定位元素，还有 flex 容器的子元素。

几个基本的原则，帮助你排除 z-index 的问题。

1. 层叠上下文中子元素不会影响到外部元素的层叠水平，也就是说考虑层叠顺序时，只需要考虑兄弟元素间的层叠。如果父级层叠水平比较低，那么子级 z-index 再高都没用。
2. 兄弟元素间，层叠上下文层叠水平比普通元素高，通过设置 z-index，可以改变层叠上下文的层叠水平。简单说，不设置 z-index，或者 z-index >=0，层叠上下文元素的层叠水平都比普通元素高，设置 z-index 为负数，层叠上下文层叠水平会低于普通元素。
3. 兄弟层叠上下文间，z-index 越大，层叠水平越高。
4. 相同的层叠水平下，后面的元素层叠水平比前面的高。

举个例子，如下的 dom 结构：

```html
<body>
  <div class="area fir"></div>
  <div class="area sec"></div>
</body>
```

简单设置样式：

```css
.area {
  margin: 0 auto;
  width: 100px;
  height: 100px;
}
.fir {
  background-color: antiquewhite;
}
.sec {
  background-color: aqua;
  margin-top: -20px;
}
```

现在两个 div 都不具有层叠上下文属性，.sec 元素是覆盖在 .fir 之上的。如果给 .fir 设置 `position: relative;`，.fir 就会覆盖在 .sec 之上。如果给 .fir 设置 `z-index: -1;`，.fir 会重新回到底部。

还有一个比较有意思的东西，行内元素的层级实际上比块级元素高。

### 定位

各种定位中，`fixed` 有一点特性容易被忽略掉：

_元素会被移出正常文档流，并不为元素预留空间，而是通过指定元素相对于屏幕视口（viewport）的位置来指定元素位置。元素的位置在屏幕滚动时不会改变。打印时，元素会出现在的每页的固定位置。`fixed` 属性会创建新的层叠上下文。当元素祖先的 `transform`、`perspective`、`filter` 或 `backdrop-filter` 属性非 `none` 时，容器由视口改为该祖先。_

当我们希望使用 `position: fixed;` 来使元素针对视口进行定位时，切记父级元素中不要包含 transform 等属性，这个我会踩过坑的 T_T。

### 高度

```html
<style>
  .container {
    min-height: 960px;
  }
  .inner {
    height: 100%;
  }
</style>
<div class="container">
  <div class="inner"></div>
</div>
```

例如上述 dom 结构，如果父级只设置了 `min-height`，子元素的 `height: 100%;`是没有用的。min-height 只会限制元素高度，并不代表元素的高度（我知道听起来很奇怪）。子元素使用 percentage 设置 height，需要父级的 height。min-height 不设置 height，这里子元素的 height: 100% 是没有作用的。

### 选择器

css 中的选择器永远是针对 document 中所有元素的，这句话可能让人有些摸不着头脑，要结合一点 js 中的 `querySelector`来理解。

比如说，我们创建了一个组件，需要操作其中某个元素，可能会想到使用 `document.querySelector` 来获取对应元素。这样获取的元素是在整个 document 中进行查找，有可能查找到组件外部的元素。这是就会想到 `Element.querySelector`，来查找当特定 Element 下的对应元素。

例如下面的 html 结构中：

```html
<div id="contentRef">
  <div class="wow">
    <div class="cat"></div>
  </div>
  <footer class="en">
    <div class="cat"></div>
  </footer>
</div>
```

若想要获取 div.cat，可以是用 `contentRef.value.querySelectorAll('.cat')`，这样即使组件外面同样有 div.cat，也不会被匹配到。`Element.querySelector` 只会匹配 Element 内部（不包括自身）的元素。

假设只想匹配 div.wow > div.cat，也就是第一个 cat。可能会想，既然只查找元素内部，第二个 cat 是在 footer 下面 c，而第一个 cat 是在 div 下面。那么只需要查找 `contentRef.value.querySelectorAll('div div')`。

测试一下就会发现很神奇的一点，返回的 nodeList 场地是 3。匹配到的元素分别是 div.wow 和 两个 div.cat。为啥呢，为什么不是第一个 div.cat？

这是因为 css selector 匹配时候，是遍历的整个 document 结构进行查找。Element.querySelector 的作用是限定返回值的范围，也就是针对所有匹配到的元素进行过滤，只返回 Element 内部的元素。

例如 div.wow 是在 contentRef 下面的，满足 'div div'这个结构，同时也在 contentRef 内部，这样就会被返回。

理解了这一点，就可以进入 `:not() 伪类` 的迷惑性匹配了。

假设你想整个骚操作， `contentRef.value.querySelectorAll('.wow .cat')` 这样匹配太普通了，不让它有趣点。这样一个新点子诞生了， `contentRef.value.querySelectorAll(':not(.en) .cat')` 。当前结构下，不在 div.en 下的 div.cat，就是需要查找的元素了。

会成功吗？当然不行，两个元素都被匹配上了。

原因还是 css selector 工作时候是查找的整个 document。如果从整个文档看，总有一个外层元素会让第二个 div.cat 满足，不在 .en 下面，比如 html .cat。html 元素上就没有 en 类。

如果能给定更严格的结构，`:not()`也能正常工作，例如 `contentRef.value.querySelectorAll(':not(.en) > .cat')`。

还是不建议这样使用 `:not()`，需要过滤时候最好使用

```js
let list = contentRef.value.querySelectorAll(".cat");
list = list.filter((item) => !item.parentNode.closest(".en"));
```
