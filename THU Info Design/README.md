# THU Info 设计系统介绍

[toc]

## 前言

THU Info App 有数十种业务功能，其中涉及到大量设计。为使应用中各个页面视觉效果统一，方便设计协作，我们 @JohnnyBGoodeLithium @麦月三 在 **原子化设计** 的理论下建立此设计系统。

## 原子化设计

[Atomic Design原子设计理念：构建科学规范的设计系统](http://www.woshipm.com/pd/728887.html)

> 原子设计是一种方法论，由原子、分子、组织、模板和页面共同协作以创造出更有效的用户界面系统的一种设计方法。
> 原子设计的五个阶段分别是：
>
> 1. Atoms 原子：为网页构成的基本元素。例如标签、输入，或是一个按钮。也可以为抽象的概念，例如字体、色调等。
> 2. Molecules 分子：由原子构成的简单 UI 组件。例如一个表单标签、搜索框和按钮共同打造了一个搜索表单分子。
> 3. Organisms 组织：由原子及分子组成的相对复杂的 UI 构成物，如导航栏、状态栏等组件。
> 4. Templates 模版：将以上元素进行排版，显示设计的底层内容结构。
> 5. Pages 页面：将实际内容（图片、文章等）套件在特定模板，页面是模板的具体实例。
>
> 优点：
>  
> - 一致性
>   由于分解网站成单一元素，不论在哪一个页面，UI元素的互动性是相同的，例如颜色变化、字体的排序、以及回馈。不但让使用者经验相同，在视觉上更为和谐。
> - 效率
>  由于建立了Pattern Library 元件库，一旦要更改某一个元素，可以马上施行、应用。
>- 跨部门的共通语言
不仅方便设计师思考页面的和谐性，也可以让工程师、品质检验清楚页面的逻辑架构及变化，减少不必要的来回沟通。

## 设计系统

### 内容

设计系统的建立依照原子设计的原理，从原子层级向页面层级由下至上逐级建立。

- 原子属性
  - 图层属性
    - 颜色
    - 描边
    - 圆角
    - 阴影
    - ……
  - 文字排版
    - 图层属性（见上方）
    - 字体 font-family
    - 大小 font-size
    - 字重 font-weight
    - 其他字体属性
      - 下划线 / 删除线
      - 角标
      - 数字等宽
      - ……
- 分子层级
  - 由原子属性定义的基础组件
- 组织层级
  - 由分子组件组成的复合组件

### 工具

[How to use design tokens - Material Design 3](https://m3.material.io/foundations/design-tokens/how-to-use-tokens)
[Guide to working with the Adobe XD extension for Visual Studio Code - Adobe XD](https://www.adobe.com/products/xd/learn/design-systems/cloud-libraries/vscode-extension.html)
当前采用 Figma - Material Theme Builder 插件配合 VScode - Adobe XD 插件建立设计系统文件。

### 设计

#### 颜色

颜色取自 [清华大学 110 周年校庆 VI](https://2021.tsinghua.edu.cn/info/1014/2154.htm)。
……
