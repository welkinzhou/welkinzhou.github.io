---
sidebar_position: 1
---

# JS 语言基础一

### 变量声明

具体执行步骤，参考[这篇文章](https://tech.jotform.com/unraveling-the-javascript-execution-pipeline-understanding-v8-event-loop-and-libuv-for-4da6789fcfc2)。

JS 运行时会读取两边代码，第一次创建执行环境，分配内存，第二次逐行执行代码。

第一次执行时，会进行如下步骤。首先创建全局上下文，然后创建全局对象（Window 或 Global），绑定全局的 API 到全局对象上，绑定 this 指向全局对象。接着创建 heap，分配内存，引用类型存放在 heap 上。同时，所有的函数，全局基本类型变量存储在 stack 上。

也就是说，代码执行前，变量已经存放在 stack 上了，即 **hoisting**（变量提升）。在下一步执行前，这些变量虽然空间已经开辟，没有存值，访问只能得到 undefined。注意这部分只包括全局上下文，执行到函数时，会再创建函数上下文，也就是函数作用域的变量不存在全局的提升，但是在函数作用域内存在提升。

第二次，逐行执行代码，遇到变量会进行赋值操作，遇到函数，创建函数上下文，入栈执行。

#### var 声明变量的作用域

使用 var 定义变时会生成包好它的函数的局部作用域。

```js
function test() {
  var tem = "msg";
  console.log(tem); //这里可以访问tem
}
//外部不能访问tem
test(); //调用后会生成一个tem，函数执行完毕后销毁
console.log(tem); //报错
//不使用var可以生成一个全局变量，需要先声明再使用
function test1() {
  newTem = "msg"; //newTem可以在函数体外被使用，严格模式会报错
}
test1(); //调用后生成一个newTem，函数执行完毕后不销毁
console.log(newTem); //不报错,注意这里需要先进行调用，不调用是不会生成全局变量的
```

需要定义多个变量可以使用逗号隔开，如（缩进是为了便于阅读，非必需）

```js
var message = "hi",
  found = false,
  age = 18;
```

#### let 和 var 的区别

明显的区别是 var 是函数作用域，而 let 是块作用域（以{ }划分）。

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

此外，let 不允许在同一块级作用域中重复声明，但是可以嵌套声明，因为不在同一个块级，并且对重复声明的冗余报错不会因为 var 和 let 的混用受影响，如：

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

let 会有暂时性死区（temporal dead zone），一个 exception ，let 同样存在变量提升（hoist），只是 let 变量存储位置并不在 global 对象上。

并且和 var 不一样，let 在全局的作用域中声明的变量不会成为 window 对象的属性。

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

#### const 和 let 的区别

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

### parseInt

`parseInt`函数将其第一个参数转换为一个字符串，对该字符串进行解析，然后返回一个整数或 `NaN`，有两个参数，语法 `parseInt(string, radix);`。

第一个参数是解析的字符串。

第二个参数可选，从 `2` 到 `36` 的整数，表示进制的基数。例如指定 `16` 表示被解析值是十六进制数。如果超出这个范围，将返回 `NaN`。假如指定 `0` 或未指定，基数将会根据字符串的值进行推算。注意，推算的结果不会永远是默认值 `10`！。

如果不是 `NaN`，返回值将是以第一个参数作为指定基数 radix 的转换后的十进制整数。(例如，`radix` 为 `10`，就是可以转换十进制数，为 `8` 可以转换八进制数 "07"，`16`可以转换十六进制数"0xff"，以此类推)。

如果 `radix` 是 `undefined`、`0` 或未指定的，JavaScript 会假定以下情况：

1. 如果输入的 `string` 以 `0x` 或 `0X`（一个 0，后面是小写或大写的 X）开头，那么 radix 被假定为 16，字符串的其余部分被当做十六进制数去解析。
2. 如果输入的 `string` 以 "`0`"（0）开头，`radix` 被假定为 `8`（八进制）或 `10`（十进制）。具体选择哪一个 radix 取决于实现。ECMAScript 5 澄清了应该使用 10 (十进制)，但不是所有的浏览器都支持。**因此，在使用 `parseInt` 时，一定要指定一个 radix**。
3. 如果输入的 `string` 以任何其他值开头，`radix` 是 `10` (十进制)。

一个简单的题：

> ['1', '2', '3'].map(parseInt) 结果

array 传递给回调三个参数 (element, index , array)，parseInt 接收两个参数，模拟下过程

第一步： parseInt('1',0 ,['1', '2', '3'])，第三个参数 parseInt 不需要，radix 为 0，推算按照 10 进制转换，得到数字 1

第二步：parseInt('2',1 )，radix 为 1，不在指定范围内，返回 NaN

第二步：parseInt('3',2 )，由于 2 进制中没有 3，所以转换失败，返回 NaN

最终结果 `[1, NaN, NaN]`

### 类型转换

类型转换有几种，这里重点讲隐式类型转换。其他的也涉及同样的几个方法，具体可以看[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures#%E5%BC%BA%E5%88%B6%E7%B1%BB%E5%9E%8B%E8%BD%AC%E6%8D%A2)。

常遇到的就是 `==` 判断，比较规律如下

1. 如果操作数具有相同的类型，则按如下方式进行比较：
   - 对象（Object）：仅当两个操作数引用同一个对象时返回 `true`。
   - 字符串（String）：只有当两个操作数具有相同的字符且顺序相同时才返回 `true`。
   - 数值（Number）：如果两个操作数的值相同，则返回 `true`。`+0` 和 `-0` 被视为相同的值。如果任何一个操作数是 `NaN`，返回 `false`；所以，`NaN` 永远不等于 `NaN`。
   - 布尔值（Boolean）：仅当操作数都为 `true` 或都为 `false` 时返回 `true`。
   - 大整形（BigInt）：仅当两个操作数值相同时返回 `true`。
   - 符号（Symbol）：仅当两个操作数引用相同的符号时返回 `true`。
2. 如果其中一个操作数为 `null` 或 `undefined`，另一个操作数也必须为 `null` 或 `undefined` 以返回 `true`。否则返回 `false`。
3. 如果其中一个操作数是对象，另一个是基本类型，按此顺序使用对象的 [`@@toPrimitive()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive)（以 `"default"` 作为提示），[`valueOf()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf) 和 [`toString()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString) 方法将对象转换为基本类型。
4. 在这一步，两个操作数都被转换为基本类型（String、Number、Boolean、Symbol 和 BigInt 中的一个）。其余的转换是逐个进行的。
   - 如果是相同的类型，使用步骤 1 进行比较。
   - 如果其中一个操作数是 Symbol 而另一个不是，返回 `false`。
   - 如果其中一个操作数是布尔型而另一个不是，则将布尔型转换为数字：`true` 转换为 1，`false` 转换为 0。然后再次松散地比较两个操作数。
   - Number to String：使用与 `Number()` 构造函数相同的算法将字符串转换为数字。转换失败将导致 `NaN`，这将保证相等是 `false`。
   - Number to BigInt：按数值进行比较。如果数值为 ±∞ 或 `NaN`，返回 `false`。
   - String to BigInt：使用与 [`BigInt()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/BigInt/BigInt) 构造函数相同的算法将字符串转换为 BigInt。如果转换失败，返回 `false`。

上面第三步，涉及强制转换，强制转换的方法有一些要求：

> `[@@toPrimitive]()` 方法，如果存在，则必须返回原始值——返回对象，会导致 `TypeError`。对于 `valueOf()` 和 `toString()`，如果其中一个返回对象，则忽略其返回值，从而使用另一个的返回值；如果两者都不存在，或者两者都没有返回一个原始值，则抛出 `TypeError`。

MDN 上的例子：

```js
console.log({} + []); // "[object Object]"
```

`{}` 和 `[]` 都没有 `[@@toPrimitive]()` 方法。`{}` 和 `[]` 都从 `Object.prototype.valueOf` 继承 `valueOf()`，其返回对象自身。因为返回值是一个对象，因此它被忽略。因此，调用 `toString()` 方法。`{}.toString()`返回 `"[object Object]"`，而 `[].toString()` 返回 `""`（Array 重写了 toString 方法），因此这个结果是它们的串联：`"[object Object]"`。

同理，可以得到下面两个判断的结果：

```js
{} == !{} // false
[] == ![] // true
```

`!{}` 和 `![]` 结果都为 false，另外一侧是对象需要转换，和上面一样，`{}.toString()`返回 `"[object Object]"`，`[].toString()` 返回 `""`，变成字符串和布尔值比较，布尔值会转换成数值，字符串也会使用 Number() 转换。

### 判断类型

**typeof**

typeof 的判断标准

| 类型                                                     | 结果          |
| :------------------------------------------------------- | :------------ |
| Undefined                                                | `"undefined"` |
| Null                                                     | `"object"`    |
| Boolean                                                  | `"boolean"`   |
| Number                                                   | `"number"`    |
| BigInt                                                   | `"bigint"`    |
| String                                                   | `"string"`    |
| Symbol                                                   | `"symbol"`    |
| Function（在 ECMA-262 中实现 [[Call]]；classes 也是函数) | `"function"`  |
| 其他任何对象                                             | `"object"`    |

只有 null 需要注意，来自 MDN 的解释。在 JavaScript 最初的实现中，JavaScript 中的值是由一个表示类型的标签和实际数据值表示的。对象的类型标签是 0。由于 `null` 代表的是空指针（大多数平台下值为 0x00），因此，null 的类型标签是 0，`typeof null` 也因此返回 `"object"`。

存在 null 这个例外，所以 typeof 判断有时不那么好用。

**Object.prototype.toString**

这里使用的是 Object 原型上的 toString 方法，有些对象可能重写 toString 方法，例如 Array.toString。注意，需要用 `.call` 改变 this 指向。

```js
const toString = Object.prototype.toString;

console.log(toString.call("")); // [object String]
console.log(toString.call([""])); // [object Array]
console.log(toString.call({})); // [object Object]
console.log(toString.call(undefined)); // [object Undefined]
console.log(toString.call(null)); // [object Null]
console.log(toString.call(true)); // [object Boolean]
```

### JS 实现继承

代码参考了[这篇文章](https://juejin.cn/post/6844904161071333384)

**原型链继承**

简单实现，修改原型指向，通过原型链继承：

```js
function Parent() {}

Parent.prototype.parentFn = function () {
  console.log("from parent");
};

function Child() {}

Child.prototype = new Parent(); // 改变原型为 Parent 实例
```

通过 `Parent.prototype`，将方法绑定到 Parent 的原型对象上。每次调用方法时候，沿原型链查找。

能实现复用方法，但在我看来这种，不算继承，原型指向都变了。并且 Child 所有实例，原型全部指向同一个 Parent 实例。假如 Parent 上有属性 A，所有的 Child 实例访问的都是同一个。某一个 Child 修改了属性 A，所有的 Child 访问 A 都会改变。同时，实例化 Child 时，没办法修改传递给 `new Parent` 的参数。

出现上述问题的根本问题，是写死了 `Child.prototype` 的值，所以有了下面的优化方式。

**构造继承**

实例化的过程，就是调用构造函数，把属性、方法绑定到 this 上。这样我们就可以通过改变 this 指向，把属性、方法绑定到 Child 实例上。

```js
function Parent(name) {
  this.name = name;
  this.children = ["A", "B"];
  // 注意，这里方法没有绑定到原型上
  this.getChildren = function () {
    console.log(this.children);
  };

  this.getName = function () {
    console.log(this.name);
  };
}

function Child(name) {
  Parent.call(this, name); // 改变 this 指向，初始挂载属性，方法
}
```

可以明显的看出来，绑定方法有很大的区别。Parent 的属性和方法，都是通过 `this.` 的方式绑定的。 也就是说每次实例化，都要将方法绑定到实例上。为了实现每个实例的隔离，导致方法没有被复用。

**组合继承**

上述两种各有千秋，结合起来使用，弥补各自的问题，就有了组合继承的方法。

```js
function Parent(name) {
  this.name = name;
  this.children = ["A", "B"];
}

Parent.prototype.getChildren = function () {
  console.log(this.children);
  return this.children;
};

Parent.prototype.getName = function () {
  console.log(this.name);
  return this.name;
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

Child.prototype = new Parent(); // 改变原型指向
Child.prototype.constructor = Child; // 矫正 constructor
```

如果不矫正 constructor 指向，Child 实例的 constructor 是 Parent，看起来就很奇怪，和用户的预期会不一样。

**Object.setPrototypeOf**

MDN 上还提到了一个 API [`Object.setPrototypeOf()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf)，相当于 class 语法中的 extends。

```js
function Base() {}
function Derived() {}
// 将 `Derived.prototype` 的 `[[Prototype]]`
// 设置为 `Base.prototype`
Object.setPrototypeOf(Derived.prototype, Base.prototype);

const obj = new Derived();
// obj ---> Derived.prototype ---> Base.prototype ---> Object.prototype ---> null
```

另外 MDN 上还提示了，你可能还会看到一些使用 [`Object.create()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create) 来构建继承链的旧代码。然而，因为这会重新为 `prototype` 属性赋值并删除 [`constructor`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor) 属性，所以更容易出错，而且如果构造函数还没有创建任何实例，性能提升可能并不明显。

不推荐下面写法：

```js
function Base() {}
function Derived() {}
// 将 `Derived.prototype` 重新赋值为 `Base.prototype`，
// 以作为其 `[[Prototype]]` 的新对象
// 请不要这样做——使用 Object.setPrototypeOf 来修改它
Derived.prototype = Object.create(Base.prototype);
```

### 原型链和 new

了解 `new` 关键字做什么之前，先要熟悉下[原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)。

JS 可以往对象上挂方法、属性， 这里几个基本概念，实例（instance），原型对象（ `[[prototype]]`，以前浏览器常用 `_proto_`，也可以通过`Object.getPrototypeOf(instance)` 获取），构造函数（constructor）。每个对象都有一个原型对象，原型也可以有原型对象，最终一层层找上去，直到 null。这样的一个链条，被称作原型链。虽然有一堆概念，牢记所有的继承，原型链针对的都是对象，并非构造函数。

通常的指向如下：对象也即实例，会有一个属性 `constructor` 指向构造函数，还有一个 `[[prototype]]` 属性指向实例的原型对象。构造函数有一个 prototype 属性，一般也指向原型对象。原型对象有一个 `constructor` 属性，指向构造函数。 但是 JS 中可以修改指向，包括 new 实例化时，constructor 也可以返回自己构造的实例。所以实例的 `[[prototype]]` 属性，和 `constructor.prototype` 不严格相等。

原型链的结束：这样沿着原型链查找，最终都会找到 Object.prototype （也就是 Object 这个类的原型对象，Object 这里既是 Object 这个内置构造函数，也可以认为是泛指 Object 这个类），也就是 Object 类的原型对象。既然叫原型对象，可以认为是个对象，或者实例。实例继续向上查找需要 `[[prototype]]` 属性，最终 `Object.prototype._proto_ === null` ，原型链终点是 null。

> JS 高程四上说 `constructor` 本来是用于标识对象类型的。不过，一般认为 instanceof 操作符是确定对象类型 更可靠的方式。例如上面的原型链继承，只修改 Child 原型指向，`Child.prototype = new Parent();`，运行 `const child1 = new Child("tom");`，会发现 `child1 instanceof Child` 为 true，child1 的 constructor 指向 Parent。在不同的终端，格式化打印的 child1 显示也不一样（我自己电脑显示，未必大家都一样），node 环境显示： `Parent { name: 'tom' }`，浏览器显示 `Child { children: [ 'A', 'B' ], name: 'tom' }`。instanceof 可以知道，child1 确实是 Child 实例。

属性和方法都可以沿着原型链查找，同时也可以被子类复写，例如 Parent 和 Child 两个类中，都有 a 属性。Child 的实例访问 a 时，会返回 Child 的 a，父类同名属性或方法，会被 shadow 掉。**还有一个需要注意的点，假如 `const child1 = new Child();`，通过 child1.getName 调用 Parent 上继承的方法，getName 的 this 指向会指向当前对象 child1，而不是 Parent 的原型对象。**

接下来是 new 操作，具体也可以看[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new)

当使用 `new` 关键字调用函数时，该函数将被用作构造函数。`new` 将执行以下操作：

1. 创建一个空的简单 JavaScript 对象。为方便起见，我们称之为 `newInstance`。
2. 如果构造函数的 `prototype` 属性是一个对象，则将 `newInstance` 的 [[Prototype]] 指向构造函数的 `prototype`属性，否则`newInstance`将保持为一个普通对象，其 `[[Prototype]]` 为`Object.prototype`。
3. 使用给定参数执行构造函数，并将 `newInstance` 绑定为 `this` 的上下文（换句话说，在构造函数中的所有 `this` 引用都指向 `newInstance`）。
4. 如果构造函数返回[非原始值](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Data_structures#原始值)，则该返回值成为整个 `new` 表达式的结果。否则，如果构造函数未返回任何值或返回了一个原始值，则返回 `newInstance`。（通常构造函数不返回值，但可以选择返回值，以覆盖正常的对象创建过程。）

类只能用 `new` 运算符实例化——尝试不使用 `new` 调用一个类将抛出 `TypeError`。

上面的第 2 步，还有第 4 步，可能到导致实例的 `[[Prototype]]` 和 constructor.prototype 指向不同。

### 垃圾回收（GC）

最初的垃圾回收机制，是**引用记数法**。原理就是统计一个对象，自身或者自身的属性被引用的次数。例如：

```js
const obj = {
  a: 1,
};

let o = obj; // 对 obj 的引用
let a = obj.a; // 对 obj 属性 a 的引用

o = 1; // 此时 o 对 obj 的直接引用断开
// 但是 a 依旧用对 obj.a 的引用 所以 obj 不会回收
a = null;
// 现在对 obj.a 的引用也没有了，可以回收 obj 了
```

引用记数最大问题就是循环引用，如下：

```js
let obj1 = {
  a: 1,
};

let obj2 = {
  b: obj1,
};

obj1.c = obj2;
```

这样两个对象相互引用，那么记数永远都不会为 0。

针对上面的问题，优化后使用**标记-清除算法**。

标记-清除换了个角度思考问题，和 Rust 的 Ownership 有异曲同工之妙。引用计数统计的是对象自身是否被需要，标记-清除考虑的是整个程序是否需要这些对象。

这个算法思路是，假定有一个根（root）的对象（在 Javascript 里，根是全局对象）。垃圾回收器将定期从根开始，查找被根引用的对象，再从这些对象查找是否引用其他对象，以此类推，查找所用从根可达的对象。剩余不可达的对象，将被垃圾回收器回收。这样，两个对象相互引用，从根无法获取到它们，同样会被清除，解决了循环引用问题。

思路很简单，定期遍历有点麻烦，实现上可以简化，下面是 JS 高程四中相关描述：

当变量进入上下文，比如在函数 内部声明一个变量时，这个变量会被加上存在于上下文中的标记。而在上下文中的变量，逻辑上讲，永 远不应该释放它们的内存，因为只要上下文中的代码在运行，就有可能用到它们。当变量离开上下文时， 也会被加上离开上下文的标记。

给变量加标记的方式有很多种。比如，当变量进入上下文时，反转某一位;或者可以维护“在上下文中”和“不在上下文中”两个变量列表，可以把变量从一个列表转移到另一个列表。**标记过程的实现并不重要，关键是策略**。

垃圾回收程序运行的时候，会标记内存中存储的所有变量(记住，标记方法有很多种)。然后，它会将所有在上下文中的变量，以及被在上下文中的变量引用的变量的标记去掉。在此之后再被加上标记的变量就是待删除的了，原因是任何在上下文中的变量都访问不到它们了。随后垃圾回收程序做一次内存清理，销毁带标记的所有值并收回它们的内存。

### 事件循环

JS 采用单线程，只有一个调用栈。异步是通过回调函数完成的，JS 中存在多个消息队列存放回调函数，在调用栈被清空时，按照次序执行不同队列中的回调，就是事件循环。

JS 主线程执行时，同时有多个任务队列存在。同是异步任务，各自对时效性要求不同，把这些任务分为宏任务和微任务，微任务优先级更高。ES6 规范中，宏任务（Macrotask） 称为 Task， 微任务（Microtask） 称为 Jobs。宏任务是由宿主（浏览器、Node）发起的，而微任务由 JS 自身发起。

Script 整体代码属于宏任务，主代码逐行执行，遇到异步任务，放入所属的任务队列。当前代码执行完毕，只剩下全局上下文时，会去查找微任务队列，如果有任务，按顺序入栈依次执行。微任务完成后，再查找宏任务队列，如果有执行。随后重复循环，交替执行异步任务。

由于循环的存在，定时器到达时间时，仍需等待当前执行队列任务完成，这也是定时器有事延迟执行的原因。另外还有一些情况，[请看这里](https://developer.mozilla.org/zh-CN/docs/Web/API/setTimeout#%E5%BB%B6%E6%97%B6%E6%AF%94%E6%8C%87%E5%AE%9A%E5%80%BC%E6%9B%B4%E9%95%BF%E7%9A%84%E5%8E%9F%E5%9B%A0)。

### 宏任务与微任务

**macro-task 宏任务** 大概包括：

- script(整体代码)
- setTimeout
- setInterval
- setImmediate(Node 环境)
- I/O，事件队列
- UI render

**micro-task 微任务** 大概包括:

- process.nextTick(Node 环境)
- Promise.[ then/catch/finally ]
- Async/Await(实际就是 promise)
- queueMicrotask
- MutationObserver(html5 新特性)
- requestAnimationFrame(有争议，处于渲染阶段，不在微任务队列，也不在宏任务队列)
- Object.observe(已废弃)

例子：

```js
console.log("start");

const p1 = new Promise((resolve) => {
  console.log("p1");

  setTimeout(() => {
    console.log("p1 set timeout");
  }, 0);

  resolve();
});

const p2 = new Promise((resolve) => {
  console.log("p2");

  setTimeout(() => {
    console.log("p2 set timeout");
  }, 0);

  resolve();
});

setTimeout(() => {
  console.log("outer set timeout 1");
}, 0);

setTimeout(() => {
  console.log("outer set timeout 2");
}, 0);

p1.then((result) => {
  console.log("p1 resolve");
  setTimeout(() => {
    console.log("p1 resolve set timeout");
  }, 0);
});

p2.then((result) => {
  console.log("p2 resolve");
  setTimeout(() => {
    console.log("p2 resolve set timeout");
  }, 0);
});

// 结果
/*
  start
  p1
  p2
  p1 resolve
  p2 resolve
  p1 set timeout
  p2 set timeout
  outer set timeout 1
  outer set timeout 2
  p1 resolve set timeout
  p2 resolve set timeout
*/
```
