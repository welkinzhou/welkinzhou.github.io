---
sidebar_position: 1
---

# 基础算法

这些是基础题，不需要特别难得思考，就放一起了。

### [最长连续序列](https://leetcode.cn/problems/longest-consecutive-sequence/)

Leetcode 做题笔记，就当作记录了。我的算法也不好，就不发到 Leetcode 评论，去误人子弟了。有问题也欢迎讨论，敬请斧正。

给定一个未排序的整数数组 `nums` ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

请你设计并实现时间复杂度为 `O(n)` 的算法解决此问题。

> 例如 nums = [100,4,200,1,3,2]
>
> 最长序列就是： 1 2 3 4 长度 4

想法是使用 hashMap，记录数组中每个数字对应的最长字符串长度。如果每个都遍历一边，就很啰嗦，需要尽量保存之前遍历过的结果。

很容易想到，当遍历到某个数字时候，使用前继数字长度加一，就无需遍历前面的数字了。如果数组都是升序，只需要遍历一边就可以了。存在降序情况，就需要更新之前的数据。这样才能保证，加一符合当前情况。

下面是我最开始想出来的算法：

```js
// 最长连续序列
function main(arr) {
  let max = 0; // 最大长度，默认空数组
  const lengthMap = new Map();
  for (let i = 0; i < arr.length; i++) {
    let num = arr[i];
    // 跳过重复项
    if (lengthMap.has(num)) continue;
    // 前继加一
    let prevCount = lengthMap.has(num - 1) ? lengthMap.get(num - 1) + 1 : 1;

    lengthMap.set(num, prevCount);

    while (lengthMap.has(++num)) {
      // 查找上一个count
      // 降序部分，如果已处理过，不能丢失之前的数据
      // 当前 count，可能在已计算过
      let nextCount = lengthMap.get(num);
      // 下一个数的 count 小于等于上一个
      // 证明遍历中间有断层，以小的数字为准
      prevCount = nextCount <= prevCount ? prevCount + 1 : nextCount;
      lengthMap.set(num, prevCount);
    }
    max = max > prevCount ? max : prevCount; // 更新长度
  }
  return max;
}
```

大部分用例都过了，挂在了一个数据量比较大的用例上，超时了。

重新审视算法，发现有些浪费的地方。这个算法把每个数字对应的连续序列都计算了出来，实际上并没有必要。根据题目要求，只需要找到最大的序列就行了。这样就变成了找到每个序列最小的数字，从小往大查找一遍，再比较每个序列的大小就行了。

当前的遍历情况，不能确定当前数字是不是序列的最小值，每一次出现序列中的更小值，都要遍历一遍更新，降序的时间复杂度 O(n2)。

最简单的优化方式就是排序，排完序就不需要考虑升降序问题了。但是我这里写了 map，就还想沿着这个思路走下去。

map 的优化思路也很明确，想办法确定当前值是否为序列最小值。如果有简单办法检索，当前数组中是否有比当前值小 1 的数（例如，当前为 2，需要知道是否有 1 存在），那样就能保证一次把连续序列遍历完。

下面是优化后的代码，和官方答案思路是一致的（本来也是参考了官方答案）：

```js
function main(arr) {
  let max = 0;
  // 使用 Object 也可以
  // 这里不需要存储 index 或者值
  // 设置 Object 对应项 value 为 1 就行
  // 遇到数字，Object 总要额外判断 0 很麻烦
  // 所以我习惯用 map
  const valueMap = new Map();
  for (const val of arr) {
    if (!valueMap.has(val)) {
      // 重复值跳过
      valueMap.set(val, 1);
    }
  }
  // 遍历 map，map 已经做过去重
  valueMap.forEach((_, val) => {
    if (!valueMap.has(val - 1)) {
      let len = 1;
      let num = val;
      // 最小值开始查找
      // 同一条序列只会遍历一次
      // 这样每个数字也只会遍历一次
      while (valueMap.has(num + 1)) {
        len++;
        num++;
      }
      max = Math.max(max, len);
    }
  });
  return max;
}
```

### [盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/)

给定一个长度为 `n` 的整数数组 `height` 。有 `n` 条垂线，第 `i` 条线的两个端点是 `(i, 0)` 和 `(i, height[i])` 。

