---
sidebar_position: 3
tags: [react]
---

# 创建 Home

页面组件我放在了 `src/views` 文件夹下面，页面中用到的一些 components，放在 `src/components` 文件下面。

接着在 views 文件夹下面创建页面相关文件，目前只有 home，home 的样式参考的这个 [codepen](https://codepen.io/veronicadev/pen/eVOzOY)。代码太长，这里就不展示了，可以去 codepen 看。样式我全部用 tailwind 改造了一遍。

这个主题是咖啡，刚好之前在云南上学时候，接触过云南咖啡，内容做了点删减改成云南咖啡相关的。

我把很多内容都拆分了出去，看一下最后的 Home：

```tsx
import React, { useEffect, useRef, useState } from "react";

import Footer from "@/components/core/Footer";
import Banner from "@/components/home/Banner";
// import Section from "@/components/home/Section";
import Story from "@/components/home/Story";
import Great from "@/components/home/Great";
import Store from "@/components/home/Store";

const Home = () => {
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const height = footerRef.current!.offsetHeight;
    setFooterHeight(height);
  }, [footerRef]);

  return (
    <>
      <Banner />
      <Story />
      <Great />
      <Store />
      <div
        className="fake-footer"
        style={{ height: footerHeight + "px" }}
      ></div>
      <Footer ref={footerRef} />
    </>
  );
};

export default Home;

```

`Banner`、`Story`、`Great`、`Store` 都是简单的视图组件。`Footer` 是页脚组件，预留通讯地址，相关信息位置，Demo 里没有显示内容。`div.fake-footer` 用来撑高底部展示 `Footer`。

组件具体细节可以看代码，重点描述相关 concepts。

### hooks

这里使用了三个 hook，useState、useRef，和 useEffect。

#### useState

useState 是最常用的一个 hook，用来创建页面需要展示的变量值。类组件中，将 state 绑定在 this 上，保证 render 时，不会重新初始化 state。函数式组件，通过 useState 保证重新调用函数时，可以保存 state。

```ts
const [state, setState] = useState(initialState)
```

useState 接受一个参数，initialState 用来初始化默认状态，initialState 可以是普通值，或者函数。如果是函数，初始化会调用 initialState，将返回值作为默认状态。useState 返回一个数组，第一个值是 state 状态值，第二个是 state 的 set function，通常解构赋值后使用。state 通过 setState 更新，直接修改 state 无法同步改变视图，会导致下一次更新时获取到的 state 状态和预期不一致。

React 更新，使用的是批量更新，当前方法中调用 setState 无法立刻得到更新后的值，需要等到下一次视图更新后才会是新值。setState 时可以传入新值，直接替换（React 建议传入值时，引用类型 copy 创建新值，不去直接修改原有 state），也可以传入函数或表达式。函数或表达式，两种方式预期的结果不同：

```js
// 引用类型更新
// 引用类型，直接修改地址没有更新
// 所以被认为同一个值，不会触发更新
// 需要传入一个新值
setState({
  ...state,
  type: newType,
  // nest field
  child: {
    ...state.child,
    smoething: newSomething
  }
})
// 假设初始值是 42
function handleClick() {
  setState(state + 1); // setAge(42 + 1)
  setState(state + 1); // setAge(42 + 1)
  setState(state + 1); // setAge(42 + 1)
}
function handleClick() {
  setState(s => s + 1); // setAge(42 => 43)
  setState(s => s + 1); // setAge(43 => 44)
  setState(s => s + 1); // setAge(44 => 45)
}
```

直接传入表达式，由于 state 在视图刷新前不会修改，所以结果都是 43，传入函数会多次调用，能起到累加效果。

:::tip

Vite 项目默认是 Strict Mode，开发环境下 useState 初始化使用的如果是函数，React 会执行两边，对比效果是否一致，来判断 init 过程是否 pure。

:::

#### useEffect

useEffect 相当于函数式组件的生命周期方法，方法有两个参数 setUp 方法和一个 deps 数组，第二个参数可选。

setUp 用来指定触发的操作，如果方法有返回值，会被当作 cleanUp 的一部分，在下一次 setUp 主逻辑执行前调用。

整体流程是这样：state 改变造成页面需要刷新，随后会调用 cleanUp 传入老的 state 执行清理操作，再使用新的 state 调用 setUp 主逻辑。组件首次挂载时，没有老状态，所以不会先调用 cleanUp。在组件被卸载时，会最后调用一次 cleanUp。

```ts
useEffect(() => {
    // do something
    return () => {
      // clean effect
      cleanHandler()
    };
  }, [dep, ...]);
// cancel effect 
cancelHandler()
```

对于第二个参数 deps，有三种不同的情况。如果缺省 deps，React 会在每次更新视图后调用 setUp，包括组件挂载，视图更新后的 re-render。假设给了一个空数组，也就是没有依赖，这样相当于依赖不会更新，那么 setUp 只会在组件挂载时执行一次。如果 deps 是一个为空的数组，那么 setUp 会在组件挂载后，和相应依赖变更后（React 会用 Object.is() 来判断两个值是否不同）执行。

:::tip

Strict Mode 下，开发环境下，上述流程都会执行两遍来对比组件逻辑是否 pure。

:::

#### useRef

`useRef` 的作用类似 Vue 中 ref 使用，`useRef` 返回一个 包含 current 的 Object。`useRef` 通常有两个作用，一个就像我这里使用的绑定 DOM 元素，current 中会包含调用 ref 的 DOM 节点。另一个用法是，保存上一次 render 中的某些信息。每次 render，函数都会重新执行，函数内部变量也都会初始化。假设组件中有一个定时器，重新渲染时，不需要重启定时器，就需要一个值去保留这个定时器 id，此时可以使用 useRef 。

不同于 state，修改 ref 的 current，不会触发更新。

另外这里的 `Footer` 其实是一个组件，并不能直接绑定 ref，这里使用了 `forwardRef` 这个 API。假设我们要获取一个组件下，某个 DOM 节点，就需要 forwardRef 包装一层。包装的函数有两个参数，第一个是 props，我这里没有就用 _ 表示了。第二个是需要绑定的 ref，在组件中绑定到对应元素上（不一定要最外层，任何元素都行），这样就把这个元素传递给父级 ref 对象的 current。

```tsx
import React, { ReactNode, forwardRef } from "react";

interface Props {
  children?: ReactNode;
}
export type Ref = HTMLElement;

const Footer = forwardRef<Ref, Props>((_, ref) => {
  return (
    <footer
      ref={ref}
      className="table w-full fixed bottom-0 left-0 z-[-1] min-h-96"
    >
      <div
        className="w-1/2 table-cell py-[100px] px-[140px] bg-left bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://image.ibb.co/mRGjDm/section_bg_7.jpg')",
        }}
      >
        <h2 className="uppercase leading-[40px] text-[30px] mb-[25px] text-white">
          COME ON IN!
        </h2>
      </div>
      <div className="w-1/2 table-cell py-[100px] px-[140px] bg-black">
        <h2 className="uppercase leading-[40px] text-[30px] mb-[25px] text-white">
          CONTACT
        </h2>
      </div>
    </footer>
  );
});

export default Footer;

```

