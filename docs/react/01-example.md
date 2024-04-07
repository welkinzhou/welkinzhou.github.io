---
sidebar_position: 1
tags: [react]
---

# React 官网教程

最近在看 React 官网，之前一直在用 Vue。看了看，进行了一些简单对比，算是总结一下。由于还没有正式开始 React 的项目，写的也比较浅显。

根据官网完成的井字棋（Tic-Tac-Toe）游戏：

```jsx
import { useState } from "react";
// React 使用 jsx，js 的一种拓展，还是要遵守 js 的语法
// 这也是 class 要写作 className 的原因
// class 是 js 中的关键值
// React 官网有说 camelCase all of the things
function Square({ value, onSquareClick }) {
  return (
    // 事件命名 React 推荐使用 on + 大写首字母形式
    // onClick 是 React 内建的方法
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  // notice 这里直接计算 winner 没有使用 state
  // React 官网提醒，依赖于其他 state 不必使用新的 state
  // 后面会解释原理
  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = "Winner: " + winner;
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }

  // React 推荐使用 handle 开头
  // 命名事件处理方法
  function handleClick(i) {
    // 点击重复，或者游戏结束
    if (squares[i] || calculateWinner(squares)) {
      return;
    }
    // React 推荐使用 immutable 的方式
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? "X" : "O";
    onPlay(nextSquares);
  }
  // 用数组形式返回多个兄弟 jsx 标签
  const boardRows = [];

  for (let i = 0; i < 3; i++) {
    const grids = [];
    const row = (
      <div className="board-row" key={i}>
        {grids}
      </div>
    );
    boardRows.push(row);
    for (let j = 0; j < 3; j++) {
      const square = (
        <Square
          key={i * 3 + j}
          value={squares[i * 3 + j]}
          onSquareClick={() => handleClick(i * 3 + j)}
        />
      );
      grids.push(square);
    }
  }

  // <></> 是 Fragment 的简写方式
  // 同样由于 jsx 需要遵守 js 语法
  // 每个函数只能返回一个值
  // 这里用 Fragment 将标签 wrap 起来
  // 返回一个对象
  return (
    <>
      <div className="status">{status}</div>
      {boardRows}
      {/* <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div> */}
    </>
  );
}

export default function Game() {
  // const [xIsNext, setXIsNext] = useState(true);
  // 这里使用 state，什么情况下使用 state 后续会说明
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = "Go to move #" + move;
    } else {
      description = "Go to game start";
    }
    return (
      // 这里 onClick 绑定了一个函数
      // 对于熟悉 Vue 的人来说没有什么感觉
      // 对比原生方法，和 Angular
      // 这两种方式都是绑定的函数调用
      // 比如 (click)="jumpTo(move)"
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });
  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

// 计算胜者
function calculateWinner(squares) {
  // 所以成功的状态枚举
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
```

上述代码中几点需要注意一下：

jsx 中的标签语法，通过`{ }`混合了 js 代码，强调一下所有`{ }`中间的部分需要看作 js。这也是为什么绑定事件，需要给函数或者函数名，不能直接写入函数调用。如果写入调用形式，render 时候就会直接调用方法。

还有就是 state 的问题了，还是给一个简单的例子。

```jsx
import { useState } from "react";
function example() {
  const [index, setIndex] = useState(0);

  function handleIndexChange() {
    setIndex(index + 1);
    console.log(index); // 第一次触发时这里 index 是什么值？
    setIndex(index + 1);
  }
  // some code
}
```

上面的示例代码，index 实际上还是 0。index 是 useState 返回的 copy，调用 setIndex 并不会直接修改 index，所以这 index 保持不变。可能有人看到使用 const 解构赋值时就想到了 index 不可变，如果使用 let 解构，然后 index = index + 1 是不是就可以改变 index 咯。使用 setState 意义何在，这就涉及到 state 有什么用。

Vue 的设计和 React 有一些区别，Vue 使用劫持的方式，自动更新 DOM。React 需要手动调用 setter，也就是这里的 setState，更新视图。React 的灵活也就客观上造就了对 immutable 和 view 的可控性要求，随便写就会导致问题难以追溯。

state 的作用概括就是说，存储一些交互数据，例如表单数据，元素的激活状态。主要使用 Vue 的人可能还是有点疑惑，比如说上面的 `Game` 组件中的 winner 使用的就是普通变量，但是 winner 也需要在页面上动态展示（winner 有点像 Vue 中的计算属性，细想和 state 代表的值有一点区别），区别也不是那么明晰。