找出其中的两条线，使得它们与 `x` 轴共同构成的容器可以容纳最多的水。

返回容器可以储存的最大水量。

**说明：**你不能倾斜容器。

这个说明，真是高估我了。可以倾斜容器，CPU 真的要烧掉。

题目限制数组长度最小为 2，思路还是比较简单。我是一遍过，很难得，感觉真不错。

计算容量，长乘高就可以。长度取两坐标间距离，高度为两坐标对应数值较小（就像木桶短板理论一样）。

直觉上看，影响因素很多，会有一种无从下手的感觉，首先要减少因素。自然想到双指针，指向头尾。这样一开始，长度就是最大值，向中间搜索时，长度递减，只需要考虑数组上数值的影响。

移动指针时，如果移动的是数值较大的，不仅长度减少 1，高度最高也只会和上次一样（高度受限于较小值），容量减少。假设移动的是较小值，如果查找到更大值，虽然长度减 1，高度却增加了，容积可能上升。

这样就明白了，需要移动数值较小的指针，向中间查找更大值。移动一次后，还是一样的分析步骤，只需要重复之前的动作即可，直到走完数组中所有值，两指针重合。

```js
function maxArea(height) {
  const len = height.length;
  let left = 0,
    right = len - 1;
  let max = 0;
  while (left < right) {
    // 计算最大值
    max = Math.max(max, calc(left, right));
    // 判断怎么移动指针
    if (height[left] <= height[right]) {
      left++;
      continue;
    }
    right--;
  }
  return max;

  function calc(i, j) {
    const length = Math.abs(j - i);
    const width = Math.min(height[i], height[j]);
    return length * width;
  }
}
```

### [三数之和](https://leetcode.cn/problems/3sum/)

给你一个整数数组 `nums` ，判断是否存在三元组 `[nums[i], nums[j], nums[k]]` 满足 `i != j`、`i != k` 且 `j != k` ，同时还满足 `nums[i] + nums[j] + nums[k] == 0` 。请

你返回所有和为 `0` 且不重复的三元组。

**注意：**答案中不可以包含重复的三元组。

这道题重点在去重，一开始我的去重想法很原始，就是暴力三循环，不出意料超时了：

```js
function main(arr) {
  if (!arr || arr.length < 3) return [];
  const valueMap = new Map();
  const result = [];
  // 遍历，将值对应 index 写入映射
  // index 是从小到大排列的
  arr.forEach((val, index) => {
    if (!valueMap.has(val)) {
      valueMap.set(val, [index]);
    } else {
      const temp = valueMap.get(val);
      temp.push(index);
      valueMap.set(val, temp);
    }
  });

  for (let i = 0; i < arr.length; i++) {
    const first = arr[i];
    if (first > 0) break;
    for (let j = i + 1; j < arr.length; j++) {
      const second = arr[j];
      // 查找对应 index
      const searchValue = 0 - first - second;
      if (!valueMap.has(searchValue)) continue;
      // 过滤保证单向递增
      const idxs = valueMap.get(searchValue);
      for (const val of idxs) {
        if (val > i && val > j) {
          // 去重
          let temp = [arr[i], arr[j], arr[val]];
          temp = temp.sort();
          const key = temp.join(",");
          const tempArr = result.map((item) => item.join(","));
          if (!tempArr.includes(key)) {
            result.push(temp);
            break;
          }
        }
      }
    }
  }

  return result;
}
```

写的过程中，一直在思考去重，发现题目只需要值不需要对应的 index，那就排序先咯。在上面的循环中，其实已经做了基本的去重了，就是 `j = i + 1`。很简单的操作，给了我启发。排序过后，从左往右，那么三个指针位置关系是确定的。同一组数据，排序后只有一种组合，这样不用像上面，需要对得到的结果排序再去重。

实际上还是会有一个问题，就是数据可能重复。例如，我们可能得到重复的结果，例如 `[1, -1, -1, 0]`，会有两组`[-1, 0, 1]`。由于 i 在 0，1 的位置，都会指向 -1 这个值。所以遍历中需要去重，同一个指针一次遍历中不能重复指向相同值。下面是优化后的代码：

