---
sidebar_position: 4
tags: [redux]
---

# Redux

## 基本概念

Redux 是一个状态状态管理库，用于在不同组件中共享和管理状态。

在 React 中，有单向数据流的概念。State（状态）驱动 View（视图层） 渲染，视图层可以通过触发 Actions（事件）来改变状态，状态变成会触发视图更新，这里数据流向都是单向的。在组件层面，也是一致的，props 从上到下流动，子组件无法直接修改 props。这样就需要 `Lifting state up`，将事件的处理提升到父组件内，从顶层修改数据源，这样也能做到子组件间的数据共享。

当应用结构变复杂后，这种操作就变得困难起来。例如，多个不同层级的组件间共享数据，需要将数据和修改数据的操作，提升到所有组件的公共父级，再逐层传递下去。有的组件其实并不需要这些状态，但是子组件需要，依旧需要接受并将 state 传递下去。

为了解决这些问题，就出现了 Redux 这类工具库。

> 在 React 和 Redux 中经常提到 Pure 的概念。如果了解函数式编程，会发现对于 Pure 和 Side Effect（副作用） 讨论也是很多的。所谓的 Pure 可以看做纯粹的逻辑计算，例如解方程。学过数学都知道，数学不会就是不会，不对就是不对。 There is no royal road to geometry，在代码中同样希望如此。如果一个代码是 Pure，无论怎么跑都不会出错。排查问题时，就可以跳过这部分。
>
> Redux 中每个概念的拆分也是基于此，尽量区分 Pure 和有 Side Effect 的部分。这样拆分的问题就是，可能打断整个流程。比如说具有 Side Effect 的部分，处在流程的中间。那么前后的部分都是 Pure Function（纯函数），需要拆成两部分。理解这一点，结合 data flow，就好记住 Redux 中的概念。

### Store

Store 相当于一个仓库，存储当前 state，下面是一个创建 store 并获取 state 的示例：

```js
import { configureStore } from '@reduxjs/toolkit'
// 创建 store 
// reducer 会在后面介绍
const store = configureStore({ reducer: counterReducer })
// 通过 store.getState() 获取状态
console.log(store.getState())
```

### Actions

Actions 是一个对象，必须包含有 `type` 属性。Actions 相当于一个事件， 可以有一个可选的描述属性 `payload`，payload 用来传递额外参数。官方推荐 Action 的 type 最好添加 scope，下面是一个实例：

```js
const addTodoAction = {
  type: 'todos/todoAdded', // todos 是一个 scope 非必需，type 是字符串就行
  payload: 'Buy milk'
}
// 假设需要传递参数，可以使用下述方式
// 创建一个 Action Creator
// 每次需要一个 action 对象时
// 调用函数即可
const addTodo = payload => {
  return {
    type: 'todos/todoAdded',
    payload
  }
}
```

### Dispatch

Dispatch 是 store 提供的一个方法，接受一个 action，触发对应 action type 的操作。可以这样理解，Action 定义了事件，通过调用 dispatch 可以触发这个事件，就类似点击按钮一样。

触发方式很简单：

```js
store.dispatch(addTodo())
```

我觉得它就像一个 I/O 接口，链接 real world 和 redux 的 pure world。在执行 dispatch 前，可以进行具有副作用的动作，例如异步请求。等待这些操作完成后，就能得到一个需要的最终数据，拿到这些数据就可以执行 dispatch。这样看 dispatch 隔开了具有副作用和 pure 的部分，接下里就是一个纯函数处理过程，确定输入得到确定结果的过程（这部分由下面的 reducer 完成）

### Reducer

Reducer 是一个函数，接受当前的 state 和 一个 action，返回一个新的 state（newState），newState 会替换掉原有状态。

```js
const initialState = { value: 0 }

function counterReducer(state = initialState, action) {
  // Check to see if the reducer cares about this action
  if (action.type === 'counter/increment') {
    // If so, make a copy of `state`
    return {
      ...state,
      // and update the copy with the new value
      value: state.value + 1
    }
  }
  // otherwise return the existing state unchanged
  return state
}
```

这里有几点注意事项，Redux 官方推荐：

* 计算 newState 只能依赖于原有的 state，和 action。
* 不能异步操作。
* 不要修改原有 state，若 state 为引用类型，可以 copy 一份新值，在新值上进行修改，再将新值返回出去。

