---
tags: [js, JavaScript]
---

# JavaScript 中作用域，以及变量

总所周知，JS 最开始只有两种作用域，全局作用域和函数作用域。了解到这一点，能很大的帮助到理解 var、let 的特性。函数作用域很重要，可以说没有函数作用域，今天这些复杂代码基本没法实现。

## 作用域

作用域就是当前的执行上下文，也像一个栈一样，可以层叠堆放。子作用域可以访问父作用域，反之不行。

作用域，可以生成一个相对独立的执行空间，这很大的方便了代码编写，例如：

```js
var a = 11 // 全局作用域

function test() {
  var a = 22 // 函数作用域
  console.log(a) // 22
}
```

上述代码中，涉及到两个作用域，分别是全局作用域和 test 的函数作用域。可以看到两个作用域中都有同名变量 a，写代码时候觉得很稀疏平常，假设没有函数作用域，那变量就不能重名了。可以想象到，代码编写中会有什么样的困难。

其实作用域是一个代码编写中常遇到的概念，即使不知道这个名字也能模糊了解到它的作用。简单说就是一个执行环境，确定哪些内容可以访问。了解了这些特点，就可以明白为什么 var 会有那么多奇怪的行为。

## 变量声明

通常使用 var、或者 let 声明变量。此外还有一种离谱的行为，不加关键值直接赋值。

直接赋值情况特殊，单独拿出来先说一下。这样写有很大风险，严格模式报错，不建议使用。这种方式不大算声明变量，某些情况下可以当作变量声明使用。直接赋值会在全局对象上生成一个属性，全局变量也是挂载在全局对象上，这一点两者有相似点。由于不是变量声明，也不会走变量创建的流程。

举个例子：

```js
// console.log(a) // 虽然全局可以访问，不是变量，不存在提升，提前使用报错

function test() {
  // console.log(a) // 函数作用域内一样不存在提升，提前使用报错
  a = 1
}

console.log(a) // 代码执行后，全局生成属性，可以使用
```

JS 运行时会两次读取代码，第一次创建执行环境，分配内存，第二次逐行执行代码。

第一次执行时，会进行如下步骤。首先创建全局上下文，然后创建全局对象（Window 或 Global），绑定全局的 API 到全局对象上，绑定 this 指向全局对象。接着创建 heap，分配内存，引用类型存放在 heap 上。同时，所有的函数，全局基本类型变量存储在 stack 上。这就是为什么函数可以在声明之前进行使用。

也就是说，代码执行前，变量已经存放在 stack 上了，即 **hoisting**（变量提升）。在下一步执行前，这些变量虽然空间已经开辟，没有存值，访问只能得到 undefined。

注意这部分只包括全局上下文，执行到函数时，会再创建函数上下文。函数内部的变量不存在全局的提升，但是在函数作用域内存在提升。这些内容会在下面

第二次，逐行执行代码，遇到变量会进行赋值操作，遇到函数，创建函数上下文，入栈执行。

### var 声明变量的作用域

全局代码使用 var 声明变量，作用域自然是全局作用域。函数内 var 声明变量，变量的作用域是包含它的函数的局部作用域。

```js
function test() {
  console.log(tem); // 函数作用域，存在提升，访问不报错，结果是 undefined
  var tem = "msg";
  console.log(tem); // 这里变量写入值，结果是 msg
}
// 外部不能访问tem
test(); // 调用后会生成一个tem，函数执行完毕后销毁
console.log(tem); // 父作用域不能访问子作用域内容，报错
```

需要定义多个变量可以使用逗号隔开，如（缩进是为了便于阅读，非必需）

```js
var message = "hi",
  found = false,
  age = 18;
```

var 可以重复声明：

```js
var a = 22;

var a = "ms";

console.log(a); // a == 'ms'
```

### let 和 var 的区别

明显的区别是 var 是全局或者函数作用域，而 let 是块作用域（以{ }划分）。

```js
if (true) {
  var name = "welkin";
  console.log(name);
}
console.log(name); //可以访问，因为if语句只是划分了代码块，本质还是在外部函数包裹下

if (true) {
  let time = "12:21";
  console.log(time);
}
console.log(time); //不可以访问，不在同一个代码块
```

let 会有暂时性死区（temporal dead zone），一个 exception ，let 同样存在变量提升（hoist），只是 let 变量存储位置并不在 global 对象上，声明前使用会报错。

```js
console.log(a) // 报错，Cannot access 'a' before initialization
let a = 1
```

此外，let 不允许在同一块级作用域中重复声明，但是可以嵌套声明，因为不在同一个块级。对重复声明的冗余报错不会因为 var 和 let 的混用受影响，如：

```js
let name = "tom";
let name = "welkin"; //报错

let age = 18;
if (true) {
  let age = 19;
  console.log(age); //不会报错，同一块级作用域中没有重复声明
}

let tem = "ok";
var tem = "no"; //报错，SytaxError: Uncaught SyntaxError: Identifier 'tem' has already been declared

var temp = "may";
let temp = "two"; //报错，SytaxError: Uncaught SyntaxError: Identifier 'temp' has already been declared
```

和 var 不一样，let 声明的全局变量，没有挂在全局 scope 上，并不是全局对象的一个属性。

```js
var name = "tom";
console.log(window.name); // tom

let age = "18";
console.log(window.age); // undefined
```

对于 let 关键字没法使用声明条件依赖的方式声明，如：

```js
if (typeof tem === "undefined") {
  let tem = 123; // 不起作用，因为出了代码块就没法访问到
}
// console.log(tem); //报错，无法访问到上面的块级作用域中的 tem
//如果后面给 tem 赋值相当于声明一个全局变量，再赋值
tem = 234; // 不加关键字的声明全局变量，需要先声明再使用，不存在提升
console.log(tem); //234，全局变量

// 同理 try catch 语句也没有用
try {
  console.log(age);
} catch (error) {
  let age; // 出了代码块就没用了
}
```

let 还解决了循环中的迭代变量问题，如：

```js
for (var i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i); // 打印结果 55555
  }, 0);
}

// 使用let
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i); // 打印结果 01234
  }, 0);
}
```

之所以是这样，是因为 var 声明的迭代变量保存的是导致退出循环的值 5，循环结束后再执行超时的定时器逻辑，所以都是 5，而使用 let，js 会为每次循环新建一个迭代变量。

### const 和 let 的区别

const 行为基本和 let 相同，但是声明时必须赋值， 并且修改的操作会报错。报错只限于修改指向变量的引用，也就是说如果指向的是一个对象，修改对象的属性并不会报错。 在 for 循环中，不能使用 const 声明迭代变量，如

```js
for (const i = 0; i < 5; i++) {} // 报错，迭代变量会自增，js不会新建一个const迭代变量
```

但是在 for - in 和 for - of 中，每次迭代会新建一个不会修改的值，此时可以使用 const 声明,如

```js
for (const key in { a: 1, b: 2 }) {
  console.log(key);
}
```

参考文章：

[Unraveling the JavaScript execution pipeline: Understanding V8, event loop, and libuv for high-performance web experiences](https://tech.jotform.com/unraveling-the-javascript-execution-pipeline-understanding-v8-event-loop-and-libuv-for-4da6789fcfc2)