```js
// 最长连续序列
function main(arr) {
  if (!arr || arr.length < 3) return [];
  arr.sort((a, b) => a - b);

  const valueMap = new Map();

  const result = [];

  // 遍历，将值对应 index 写入映射
  // index 是从小到大排列的
  arr.forEach((val, index) => {
    // 只取最大的
    valueMap.set(val, index);
  });

  for (let i = 0; i < arr.length; i++) {
    const first = arr[i];
    // 跳过重复
    if (i !== 0 && arr[i - 1] === first) continue;
    // 首个元素大于零后不可能成立
    if (first > 0) break;

    for (let j = i + 1; j < arr.length; j++) {
      const second = arr[j];
      // 跳过重复
      // notice 第一次是不需要判断重复的
      // 如果判断可能导致 i 和 j 值相同的情况被跳过
      if (j !== i + 1 && arr[j - 1] === second) continue;
      // 查找对应 index
      const searchValue = 0 - first - second;

      if (!valueMap.has(searchValue)) continue;
      // 过滤保证单向递增
      const idx = valueMap.get(searchValue);
      // 如果值在 j 左侧，不成立
      if (idx > j) result.push([arr[i], arr[j], searchValue]);
    }
  }
  return result;
}
```

通过了，但是时间很久，打败了 12%😮‍💨。

去查看了官方答案，最后两层循环使用了双指针。实现也比较巧妙，最终代码放下面了：

```js
var threeSum = function (nums) {
  if (!nums || nums.length < 3) return [];
  const length = nums.length;
  nums.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < length; i++) {
    const first = nums[i];
    // 跳过重复
    if (i !== 0 && nums[i - 1] === first) continue;
    if (first > 0) break;

    // third 放在第二层循环外
    // 如果只看最后两层循环
    // 相当于查找和为 0 - first 的一对值
    let third = length - 1;

    const target = 0 - first;
    for (let j = i + 1; j < length; j++) {
      const second = nums[j];
      if (j !== i + 1 && nums[j - 1] === second) continue;
      // 当 j 增加时，和不变，就需要 third 减少
      while (j < third && second + nums[third] > target) {
        third--;
      }
      // 遍历到重合，结束
      if (j === third) break;
      // 找到结果，压入返回值
      if (target === second + nums[third]) {
        result.push([first, second, nums[third]]);
      }
    }
  }
  return result;
};
```

### [找到字符串中所有字母异位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)

给定两个字符串 `s` 和 `p`，找到 `s` 中所有 `p` 的 **异位词** 的子串，返回这些子串的起始索引。不考虑答案输出的顺序。

**异位词** 指由相同字母重排列形成的字符串（包括相同的字符串）。

**示例 1:**

```
输入: s = "cbaebabacd", p = "abc"
输出: [0,6]
解释:
起始索引等于 0 的子串是 "cba", 它是 "abc" 的异位词。
起始索引等于 6 的子串是 "bac", 它是 "abc" 的异位词。
```

这个思路很容易想到，就是效率不高。肯定是需要两个指针，查找两个指针中间的字符是否匹配结果。查找过程中可能会出现重复，或者不是目标的字符，需要做特殊处理。

为了方便查找剩余元素，我使用了一个数组保存还未遍历到的字符，找到一个就移除一个。当数组为空的时候，就证明已经全部找到。此时需要将后面的指针前移一位，注意一定不能直接移到还未遍历的位置，这样会漏掉。

直接看代码，这个是我自己做出来的，效率很低：