其实这些要求都是和上述思路是一致的，主要是为了保证 reducer 是一个纯函数。假如说，有一个地方依赖 state 这个对象，直接修改可能出现问题。

:::tip

虽然有这些规范，不代表你不会出问题。JavaScript 不能强制对象不可修改。规范在这里更像一个约定，如果违反会有风险，理解了规范打破的概率就会更低，出来问题也好排查。不理解只是记住这些规范，使用时依然可能出问题。

:::

### Selectors

Selectors 类似 Pinia 中的 getters 或者说 Vue 中计算属性，如果需要对 state 进行一些操作，返回一个新值可以使用 selectors。

```js
const selectCounterValue = state => state.value // 计算规则，如果数据较多，可以用来过滤数据

const currentValue = selectCounterValue(store.getState())
```

Redux 中这么多概念，和整个设计思路是密切相关的。如果使用过 Vuex 就会发现，其中也区分了 actions 和 mutions，同时强调异步操作不能在 mutions 中使用。思路都是一致的，都是为了尽量拆分具有副作用的部分。出现问题，就只需要排查副作用的部分即可。

拆分 actions 和 Redux 事件的思想是一致的，actions 作为事件一定是预定义好的。就像浏览器一样，我们常接触的事件有点击、hover 等，不同的元素可能会触发不同类型的事件，这些都是提前抽象过的。现实中每时每刻都在发生各种事件，例如看浏览器内容，评论页面样式等，只有定义过的事件，才是值得我们关心。我理解 Redux 整个逻辑是这样的，首先定义事件（Action），随后触发事件（Dispatch），触发后进行事件处理（Reducer）。我对基本概念的的介绍顺序，也遵循这个逻辑。

有些人觉得这些概念难懂、或者冗余，可能是有另一种思考。将事件只分为两个部分，事件触发和事件处理。例如，你跟朋友说，帮我把那杯水拿过来，朋友听到后就把水拿过来。或者，你和朋友定了一个暗号，你发出 ohooo 的声音，他就帮你把那杯水拿过来。这样就你就不需要说那么多，只需要 ohooo，他就会把水拿给你。Redux 使用的是后一种，大多数人生活中习惯前一种。所以 Actions 和 Reducer 的拆分，就显得多余。

基于上面的问题，有了 Redux Toolkit：

## Redux Toolkit(RTK)

### createSlice

在创建 store 上，Redux Toolkit 和原来的做法没有什么区别。主要区别就是，出现了 Slice 的概念。Slice 将 action 和 reducer 合并了，基本使用如下：

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// slice state type
export interface CartState {
    value: number
}

// Initial state
const initialState: CartState = {
    count: 0
}

export const cartSlice = createSlice({
    name: 'cart', // scope，例如下面的 addition，自动生成的 action type 就会是 cart/addition
    initialState, // 初始状态
    reducers: {
        addition: (state, action: PayloadAction<number>) => {
            // Redux Toolkit 使用了 Immer
            // 表面上看是直接修改了数据
            // 实际上所有操作都会返回新值
            state.count += action.payload
        },    
    }
})

// 这里会自动生成 reducers 中对应的 actionCreator
export const { addition } = cartSlice.actions
// 返回 reducer 可以在创建 state 中使用
export default cartSlice.reducer
```

在组件中使用 store 的数据，需要用到 Redux Toolkit 提供的 hooks。

### useSelector

useSelector 用来实现 selector 的功能：

```ts
// 定义 selector
export const selectCount = state => state.counter.value
// 使用 selector
const count = useSelector(selectCount)
// 或者使用时，传入函数
const countPlusTwo = useSelector(state => state.counter.value + 2)
```

### useDispatch

useDispatch 用来获取触发更新的 dispatch 方法：

```js
// 调用后获取 dispatch 方法
const dispatch = useDispatch()
// 使用，注意这里要调用
// 传递 payload，形式 addition(payload)
// 不传递也必须调用，不能只传函数名
dispatch(addition())
```

## 项目中使用

项目中使用 Redux 保存购物车数据，实际上保存在数据库更合理，这里用作示例。

### 创建 slice

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// 数据类型
import { CoffeeData } from '@/mock/products' 
// 保存的数据需要用 count 标识个数
type CartProduct = (Partial<CoffeeData> & { count: number })

// 定义 state 类型
export interface CartState {
    good: CartProduct[]
}

// state 初始状态
const initialState: CartState = {
    good: []
}

export const cartSlice = createSlice({
    name: 'counter', // scope
    initialState,
    reducers: {
        increment: (state, action: PayloadAction<CoffeeData>) => {
            let index = state.good.findIndex(go => go.id === action.payload.id)
            // 没有相关商品，先写入商品
            if (index < 0) {
                index = state.good.length
                state.good.push({ ...action.payload, count: 0 })
            }
            state.good[index].count += 1
        },
        decrement: (state, action: PayloadAction<CoffeeData>) => {
            const index = state.good.findIndex(go => go.id === action.payload.id)
            // 没有相关商品，不用处理
            if (index < 0) {
                return
            }
            state.good[index].count -= 1
        },
    }
})

// 导出 action creator
export const { increment, decrement } = cartSlice.actions
// 导出 reducer
export default cartSlice.reducer
```

