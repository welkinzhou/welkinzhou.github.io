---
slug: "mount"
sidebar_position: 3
tags: [vue]
---

# mount 流程

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

中间省略的事 type 和 props 的 normalize 处理，例如 class 和 style 可以有多种绑定方式，对象、字符串和数组，将这几种方式绑定值统一形式方便后续处理。同时处理时还需要考虑，这些值中是否有相应式对象，响应式对象不能直接修改，会影响到其他功能，复制一份处理。

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

vnode 的基本属性就是这些，mount 过程中并没有传入什么属性，可以直接去看 render 过程。

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
      // 这里设置了 $attrs 的响应式
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

				// toggleRecurse 用来设置当前 effect job 能递归调用自身
        // 这里设置为 false，不会递归自身
        // 在组建 update 完成前，阻止掉递归，多次更新一次提交
        // 默认响应式触发的更新，就不会再次触发自身
        // By default, a job cannot trigger itself because some built-in method calls,
        // e.g. Array.prototype.push actually performs reads as well (#1740) which
        // can lead to confusing infinite loops.
        // 在 watch 中，可以再次触发
        // Vue 不推荐在 watch 中更新响应式数据源，可能触发 infinite loop
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
          // render 会返回 children
          // render 是 compile 后提供的
          // 需要去看 compile-core
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
    // 创建 reactive 数据
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

到这里 mount 的工作就完成了。大体流程是这样，根据 createApp 传入的 rootComponent，创建 vnode。通过 patch 方法，设置老的 vnode 为 null，将组件渲染到页面。创建 vnode 过程中会，创建组件的 scope，将组件更新的 effects 写入对应 scope。手动触发更新，自动去收集依赖，实现后续响应式。组件的编译部分通过 compile-core 部分实现，我想看的 template 编译和响应式数据绑定，并不在这部分，需要继续翻找。

这里出现了 ReactiveEffect 这个类，这就和响应式相关了。响应式内容比较多，准备单独写。