```js
function main(s, p) {
  const result = [];
  // 如果 s 比 p 短，那么一定不行
  if (s.length < p.length) return result;
  // 字母的字符
  const chars = p.split("");
  // 存储尚未找到的的元素，找到后移出
  let temp = [...chars];

  let i = (j = 0);
  while (j < s.length) {
    // 当遍历的字符
    const charAtJ = s[j];
    j++;
    // 需要区分遍历到重复字符和不在目标内字符
    // 重复的话，剔除重复还是有可能匹配到的
    // 如果是不在目标内的，包含这个字符一定不成立
    // 可以直接跳到字符之后
    const hasIndex = chars.findIndex((cha) => cha === charAtJ);
    const tempIndex = temp.findIndex((cha) => cha === charAtJ);
    // 如果找到不同的，后面匹配都不会成功
    if (hasIndex < 0) {
      i = j;
      // 不保留信息，需要重新匹配
      temp = [...chars];
      continue;
    }
    // 找到重复的
    if (tempIndex < 0) {
      // 找到重复的位置，跳过
      const sliceIndex = s.indexOf(charAtJ, i);
      // 需要之前未重复的全部写入
      // notice 这里很容易忽略掉
      // 例如 abcbbdp 中 查找 abcd 异位词
      // 如遍历到第二个 b 时
      // i 仍旧指向 0
      // 直接跳过，会丢掉 i 位置的 a
      if (i !== sliceIndex)
        temp = temp.concat(s.slice(i, sliceIndex).split(""));
      i = sliceIndex + 1;
      continue;
    }
    // 移除已经找到的元素
    temp.splice(tempIndex, 1);
    // 全部匹配成功
    if (temp.length === 0) {
      // 将 i 位置字符重新移入目标数组
      temp.push(s[i]);
      result.push(i);
      // i 移动一位
      // 我以前常犯的错误是直接 i = j
      // 这样把可能情况跳过了
      // abac 中查找 ab
      // 直接跳过就会把第二种情况 ba 跳过
      i++;
    }
  }
  return result;
}
```

官方解法使用滑动窗口，固定窗口长度，对比窗口内容字符出现频率和目标是一致。

```js
var findAnagrams = function (s, p) {
  const sLen = s.length,
    pLen = p.length;

  if (sLen < pLen) {
    return [];
  }

  const ans = [];
  const sCount = new Array(26).fill(0);
  const pCount = new Array(26).fill(0);

  // 统计字符出现频率
  for (let i = 0; i < pLen; ++i) {
    // 第一窗口内的
    ++sCount[s[i].charCodeAt() - "a".charCodeAt()];
    // 目标字符统计
    ++pCount[p[i].charCodeAt() - "a".charCodeAt()];
  }
  // 频率相同
  if (sCount.toString() === pCount.toString()) {
    ans.push(0);
  }

  for (let i = 0; i < sLen - pLen; ++i) {
    // 移除原来窗口最左侧
    --sCount[s[i].charCodeAt() - "a".charCodeAt()];
    // 添加窗口右侧新字符
    ++sCount[s[i + pLen].charCodeAt() - "a".charCodeAt()];
    // 判断频率是否相同
    if (sCount.toString() === pCount.toString()) {
      ans.push(i + 1);
    }
  }

  return ans;
};
```

优化方式是通过，统计 count 中不一样的字符数，而不是使用数组。当不同的数字为 0 时，代表匹配成功，具体代码可以去看 LeetCode 官方解答。

简单来说，我的方法增加了伸缩窗口的操作，所以添加了很多额外的判断。官方的解答固定了窗口大小，并且使用了统计字符频率的方式计算是否为异位词，操作起来比我的数组方式方便很多。