Redux store 创建，增加 TypeScript 表现，导出了 state 和 diapatch 类型：

```typescript
import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cart'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/index'
// 创建 store
const store = configureStore({
    reducer: {
        cart: cartReducer
    }
})

// 导出 store state 类型
export type RootState = ReturnType<typeof store.getState>
// 导出 dispatch 类型
export type AppDispatch = typeof store.dispatch

// typescript 增加的 dispatch 和 selector
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export default store                                 
```

使用：

```tsx
import { CoffeeData } from "@/mock/products";
import React, { FC, useRef } from "react";
import { message } from "antd";
import { useAppDispatch } from "@/store/index";
import { increment } from "@/store/slices/cart";

interface Props {
  data: CoffeeData;
}

const ProductGrid: FC<Props> = ({ data }) => {
  const slideRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const el = slideRef.current!;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--x",
      event.clientX - (r.left + Math.floor(r.width / 2)) + ""
    );
    el.style.setProperty(
      "--y",
      event.clientY - (r.top + Math.floor(r.height / 2)) + ""
    );
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    slideRef.current!.style.setProperty("--x", "0");
    slideRef.current!.style.setProperty("--y", "0");
  };

  const imageLoaded: React.ReactEventHandler<HTMLImageElement> = (event) => {
    (event.target as HTMLImageElement).style.opacity = "1";
  };

  const style = { "--translate-base": 10 } as React.CSSProperties;

  const [messageApi, contextHolder] = message.useMessage();
  const handlePurchase = () => {
    void messageApi.open({
      type: "warning",
      content: "哥们, 你真买啊!",
    });
  };
	// 使用 dispatch
  const dispatch = useAppDispatch();

  const handleCartAddition = (data: CoffeeData) => {
    // 触发 Redux 更新
    dispatch(increment(data));
  };

  return (
    <>
      {contextHolder}
      <div
        ref={slideRef}
        className="w-[320px] px-[10px] pb-[18px] xl:basis-1/3 2xl:basis-1/4"
      >
        <div
          style={style}
          className="pl-[100px] pt-[100%] relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            className="absolute top-0 left-0 h-full w-full object-cover opacity-0 
          transition-transform origin-center 
          hover:scale-110 
          hover:translate-x-[calc(var(--x)/var(--translate-base)*1px)] 
          hover:translate-y-[calc(var(--y)/var(--translate-base)*1px)]"
            alt={data.headline}
            src={data.url}
            onLoad={imageLoaded}
          />
        </div>

        <div className="w-full py-[16px]">
          <h2 className="text-[14px] my-[6px]">{data.headline}</h2>
          <p className="text-[12px] text-[#767676]">{data.description}</p>
          <div className="rounded-es-full overflow-hidden text-[14px] py-[6px] mr-[4px] select-none">
            <div
              className="float-right pr-[10px] pl-[6px] py-[3px] bg-orange-600 text-zinc-100 rounded-e-full cursor-pointer"
              onClick={handlePurchase}
            >
              购买
            </div>
            <div
              className="float-right pr-[4px] pl-[10px] py-[3px] bg-orange-500 text-zinc-100 rounded-s-full cursor-pointer"
              onClick={() => handleCartAddition(data)}
            >
              加入购物车
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductGrid;
```

