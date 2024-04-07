---
slug: diff-compare
title: Vue、React diff 更新策略随感
authors: zhouyuan
tags: [Vue, React, Diff]
---

最近复习了下 Vue 和 React 相关东西，发现两者 diff 和更新逻辑有很大差异，都很有意思。

<!-- truncate -->

diff 一直都是 Vue、React 框架核心的重要部分。了解过二者 diff 过程的都会发现，两个框架在 diff 过程和更新逻辑上有不同的考量。

React fiber 是为了解决 React 16 前出现的一些问题，提出的新的渲染引擎。JS 单线程特质，导致执行 VDOM diff 和更新过程中，会阻塞其他事件的响应。如果 DOM 结构比较复杂，就出整个更新过程中，页面无响应的情况。

## Fiber 逻辑

先来看一个简单版本的 Fiber 实现：

```js
import { updateNodeElement } from "../DOM";
import {
  createTaskQueue,
  arrified,
  createStateNode,
  getTag,
  getRoot,
} from "../Misc";

const taskQueue = createTaskQueue();
let subTask = null;

let pendCommit = null;

const commitAllWork = (fiber) => {
  fiber.effects.forEach((child) => {
    if (child.tag === "class_component") {
      // 组件备份
      child.stateNode.__fiber = child;
    }
    if (child.effectTag === "delete") {
      child.parent.stateNode.removeChild(child.stateNode);
    } else if (child.effectTag === "update") {
      if (child.type === child.alternate.type) {
        // 节点类型相同
        updateNodeElement(child.stateNode, child, child.alternate);
      } else {
        // 类型不同
        child.parent.stateNode.replaceChild(
          child.stateNode,
          child.alternate.stateNode
        );
      }
    } else if (child.effectTag === "placement") {
      // 当前节点是新增操作
      // 添加进父节点
      // 类组件和函数组件的 stateNode 不能添加节点
      // 需要向上查找到 parent，向 parent 添加元素
      const fiber = child;
      let parentFiber = fiber.parent;
      while (
        parentFiber.tag === "class_component" ||
        parentFiber.tag === "function_component"
      ) {
        parentFiber = parentFiber.parent;
      }
      // 上面的循环已经将类组件和函数组件下面所有内容添加到父级，类组件和函数组件不需要添加
      if (fiber.tag === "host_component") {
        parentFiber.stateNode.appendChild(fiber.stateNode);
      }
    }
  });
  /**
   * 备份旧的 fiber 节点对象
   */
  fiber.stateNode.__rootFiberContainer = fiber;
};

const getFirstTask = () => {
  const task = taskQueue.pop();

  if (task.from === "class_component") {
    // 更新
    const root = getRoot(task.instance);
    task.instance.__fiber.partialState = task.partialState;
    return {
      props: root.props,
      stateNode: root.stateNode,
      tag: "host_root",
      effects: [],
      child: null,
      alternate: root,
    };
  }
  // fiber 构建顺序是从上倒下，由左到右
  // 获取根节点，跟节点数据是固定的
  // 构建根节点 fiber
  return {
    props: task.props,
    stateNode: task.dom,
    tag: "host_root",
    effects: [],
    child: null,
    // 添加备份，引用指向 DOM 节点上的属性
    // __rootFiberContainer 会在第一次添加 DOM 时写入元素
    alternate: task.dom.__rootFiberContainer,
  };
};

const reconcileChildren = (fiber, children) => {
  // children 可能是数组，也可以是对象，统一处理成数组
  const arrifiedChildren = arrified(children);

  let index = 0;
  const numberOfElements = arrifiedChildren.length;
  let element = null;
  let newFiber = null;
  let prevFiber = null;

  let alternate = null; // 备份

  if (fiber.alternate && fiber.alternate.child) {
    // 如果有备份，获取根节点备份
    // 这里遍历的是 fiber 下面的子节点
    // 备份的 child 就是子节点的第一个节点
    alternate = fiber.alternate.child;
  }

  // 同级比较
  // 有子元素，或者有备份存在（执行删除）
  while (index < numberOfElements || alternate) {
    // 子节点 virtualDOM 对象
    element = arrifiedChildren[index];

    if (!element && alternate) {
      // 元素不存在，但是备份存在，需要执行删除
      // 这种情况会出现在 diff 的末尾
      alternate.effectTag = "delete";
      // fiber effects 后续遍历添加，只会添加 DOM 结构中有的元素
      // 需要提前添加需要删除的备份元素
      fiber.effects.push(alternate);
    } else if (alternate && element) {
      // 有备份执行更新操作
      newFiber = {
        type: element.type,
        props: element.props,
        tag: getTag(element),
        effects: [],
        effectTag: "update",
        stateNode: null,
        parent: fiber,
        alternate, // 添加备份
      };

      if (alternate.type === element.type) {
        // 节点类型相同，复用更新节点
        newFiber.stateNode = alternate.stateNode;
      } else {
        newFiber.stateNode = createStateNode(newFiber);
      }
    } else if (!alternate && element) {
      // 没有备份，新增创建操作
      newFiber = {
        type: element.type,
        props: element.props,
        tag: getTag(element),
        effects: [],
        effectTag: "placement",
        stateNode: null,
        parent: fiber,
      };

      newFiber.stateNode = createStateNode(newFiber);
    }

    // 只有第一个元素是父级的子节点
    if (index === 0) {
      fiber.child = newFiber;
    } else if (element) {
      // 同层元素根据上一个兄弟节点去查找
      // 把当前节点写入上一个兄弟节点对应 fiber 中
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
    // 同层遍历更新 alternate
    if (alternate && alternate.sibling) {
      alternate = alternate.sibling;
    } else {
      // 没有备份，遍历完成
      alternate = null;
    }

    index++;
  }
};

const executeTask = (fiber) => {
  // 构建当前 fiber 下级节点的 fiber
  if (fiber.tag === "class_component") {
    if (fiber.stateNode.__fiber && fiber.stateNode.__fiber.partialState) {
      // 更新组件状态
      fiber.stateNode.state = {
        ...fiber.stateNode.state,
        ...fiber.stateNode.__fiber.partialState,
      };
    }
    // 类节点的自己不在 props.children 中
    // 需要调用 render 方法，返回 DOM 结构
    // notice 类组件返回的 DOM 作为 children
    // 类组件 fiber 的 stateNode 是类实例不能添加节点
    // 相当于类组件自己是一个虚拟的节点，不在 DOM 中
    reconcileChildren(fiber, fiber.stateNode.render());
  } else if (fiber.tag === "function_component") {
    reconcileChildren(fiber, fiber.stateNode(fiber.props));
  } else {
    reconcileChildren(fiber, fiber.props.children);
  }
  // 如果有子节点，一直向下，一个前序遍历
  if (fiber.child) {
    return fiber.child;
  }

  // 向下走到最左边的节点，向下遍历完成
  // 需要向右遍历当前的兄弟节点
  // 兄弟节点遍历完需要回退到父级
  let currentExecuteFiber = fiber;
  // 有父级，说明最后一步回退没有完成，继续遍历
  while (currentExecuteFiber.parent) {
    // 前面操作已经完成向下，这里进行兄弟节点遍历

    // 先处理 effects
    // effects 需要在父级节点存储所有子节点 fiber
    // 在父级合并当前节点的 effects
    currentExecuteFiber.parent.effects =
      currentExecuteFiber.parent.effects.concat(
        // 将当前节点并入自己的子级形成的 effects
        currentExecuteFiber.effects.concat([currentExecuteFiber])
      );
    if (currentExecuteFiber.sibling) {
      return currentExecuteFiber.sibling;
    }
    /**
     * 兄弟节点遍历完成，向上会退到父级
     * notice 这里没有 return
     * 通过 while 循环向上
     * return 就会重新走向下遍历逻辑
     * 形成死循环
     */
    currentExecuteFiber = currentExecuteFiber.parent;
  }

  // 到这里查找完成
  // currentExecuteFiber 为根节点
  pendCommit = currentExecuteFiber;
};

const workLoop = (deadline) => {
  // 第一次进入，获取根元素
  if (!subTask) {
    subTask = getFirstTask();
  }
  // 判断是否有任务，浏览器是否空闲
  // 循环执行任务
  while (subTask && deadline.timeRemaining() > 1) {
    subTask = executeTask(subTask);
  }
  // 遍历完成提交 DOM 操作
  if (pendCommit) {
    commitAllWork(pendCommit);
  }
};

const performTask = (deadline) => {
  // 执行任务
  workLoop(deadline);
  /**
   * 如果任务因为高优先级事件触发
   * 当前任务被退出
   * 需要判断是否还有任务，如果有需要继续执行
   */
  if (subTask || !taskQueue.isEmpty()) {
    // 浏览器空闲时间开启循环
    requestIdleCallback(workLoop);
  }
};

export const render = (element, dom) => {
  /**
   * 1 向任务队列添加任务
   * 2 指定浏览器空闲时执行任务
   */

  /**
   * 任务  vdom -> fiber
   */
  taskQueue.push({
    dom,
    // children 只有一个元素
    props: { children: element },
  });

  // 浏览器空闲时间开启循环
  requestIdleCallback(workLoop);
};

export const scheduleUpdate = (instance, partialState) => {
  taskQueue.push({
    from: "class_component",
    instance,
    partialState,
  });
  requestIdleCallback(performTask);
};
```

首先理解结构，Fiber 中查找节点用到了几个属性，parent、child、sibling。节点的 parent 指向父级节点，同一层的父级节点相同。父级节点有 child 属性，指向第一个子节点。子节点又会有 sibling 属性，指向下一个子节点。根据这几个属性，就可以遍历 diff 了。

Diff 过程是一个深度优先的遍历，然后同层比较，再回溯到父级，将所有需要更新内容汇总到父级节点，统一更新。对于耗时久的操作，使用 `requestIdleCallback` 去分时执行，这样遇到新的操作，可以延迟更新，保证应用能响应，很巧妙。

整个流程，和 React 坚持的单向数据流思路统一，数据决定了最终页面表现。每次遍历所有节点，将操作汇总到根节点，看起来性能消耗就不小。React 的灵活（JSX），造就了整个对比过程很难做优化。

在 Vue 中就不存在对应的问题。原因就是 Template 语法，限制应用能操作的范围。这样就可以跳过很多不必要的对比，同时代理的模式，也使操作的粒度更细，这样就很难遇到耗时很久的任务。