[ 和为 K 的子数组](https://leetcode.cn/problems/subarray-sum-equals-k/)

给你一个整数数组 `nums` 和一个整数 `k` ，请你统计并返回 _该数组中和为 `k` 的子数组的个数_ 。

子数组是数组中元素的连续非空序列。

这类问题，我经常犯一种想当然的低级错误，就是忽略了负数。如果 nums 和 k 中数字都是正数，那这题简直不要太简单，因为和单调递增。

可能算法就是这样，利用你能获取的所有信息，优化计算过程。信息越多，自然能做的越多。

我最终想到的也就是暴力循环，但是累加这个过程一定是有可以优化的空间。假设当前位置为 i，对应值为 cur，累加结果是 acc，可以得到 `acc[i] = acc[i - 1] + cur，由于数组中有正有负，第二层遍历一定要到结尾，这样最多也就 O(n2)。

实在想不出来怎么优化，去看了官方答案。官方使用前缀和加 hash Map 的方式，把时间复杂度压缩到了 O(n)，确实很巧妙。暴力循环的思考方式，就是很简单的累加，从左到右，优化后的思路更像切片。不将重点放在叠加上，而是拿到预期结果去找目标值。

前缀和，简单说就是前 n 项的和，例如下面的数组，上面为对应位置的前缀和：

![数组](/img/示例.png)

假设要查找和为 4 的子数组。一般思路是，双循环。外层为 i 从 0 开始，象征子数组开始位置位置，下一层是 j 从 `i + 1` 开始，累加计算是否为预期值。

换个角度思考，i 到 j 的和除了累加一遍，还可以通过 j 处的前缀和减去 i 处的前缀和得到。这样把多次累加，就变成一个运算，还是几个点需要注意的，注释也写了。

```js
function subarraySum(nums, k) {
  let result = 0;
  const map = new Map();
  // 假设数组存在 k 值
  // k 自己就是一种情况
  // 这里设置 0 为 1
  map.set(0, 1);
  let acc = 0;
  // 从左到右遍历
  for (let i = 0; i < nums.length; i++) {
    // 假设 n - m 间数据和为 k
    // 则有 （m 位置的 acc） - （n 位置的 acc）
    // 结果为 k
    // 每次计算更新，记录 acc
    const cur = nums[i];
    acc = acc + cur;

    const pre = acc - k;
    if (map.has(pre)) {
      // 可能存在多个重复值
      // 例如 1 1 0
      // i = 2 和 i = 1 和都为2
      // 这两种情况都符合
      // 需要全部加上
      result = result + map.get(pre);
    }

    if (map.has(acc)) {
      // 有同样的结果，加一
      const preCount = map.get(acc);
      map.set(acc, preCount + 1);
    } else {
      map.set(acc, 1);
    }
  }
  return result;
}
```

### 最长连续序列

```js
function main(nums) {
  // 递增区间的 map，下标为增长结束位置，即区间最大值 index
  let acc = 0; // 累加值
  let max = nums[0]; // 最大值
  let min = nums[0];

  for (let i = 0; i < nums.length; i++) {
    // 累加计算
    acc += nums[i];

    max = Math.max(max, acc);
    // 累加小于 0，前面抛弃
    if (acc < 0) {
      acc = 0;
    }
  }
  return max;
}
```

### [合并区间](https://leetcode.cn/problems/merge-intervals/)

以数组 `intervals` 表示若干个区间的集合，其中单个区间为 `intervals[i] = [starti, endi]` 。请你合并所有重叠的区间，并返回 _一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间_ 。

先排序：

```js
function main(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let result = [];
  let prev = null;
  intervals.forEach((item) => {
    const [start, end] = item;
    let temp = [...item];
    if (prev) {
      const [prevStart, prevEnd] = prev;
      if (start <= prevEnd) {
        temp[0] = prevStart;
        temp[1] = Math.max(end, prevEnd);
        result.pop();
      }
    }
    result.push(temp);
    prev = temp;
  });
  return result;
}
```

### [除自身以外数组的乘积](https://leetcode.cn/problems/product-of-array-except-self/)

给你一个整数数组 `nums`，返回 _数组 `answer` ，其中 `answer[i]` 等于 `nums` 中除 `nums[i]` 之外其余各元素的乘积_ 。

题目数据 **保证** 数组 `nums`之中任意元素的全部前缀元素和后缀的乘积都在 **32 位** 整数范围内。

请 **不要使用除法，**且在 `O(*n*)` 时间复杂度内完成此题。

思路：

假设可以使用除法，肯定累乘得到最后结果，除去当前位置值就行了。

不能用除法，也就意味着，尽量复用累乘的值，这样我就想到创建一个数组保存累乘的值。

构造完这个数组，怎么得到值，我发现还是要除。并且除更多了，结果需要除以当前值，获取当前值，还需要当前位置累乘结果，除以前一位结果。这样只是前面部分，后面部分还需要用所有的结果除去当前位置累乘结果。

这么一折腾，也不算完全没有用，让我想明白了一点。除去当前位置的累乘值，从当前位置切两片，前面的累乘值，乘上后面的即为结果。但是这样要遍历几遍，很麻烦，所以我去看了答案，想知道是不是有更巧妙的办法，结果官方答案也是这个思路。

```js
function main(nums) {
  const len = nums.length;
  const result = new Array(len).fill(1);
  // 当前位置左侧的累乘值
  const lAccMap = new Array(len).fill(1);
  // 当前位置右侧的累乘值
  const rAccMap = new Array(len).fill(1);

  let prev = 1;

  for (let i = 0; i < len; i++) {
    lAccMap[i] = prev;
    prev *= nums[i];
  }
  prev = 1;
  for (let i = len - 1; i >= 0; i--) {
    rAccMap[i] = prev;
    prev *= nums[i];
  }

  for (let i = 0; i < nums.length; i++) {
    result[i] = lAccMap[i] * rAccMap[i];
  }

  return result;
}
```

### [搜索插入位置](https://leetcode.cn/problems/search-insert-position/)

给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。

请必须使用时间复杂度为 `O(log n)` 的算法。

典型二分法。二分查找思路很简单，排序后的数据，假设数组中间数据比目标大，那么结果一定在数组前半段。反之，如果中间数据比目标小，那么结果一定在后半段。同时还要兼顾，数组中全部数据都比目标大或小的情况。

典型且简单，很适合用来归纳思考方式。

```js
function main(nums, target) {
  // 左右指针
  let left = 0,
    right = nums.length - 1;
  // 结果，假设全部数据都小于，需要插入尾部
  let result = nums.length;
  while (left <= right) {
    // 二分，防止溢出
    const half = left + Math.floor((right - left) / 2);
    const halfVal = nums[half];
    // 相等获取 index
    if (halfVal === target) return half;
    // 大于证明，需要向左找
    // 假设全部元素都大于，最终遍历结束， left = right = 0
    if (halfVal > target) {
      right = half - 1;
      // 假设找不到，需要保留最后一个大于 target 的位置
      result = half;
    } else {
      // 小于证明，需要向右找
      // 假设全部都小于， left = right = nums.length
      // 一直小于没有关系，默认情况数组所有值都小于目标
      left = half + 1;
    }
  }
  return result;
}
```

查找中间点操作，也有快慢指针的方式查找。O(n) 操作，放在这里得不偿失。最简单想到的就是 `(left + right) / 2` 取整，这样计算有溢出风险。假设 right 值，超出数字上限一半以上，二分收束到最右边是，`left + right > Number.MIN_VALUE`。所以转换成，`left + Math.floor((right - left) / 2)`，这样即使 right 已经到达 Number.MIN_VALUE，这里所有的操作也都低于最大值。

比较后，中间位置和目标值大小关系确定。下次比较的区间，无需包含中间位置，如 `right = half - 1;`。包含会有问题，假设 `nums = [1, 2], target = 2 `，初始位置 `left = 0, right = 1, half = 0`，假设 `left = half;` 就会变成一个死循环。

另外一定记得考虑，全部大于目标或者小于的情况，代码中有注释。

### [全排列](https://leetcode.cn/problems/permutations/)

给定一个不含重复数字的数组 `nums` ，返回其 _所有可能的全排列_ 。你可以 **按任意顺序** 返回答案。

排列组合的基础，假设 n 个数字，多少种排列方式。每位考察，第一位 n 个数字选一个，有 n 种可能。下一位还有 (n -1) 个数字，下一位可能就是 (n - 1) 种可能。最终结果就是 n!(n 的阶乘)。

从这过程考虑代码，假设数组为 [1, 2, 3]，可能性如下图

![回溯过程](/img/全排序.png)

可以看到，到达到达倒数第二层时候，只剩一个元素，路径可以确定。回顾排列的过程，首先要每层遍历，选择当前位置元素。排除当前位置后，继续遍历选择下一个位置的元素。递归到剩余一个元素，路径确定，开始回归写入路径。

```js
function main(nums) {
  // 长度为 0 和 1 都只有一种情况
  // 最终的路径
  if (!nums.length || nums.length === 1) return [nums];
  let result = [];
  // 每个数字开头，都是一种情况
  for (let i = 0; i < nums.length; i++) {
    // 保存获取当前位置数字
    const head = nums[i];
    // 剩余数字
    const copy = nums.slice();
    copy.splice(i, 1);
    // 下一层的每个路径
    const tailResult = main(copy);
    // 每个路径加上头部
    const temp = tailResult.map((trace) => {
      return [head, ...trace];
    });
    // 写入当前选择下的所有路径
    result.push(...temp);
  }

  return result;
}
```

最直观的递归，需要 copy 一份剩余路径，所以内存占用高。可以优化，不复制路径，而是通过标记当前位置是否访问过的方式，减少内存占用。
