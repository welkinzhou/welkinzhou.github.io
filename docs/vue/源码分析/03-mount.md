---
slug: "mount"
sidebar_position: 3
tags: [vue]
description: "追踪组件 VNode、实例、setup、渲染副作用与 DOM 挂载，对照 Vue 3.5 更新任务。"
---

# mount 流程

本文接着看 app.mount，沿用 Vue 3.2 系列片段，以 [v3.2.47 renderer.ts](https://github.com/vuejs/core/blob/v3.2.47/packages/runtime-core/src/renderer.ts) 对照。这里关注同步组件在浏览器中的首次挂载，暂不展开 SSR、异步 setup、Suspense 与 KeepAlive；Vue 3.5 的调度变化在末尾说明。

先区分三个对象：**组件 VNode** 描述要渲染哪个组件和哪些输入；**组件实例** 保存 props、setup 状态、生命周期和 effect；**subTree** 是执行渲染函数得到的 VNode 子树。创建组件 VNode 不等于创建实例，也不等于创建 DOM。

## 创建 vnode

mount 首先会创建 vnode，首先使用 \_createVNode 去统一参数形式，方便后续处理：

```typescript
function _createVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag: number = 0,
  dynamicProps: string[] | null = null,
  isBlockNode = false
): VNode {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    if (__DEV__ && !type) {
      warn(`Invalid vnode type when creating vnode: ${type}.`)
    }
    // 无法识别的默认是 comment
    type = Comment
  }

  // 拦截重复创建情况
  if (isVNode(type)) {
    // createVNode receiving an existing vnode. This happens in cases like
    // <component :is="vnode"/>
    // #2078 make sure to merge refs during the clone instead of overwriting it
    const cloned = cloneVNode(type, props, true /* mergeRef: true */)
    if (children) {
      normalizeChildren(cloned, children)
    }
    return cloned
  }

  -- snip normalization --

  // encode the vnode type information into a bitmap
  // 判断 shapeFlag，patch 时根据类型做不同处理
  // mount 传入 App 会被编译成 Object
  // 最终会是 ShapeFlags.STATEFUL_COMPONENT
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : __FEATURE_SUSPENSE__ && isSuspense(type)
    ? ShapeFlags.SUSPENSE
    : isTeleport(type)
    ? ShapeFlags.TELEPORT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0

  --snip--

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  )
}
```

中间省略了 type 和 props 的规范化处理。class、style 支持字符串、对象或数组，渲染前需要统一形式。若规范化要改写传入对象，会先复制相关数据，避免影响其他使用者；这不是说响应式对象在业务代码中不能修改。

接下来就是真正的创建 vnode：

```typescript
function createBaseVNode(
  type: VNodeTypes | ClassComponent | typeof NULL_DYNAMIC_COMPONENT,
  props: (Data & VNodeProps) | null = null,
  children: unknown = null,
  patchFlag = 0,
  dynamicProps: string[] | null = null,
  shapeFlag = type === Fragment ? 0 : ShapeFlags.ELEMENT,
  isBlockNode = false,
  needFullChildrenNormalization = false
) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null
  } as VNode

  -- snip --

  return vnode
}
```

根 VNode 的 props 来自 createApp 的第二个参数，可能为 null。shapeFlag 表示节点与子节点类别，patchFlag 是编译器提供的动态更新提示，两者用途不同。接下来进入 render。

下面是 render 方法：

```typescript
const render: RootRenderFunction = (vnode, container, isSVG) => {
  if (vnode == null) {
    if (container._vnode) {
      unmount(container._vnode, null, null, true);
    }
  } else {
    patch(container._vnode || null, vnode, container, null, null, null, isSVG);
  }
  flushPostFlushCbs();
  container._vnode = vnode;
};
```

vnode 已经创建，会走 patch 逻辑。Render 执行完成后 vnode 会被放在 `container._vnode` 上。Container 保存在 `app._container` 属性上，感兴趣可以直接打印 app 看一下是什么样子。Patch 这个方法有很多情况，主要是控制语句，根据 vnode 的类型调用不同的方法。App 的类型是 Component，看 `processComponent` 方法即可。

```typescript
const processComponent = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  isSVG: boolean,
  slotScopeIds: string[] | null,
  optimized: boolean
) => {
  n2.slotScopeIds = slotScopeIds;
  if (n1 == null) {
    if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
      (parentComponent!.ctx as KeepAliveContext).activate(
        n2,
        container,
        anchor,
        isSVG,
        optimized
      );
    } else {
      mountComponent(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        optimized
      );
    }
  } else {
    updateComponent(n1, n2, optimized);
  }
};
```

n1 是 null，会走 mountComponent。mountComponent 主要就是创建了 instance，调用 setupRenderEffect，其他的 dev 热更新、KeepAlive、Suspense 组件处理全部跳过了。

```typescript
const mountComponent: MountComponentFn = (
    initialVNode,
    container,
    anchor,
    parentComponent,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    // 2.x compat may pre-create the component instance before actually
    // mounting
    const compatMountInstance =
      __COMPAT__ && initialVNode.isCompatRoot && initialVNode.component
    const instance: ComponentInternalInstance =
      compatMountInstance ||
      (initialVNode.component = createComponentInstance(
        initialVNode,
        parentComponent,
        parentSuspense
      ))

    // resolve props and slots for setup context
    if (!(__COMPAT__ && compatMountInstance)) {
      if (__DEV__) {
        startMeasure(instance, `init`)
      }
      // setUp 语法相关处理
      // 初始化 props、attrs 与 slots；$attrs 反映最新值，但不可作为响应式状态侦听
      // 还有 template / render function normalization
      setupComponent(instance)
      if (__DEV__) {
        endMeasure(instance, `init`)
      }
    }


    -- snip --

    setupRenderEffect(
      instance,
      initialVNode,
      container,
      anchor,
      parentSuspense,
      isSVG,
      optimized
    )
    -- snip --
  }
```

看一下 instance 属性，EffectScope 用来设置 effect 的作用域：

```typescript
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInternalInstance | null,
  suspense: SuspenseBoundary | null
) {
  const type = vnode.type as ConcreteComponent;
  // inherit parent app context - or - if root, adopt from root vnode
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext;

  const instance: ComponentInternalInstance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null!, // to be immediately set
    next: null,
    subTree: null!, // will be set synchronously right after creation
    effect: null!,
    update: null!, // will be set synchronously right after creation
    scope: new EffectScope(true /* detached */), // 创建 scope
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    accessCache: null!,
    renderCache: [],

    // local resovled assets
    components: null,
    directives: null,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),

    // emit
    emit: null!, // to be set immediately
    emitted: null,

    // props default value
    propsDefaults: EMPTY_OBJ,

    // inheritAttrs
    inheritAttrs: type.inheritAttrs,

    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,

    // suspense related
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,

    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null,
  };
  if (__DEV__) {
    instance.ctx = createDevRenderContext(instance);
  } else {
    instance.ctx = { _: instance };
  }
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance); // 绑定 emit 指向

  // apply custom element special handling
  if (vnode.ce) {
    vnode.ce(instance);
  }

  return instance;
}
```

调用 setupRenderEffect 来设置响应式：

```typescript
const setupRenderEffect: SetupRenderEffectFn = (
    instance,
    initialVNode,
    container,
    anchor,
    parentSuspense,
    isSVG,
    optimized
  ) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        let vnodeHook: VNodeHook | null | undefined
        const { el, props } = initialVNode
        const { bm, m, parent } = instance
        const isAsyncWrapperVNode = isAsyncWrapper(initialVNode)

        // 在 beforeMount 等钩子执行期间暂时关闭递归更新权限。
        // 这是重入控制；更新任务的批量去重由 scheduler 负责。
        toggleRecurse(instance, false)
        // beforeMount hook
        if (bm) {
          invokeArrayFns(bm)
        }
        // onVnodeBeforeMount
        if (
          !isAsyncWrapperVNode &&
          (vnodeHook = props && props.onVnodeBeforeMount)
        ) {
          invokeVNodeHook(vnodeHook, parent, initialVNode)
        }
        if (
          __COMPAT__ &&
          isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
        ) {
          instance.emit('hook:beforeMount')
        }
        toggleRecurse(instance, true)

        if (el && hydrateNode) {
          -- snip --
        } else {
          if (__DEV__) {
            startMeasure(instance, `render`)
          }
          // 调用组件 render
          // render 返回整个组件的 VNode 子树，不只是 children
          // 可来自模板预编译，也可由开发者手写
          const subTree = (instance.subTree = renderComponentRoot(instance))
          if (__DEV__) {
            endMeasure(instance, `render`)
          }
          if (__DEV__) {
            startMeasure(instance, `patch`)
          }
          // 对比子级
          patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            isSVG
          )
          if (__DEV__) {
            endMeasure(instance, `patch`)
          }
          initialVNode.el = subTree.el
        }
        // mounted hook
        if (m) {
          queuePostRenderEffect(m, parentSuspense)
        }
        // onVnodeMounted
        if (
          !isAsyncWrapperVNode &&
          (vnodeHook = props && props.onVnodeMounted)
        ) {
          const scopedInitialVNode = initialVNode
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook!, parent, scopedInitialVNode),
            parentSuspense
          )
        }

        // activated hook for keep-alive roots.
        // #1742 activated hook must be accessed after first render
        // since the hook may be injected by a child keep-alive
        if (initialVNode.shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
          instance.a && queuePostRenderEffect(instance.a, parentSuspense)
          if (
            __COMPAT__ &&
            isCompatEnabled(DeprecationTypes.INSTANCE_EVENT_HOOKS, instance)
          ) {
            queuePostRenderEffect(
              () => instance.emit('hook:activated'),
              parentSuspense
            )
          }
        }
        instance.isMounted = true

        // #2458: deference mount-only object parameters to prevent memleaks
        initialVNode = container = anchor = null as any
      }
      —— snip ——
    }

    // create reactive effect for rendering
    // 创建渲染副作用，不是在这里把业务数据转换成 reactive
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(instance.update),
      instance.scope // track it in component's effect scope
    ))

    const update = (instance.update = effect.run.bind(effect) as SchedulerJob)
    update.id = instance.uid
    // allowRecurse
    // #1801, #2043 component render effects should allow recursive updates
  	// 	注释已经写了，component render effects 应该可以递归自身
    toggleRecurse(instance, true)
    // 手动调用 update 触发依赖收集
    update()
  }
```

## setup 与模板编译在哪里

setupComponent 先初始化 props 和 slots，再处理有状态组件。setup 的对象返回值被保存，通过 proxyRefs 暴露给渲染访问；返回函数时，直接用作 render。`<script setup>` 是编译时语法，其主体被编译进每个实例执行的 setup，不是运行时再解析 script 标签。

SFC 模板通常由 compiler-sfc 联合 compiler-dom、compiler-core 在构建阶段生成 render。组件尚无 render、存在 template 且运行时注册了编译器时，才走运行时编译路径。见 [component.ts](https://github.com/vuejs/core/blob/v3.2.47/packages/runtime-core/src/component.ts) 与[渲染机制](https://vuejs.org/guide/extras/rendering-mechanism.html)。

attrs 保存未声明为 props 或 emits 的透传属性。它反映最新数据，但不能把 `watch(() => attrs.foo)` 当作正常的响应式侦听来源；需要跟踪变化的输入应声明为 prop。见[透传属性](https://vuejs.org/guide/components/attrs.html#accessing-fallthrough-attributes-in-javascript)。

## 从组件子树到真实 DOM

```text
根组件 VNode
  → mountComponent
  → createComponentInstance（创建实例与 effect scope）
  → setupComponent（初始化输入、执行 setup、确定 render）
  → setupRenderEffect
  → 首次同步调用 update()
  → renderComponentRoot 得到 subTree
  → patch(null, subTree)
  → 元素节点：mountElement → 创建、设置属性、插入 DOM
  → 子组件：再次进入 mountComponent
```

首次渲染运行在 ReactiveEffect 中。render 读取响应式数据时建立依赖，后续改变这些数据会通知渲染 effect。scope 在创建组件实例时建立，卸载时停止其中的副作用。

挂载前执行 beforeMount，DOM 插入后调度 mounted。同步子组件的 mounted 先于父组件；异步组件和 Suspense 内的组件不包含在这个保证中。模板引用在挂载前可能为 null，DOM 初始化通常放在 onMounted，资源释放放在 onUnmounted。见[生命周期 API](https://vuejs.org/api/composition-api-lifecycle.html#onmounted)。

## 后续更新与首次挂载的差别

再次渲染时已有 instance.subTree：生成新子树，再执行 `patch(prevTree, nextTree)`。类型相同则复用并更新，类型不同则卸载后重新挂载。数组子节点的变化才进入[列表 diff](./01-diff.md)，并非每次更新都会执行整套 keyed diff。

渲染函数执行范围与 DOM 实际改动范围也不同。patchFlag、静态提升和 block 信息帮助 patch 跳过不需要比较的内容；新 VNode 仍由 render 产生，不能理解为 setter 直接改某个 DOM 属性。

## Vue 3.5 的更新任务

Vue 3.2 的片段把 scheduler 与 scope 传给 ReactiveEffect 构造函数。Vue 3.5.43 在组件 scope 激活期间创建 effect，再设置 scheduler，并区分 update 与 job：

```ts
// Vue 3.5.43 摘录，省略 scope 激活、调试与递归标志。
const effect = (instance.effect = new ReactiveEffect(componentUpdateFn))
const update = (instance.update = effect.run.bind(effect))
const job = (instance.job = effect.runIfDirty.bind(effect))
job.i = instance
job.id = instance.uid
effect.scheduler = () => queueJob(job)
update()
```

首次 update 执行渲染，后续入队的 job 先检查是否需要运行。见 [v3.5.43 renderer.ts](https://github.com/vuejs/core/blob/v3.5.43/packages/runtime-core/src/renderer.ts)，依赖如何变化见[响应式原理](./04-响应式原理.md)。不要混用两版的构造参数。

应用层不需要操作这些内部字段。同步赋值后要读取新 DOM，使用 `await nextTick()`；它等待当前更新队列完成，不承诺浏览器已绘制。队列细节见 [scheduler.ts](https://github.com/vuejs/core/blob/v3.5.43/packages/runtime-core/src/scheduler.ts)。