官网上还有一个[简单的例子](https://react.dev/learn/state-a-components-memory)，解释 state 工作原理。

```jsx
let componentHooks = [];
let currentHookIndex = 0;

// How useState works inside React (simplified).
function useState(initialState) {
  let pair = componentHooks[currentHookIndex];
  if (pair) {
    // This is not the first render,
    // so the state pair already exists.
    // Return it and prepare for next Hook call.
    currentHookIndex++;
    return pair;
  }

  // This is the first time we're rendering,
  // so create a state pair and store it.
  pair = [initialState, setState];

  function setState(nextState) {
    // When the user requests a state change,
    // put the new value into the pair.
    pair[0] = nextState;
    updateDOM();
  }

  // Store the pair for future renders
  // and prepare for the next Hook call.
  componentHooks[currentHookIndex] = pair;
  currentHookIndex++;
  return pair;
}

function Gallery() {
  // Each useState() call will get the next pair.
  const [index, setIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);

  function handleNextClick() {
    setIndex(index + 1);
  }

  function handleMoreClick() {
    setShowMore(!showMore);
  }

  let sculpture = sculptureList[index];
  // This example doesn't use React, so
  // return an output object instead of JSX.
  return {
    onNextClick: handleNextClick,
    onMoreClick: handleMoreClick,
    header: `${sculpture.name} by ${sculpture.artist}`,
    counter: `${index + 1} of ${sculptureList.length}`,
    more: `${showMore ? "Hide" : "Show"} details`,
    description: showMore ? sculpture.description : null,
    imageSrc: sculpture.url,
    imageAlt: sculpture.alt,
  };
}

function updateDOM() {
  // Reset the current Hook index
  // before rendering the component.
  currentHookIndex = 0;
  // 这里重新初始化组件
  let output = Gallery();

  // Update the DOM to match the output.
  // This is the part React does for you.
  nextButton.onclick = output.onNextClick;
  header.textContent = output.header;
  moreButton.onclick = output.onMoreClick;
  moreButton.textContent = output.more;
  image.src = output.imageSrc;
  image.alt = output.imageAlt;
  if (output.description !== null) {
    description.textContent = output.description;
    description.style.display = "";
  } else {
    description.style.display = "none";
  }
}

let nextButton = document.getElementById("nextButton");
let header = document.getElementById("header");
let moreButton = document.getElementById("moreButton");
let description = document.getElementById("description");
let image = document.getElementById("image");
let sculptureList = [
  {
    name: "Homenaje a la Neurocirugía",
    artist: "Marta Colvin Andrade",
    description:
      "Although Colvin is predominantly known for abstract themes that allude to pre-Hispanic symbols, this gigantic sculpture, an homage to neurosurgery, is one of her most recognizable public art pieces.",
    url: "https://i.imgur.com/Mx7dA2Y.jpg",
    alt: "A bronze statue of two crossed hands delicately holding a human brain in their fingertips.",
  },
  {
    name: "Floralis Genérica",
    artist: "Eduardo Catalano",
    description:
      "This enormous (75 ft. or 23m) silver flower is located in Buenos Aires. It is designed to move, closing its petals in the evening or when strong winds blow and opening them in the morning.",
    url: "https://i.imgur.com/ZF6s192m.jpg",
    alt: "A gigantic metallic flower sculpture with reflective mirror-like petals and strong stamens.",
  },
  {
    name: "Eternal Presence",
    artist: "John Woodrow Wilson",
    description:
      'Wilson was known for his preoccupation with equality, social justice, as well as the essential and spiritual qualities of humankind. This massive (7ft. or 2,13m) bronze represents what he described as "a symbolic Black presence infused with a sense of universal humanity."',
    url: "https://i.imgur.com/aTtVpES.jpg",
    alt: "The sculpture depicting a human head seems ever-present and solemn. It radiates calm and serenity.",
  },
  {
    name: "Moai",
    artist: "Unknown Artist",
    description:
      "Located on the Easter Island, there are 1,000 moai, or extant monumental statues, created by the early Rapa Nui people, which some believe represented deified ancestors.",
    url: "https://i.imgur.com/RCwLEoQm.jpg",
    alt: "Three monumental stone busts with the heads that are disproportionately large with somber faces.",
  },
  {
    name: "Blue Nana",
    artist: "Niki de Saint Phalle",
    description:
      "The Nanas are triumphant creatures, symbols of femininity and maternity. Initially, Saint Phalle used fabric and found objects for the Nanas, and later on introduced polyester to achieve a more vibrant effect.",
    url: "https://i.imgur.com/Sd1AgUOm.jpg",
    alt: "A large mosaic sculpture of a whimsical dancing female figure in a colorful costume emanating joy.",
  },
  {
    name: "Ultimate Form",
    artist: "Barbara Hepworth",
    description:
      "This abstract bronze sculpture is a part of The Family of Man series located at Yorkshire Sculpture Park. Hepworth chose not to create literal representations of the world but developed abstract forms inspired by people and landscapes.",
    url: "https://i.imgur.com/2heNQDcm.jpg",
    alt: "A tall sculpture made of three elements stacked on each other reminding of a human figure.",
  },
  {
    name: "Cavaliere",
    artist: "Lamidi Olonade Fakeye",
    description:
      "Descended from four generations of woodcarvers, Fakeye's work blended traditional and contemporary Yoruba themes.",
    url: "https://i.imgur.com/wIdGuZwm.png",
    alt: "An intricate wood sculpture of a warrior with a focused face on a horse adorned with patterns.",
  },
  {
    name: "Big Bellies",
    artist: "Alina Szapocznikow",
    description:
      "Szapocznikow is known for her sculptures of the fragmented body as a metaphor for the fragility and impermanence of youth and beauty. This sculpture depicts two very realistic large bellies stacked on top of each other, each around five feet (1,5m) tall.",
    url: "https://i.imgur.com/AlHTAdDm.jpg",
    alt: "The sculpture reminds a cascade of folds, quite different from bellies in classical sculptures.",
  },
  {
    name: "Terracotta Army",
    artist: "Unknown Artist",
    description:
      "The Terracotta Army is a collection of terracotta sculptures depicting the armies of Qin Shi Huang, the first Emperor of China. The army consisted of more than 8,000 soldiers, 130 chariots with 520 horses, and 150 cavalry horses.",
    url: "https://i.imgur.com/HMFmH6m.jpg",
    alt: "12 terracotta sculptures of solemn warriors, each with a unique facial expression and armor.",
  },
  {
    name: "Lunar Landscape",
    artist: "Louise Nevelson",
    description:
      "Nevelson was known for scavenging objects from New York City debris, which she would later assemble into monumental constructions. In this one, she used disparate parts like a bedpost, juggling pin, and seat fragment, nailing and gluing them into boxes that reflect the influence of Cubism’s geometric abstraction of space and form.",
    url: "https://i.imgur.com/rN7hY6om.jpg",
    alt: "A black matte sculpture where the individual elements are initially indistinguishable.",
  },
  {
    name: "Aureole",
    artist: "Ranjani Shettar",
    description:
      'Shettar merges the traditional and the modern, the natural and the industrial. Her art focuses on the relationship between man and nature. Her work was described as compelling both abstractly and figuratively, gravity defying, and a "fine synthesis of unlikely materials."',
    url: "https://i.imgur.com/okTpbHhm.jpg",
    alt: "A pale wire-like sculpture mounted on concrete wall and descending on the floor. It appears light.",
  },
  {
    name: "Hippos",
    artist: "Taipei Zoo",
    description:
      "The Taipei Zoo commissioned a Hippo Square featuring submerged hippos at play.",
    url: "https://i.imgur.com/6o5Vuyu.jpg",
    alt: "A group of bronze hippo sculptures emerging from the sett sidewalk as if they were swimming.",
  },
];

// Make UI match the initial state.
updateDOM();
```

主要还是看 useState 这个方法，我觉得官方已经写的很清楚了，我这里有点画蛇添足 😮‍💨：

全局维护两个变量，`componentHooks` 是调用 hook 生成的结果数据，currentHookIndex 是下一次调用 hook 结果存储的指针。

```js
function useState(initialState) {
  let pair = componentHooks[currentHookIndex];
  // 这里的拦截涉及到 updateDOM 的逻辑
  // 每次 updateDOM 都会重新初始化组件
  // 重新渲染时候，需要获取上次更新的数据
  if (pair) {
    currentHookIndex++;
    return pair;
  }
  // 生成返回值
  pair = [initialState, setState];

  function setState(nextState) {
    // 更新数据，同步 DOM
    pair[0] = nextState;
    // 每次 update 都会调用组件方法
    // 所以除了 state 这些存在全局的数据
    // 都会丢失，被初始化
    updateDOM();
  }
  // 多次调用 useState 需要将结果保存到全局队列
  componentHooks[currentHookIndex] = pair;
  // 每次调用，移动指针位置
  currentHookIndex++;
  return pair;
}
```

了解了过程，再去看 React 要求的 purity。Pure component 好处是显而易见的，组件的稳定性的得到了保证。这种思想还会指导你，将视图与业务逻辑进行更好的拆分。state 就像 IO，连接副作用和 pure code。上述的 winner 为什么不是 state，也就清楚了。根据 squares 的状态，可以计算出 winner（calculateWinner），这一部分是 pure code。对应同样 squares，winner 一定是相同的，就不需要创建 state。

重新初始化时候，获取最新的 state，接着走组件代码中的逻辑。update 中最重要的，重置了 currentHookIndex 指向。这样就可以保证获取的 state 和代码中获取次序是一致。React 要求在组件代码的 top level 声明 state，如果每次获取 state 的顺序具有随机性，就会导致数据匹配不上，出现 Bug。

目前看完并且记住的就这些，后面在补充吧。整个设计和 Vue 差别很大，但是也很有趣。
