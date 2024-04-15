---
authors: zhouyuan
tags: [TypeScript]
---

# TypeScript 内置类型记录

TypeScript 内置了一些类型，包括 ES5，ES6 语法 API 的类型声明，很多地方看起来很有意思。我也不知道学习 TypeScript 从哪里入手，索性看着写声明文件学习一下，遇到有趣的就记录一下。因此未有定序，不似别人脉络清晰，偶有所得，翻用自喜。

### is 使用

Array 的 every 方法，类型声明很有意思：

```ts
interface ReadonlyArray<T> {
  ...
   /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param predicate A function that accepts up to three arguments. The every method calls
     * the predicate function for each element in the array until the predicate returns a value
     * which is coercible to the Boolean value false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    every<S extends T>(predicate: (value: T, index: number, array: readonly T[]) => value is S, thisArg?: any): this is readonly S[];
    /**
     * Determines whether all the members of an array satisfy the specified test.
     * @param predicate A function that accepts up to three arguments. The every method calls
     * the predicate function for each element in the array until the predicate returns a value
     * which is coercible to the Boolean value false, or until the end of the array.
     * @param thisArg An object to which the this keyword can refer in the predicate function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    every(predicate: (value: T, index: number, array: readonly T[]) => unknown, thisArg?: any): boolean;
}
```

第二个类型声明很简单，就是 every 返回一个 boolean 判断 every 是否全部通过测试。第一个类型声明重点在于 `is`，is 在 TypeScript 中叫做类型谓词，简单理解就是可以收缩类型。这个类型声明的意思就是，假设 `predicate` 可以将数据类型收缩到 `S`，可以认为通过 every 检测的数组是 `S[]` 类型。

举个最常见的例子：

```ts
function isString(s: any): s is string {
  return typeof s === "string";
}
```

假设有一个数据可能是 string 也可以是 number，当我们像把它看作其中一个类型使用时，可能就会报错。TypeScript 不知道此时这个数据确定的基础类型，如果我们使用了 String 上的方法，Number 上没有，就会判断程序可能运行出错，这就要用到 is。

```ts
function test(some: any) {
  if (isString(some)) {
    // 这里收缩类型
    // 在这个代码块里，some 被视作 string
    console.log(some.charAt(1));
  }
}
```

也就是，调用方法，通过校验就可以把数据认为是使用 is 断言后的类型。

### infer 使用

下面是 Awaited 的声明：

```ts
/**
 * Recursively unwraps the "awaited type" of a type. Non-promise "thenables" should resolve to `never`. This emulates the behavior of `await`.
 */
type Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: infer _) => any // if the argument to `then` is callable, extracts the first argument
    ? Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T; // non-object or non-thenable
```

`extends` 表示判断当前类型是否是某一个类型的子类型，使用 `extends`，加上三目运算符，可以完成 TypeScript 中的判断语句。

第一个判断很简单，假如 T 是 `null | undefined`，`Awaited<T>` 返回类型就是 T。

第二个判断就有点复杂了，`object & { then(onfulfilled: infer F, ...args: infer _): any; }` 是一个交叉类型，交叉类型会把多个类型合并，交叉后的类型包含原有类型的所有方法、属性。具体到这里判断的内容就是， T 是否为 object 且有 then 方法，如果是可以被看作 Promise 对象。

infer 用来获取一个推断完成后要使用的类型，比如说 TypeScript 中有一个内置类型，**ReturnType**：

```ts
type ReturnType<T> = T extends (...args: any[]) => infer P ? P : any;
```

ReturnType 用来提取函数返回值类型，假设传入 T 是一个函数类型，P 代表 T 的返回值类型。也就是说，在 extends 后面，可以使用 infer 在某一位置插入一个类型变量，在 extends 成立后，可以使用 P 将占位的类型提取出来。

这里将 then 的成功回调 `onfulfilled` 的类型提取出来用 F 表示。

第三个判断，判断提取出来的 `onfulfilled` 回调，是否是一个函数，如果是又将传递给 onfulfilled 的首个参数类型 V 提取出来，最终返回 `Awaited<V>`。

### 常用的内置类型

既然提到了 ReturnType，就顺便看一下还有那些功能性的内置类型。

**Partial**：Partial 可以把类型所有属性变成可选，实现就是在所有属性后面加上 ?。

```ts
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

**Required**：Required 功能相反，把类型所有属性变成必须的，实现就是把属性的 ? 都给去掉。

```ts
type Required<T> = {
  [P in keyof T]-?: T[P];
};
```

**Readonly**：Readonly 会把类型所有属性变成只读。

```ts
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

**Pick**：Pick 将类型中某一属性的类型提取出来。

```ts
// keyof 返回的事属性名的联合类型，例如 'name' | 'age'
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

**Record**：Record 用来生成一些值为相同类型的对象。

```ts
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

**Exclude**：Exclude 用来排除 T 中属于 U 的类型。

```ts
type Exclude<T, U> = T extends U ? never : T;
type A = "a" | "b" | "c";
type B = "a" | "d";
type C = Exclude<A, B>; // type C = "b" | "c"
```

**Extract**：和 Exclude 相反，Extract 用来提取类型，提取 T 中属于 U 的类型。

```ts
type Extract<T, U> = T extends U ? T : never;
```

**Omit**：Omit 会排除掉 T 中属于 K 的属性，生成一个新类型。

```ts
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

这里使用了两个上面的类型，Exclude 排除了 T 中属于 K 的属性，Pick 将剩下的属性全部提取出来。举个例子：

```ts
interface DataA {
  name: string;
  age: number;
}
type NewData = Omit<DataA, "name">; // type NewData = { age: number }
```

**NonNullable**：NonNullable 用来排除 `null` 和 `undefined`。

TypeScript 4.8 说明： Another change is that `{}` intersected with any other object type simplifies right down to that object type. That meant that we were able to rewrite `NonNullable` to just use an intersection with `{}`, because `{} & null` and `{} & undefined` just get tossed away.

```ts
// type NonNullable<T> = T extends null | undefined ? never : T; 原来的 NonNullable
type NonNullable<T> = T & {};
```

**Parameters**：Parameters 用来提取函数参数类型，返回结果是函数参数类型组成的元组。

```ts
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
```

**ConstructorParameters**：ConstructorParameters 用来提取构造函数的参数，同样返回元组。`abstract` 是为了包括抽象类。

```ts
type ConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;
```

**ReturnType**：ReturnType 返回值类型。

```ts
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

**InstanceType**：用来提取类实例类型。

```ts
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;
```

下面是几个奇怪的类型，都和字符串有关：

```ts
/**
 * Convert string literal type to uppercase
 */
type Uppercase<S extends string> = intrinsic;

/**
 * Convert string literal type to lowercase
 */
type Lowercase<S extends string> = intrinsic;

/**
 * Convert first character of string literal type to uppercase
 */
type Capitalize<S extends string> = intrinsic;

/**
 * Convert first character of string literal type to lowercase
 */
type Uncapitalize<S extends string> = intrinsic;
```

`intrinsic` 关键字用来声明编译器需要提供的内置类型，怎么实现并不需要用户来考虑，知道功能就行了。
