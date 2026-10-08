---
sidebar_position: 1
tags: [vue]
description: "Vue 3.5 组件实践与 Vue 3.2 源码阅读路线，连接编译、响应式、调度和 DOM 更新。"
---

# Vue 学习与源码阅读

这个系列从组件实践出发，再沿着应用创建、组件挂载、响应式更新和列表 diff 理解 Vue 的内部实现。基础语法以[官方指南](https://cn.vuejs.org/guide/introduction)为准，文章主要补充实际写组件时的取舍，以及源码中各模块如何配合。

## 版本与阅读约定

截至 2026-10-08，官方最新稳定版是 [Vue 3.5.43](https://github.com/vuejs/core/releases/tag/v3.5.43)。3.6 仍处于预发布阶段，本文的实践示例以 Vue 3.5 为基准。

源码文章保留原有 Vue 3.2 系列的阅读过程，并以 [v3.2.47](https://github.com/vuejs/core/tree/v3.2.47) 作为对照入口；涉及当前实现时，单独链接到 v3.5.43。源码片段中的 `-- snip --` 表示省略内容，适合辅助阅读，不能直接复制运行。内部函数、字段和构造参数不是公共 API，阅读时应切换到同一个 tag。

实践采用单文件组件（SFC）、`<script setup lang="ts">` 和组合式 API。`defineProps`、`defineEmits`、`withDefaults` 等是编译宏，无需从 Vue 导入；`ref`、`computed`、`watch` 等运行时 API 则需要导入。

## 建议的学习顺序

1. [项目结构](./com/01-项目结构.md)：搭建预览项目，区分源码消费、SFC 编译和组件库发布。
2. [布局组件](./com/02-layout-com.mdx)：实现 Row / Col，串起 props、插槽、计算属性、依赖注入和样式边界。
3. [查找入口文件](./源码分析/02-入口文件.md)：从 `createApp` 找到 DOM 渲染器和应用上下文。
4. [mount 流程](./源码分析/03-mount.md)：区分组件 VNode、组件实例与组件渲染的子树。
5. [响应式原理](./源码分析/04-响应式原理.md)：连接依赖收集、effect、computed、watch 与更新队列。
6. [diff 与最长递增子序列](./源码分析/01-diff.md)：理解列表节点如何复用、删除、创建和移动。

侧边栏保留原系列的文章位置；初次阅读源码时，建议先看入口与挂载，再看独立的 diff 算法。

## 建立几个基本判断

- 需要保存状态时，先考虑 `ref`；需要从状态推导结果时，使用 `computed`；需要发请求、管理订阅或操作外部资源时，使用 `watch` / `watchEffect` 并安排清理。
- 父子数据传递使用 props 与事件；双向绑定使用 `v-model`；跨层级共享资源使用 `provide` / `inject`。多页面共享业务状态可进一步阅读官方推荐的 [Pinia](https://pinia.vuejs.org/introduction.html)。
- 编译器将模板转换成渲染函数；响应式系统确定谁需要更新；调度器安排更新时机；渲染器通过 patch 更新 DOM。这些职责共同构成一次页面更新。
- 数据赋值后可以立即读取新值，需要读取更新后的 DOM 时再 `await nextTick()`；这也不等于等待浏览器完成绘制。

## 如何验证自己的理解

先让布局组件在预览项目中运行：改变列宽和间隔、让列换行、在 Row 外单独使用 Col，再观察结果。源码阅读则从一个小问题开始，例如“为什么连续改三次数据通常只更新一次页面”，顺着调用链找到 effect 和 scheduler。

完成这个系列后，应能解释组件的输入与输出、模板何时编译、组件何时创建实例，以及数据变化怎样最终触发 DOM 更新。需要继续扩展时，可阅读官方的[组合式函数](https://cn.vuejs.org/guide/reusability/composables)、[测试指南](https://cn.vuejs.org/guide/scaling-up/testing)和[性能指南](https://cn.vuejs.org/guide/best-practices/performance)。
