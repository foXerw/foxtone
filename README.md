# foxtone 🦊

**foXerw 系列 web 应用的设计令牌（Design Tokens）系统。**

设计令牌是界面视觉决策的"单一事实来源"：颜色、间距、字号、圆角、阴影、动效……全部以结构化数据定义，再编译成 CSS 变量与 TypeScript 常量，让多个应用共享同一套视觉语言，改一处、处处生效。

## 特性

- 🎨 **分层令牌**：primitive（原始刻度）→ semantic（语义别名），W3C DTCG 标准 JSON 源文件
- 🌗 **亮/暗模式**：每个主题一个预编译 CSS 文件，切换只需改一个 `data` 属性，零运行时成本
- 🏷️ **多品牌主题**：内置 `foxtone`（狐狸橙）与 `ocean`（海蓝），新增品牌 = 新增一个语义 JSON
- 🎛️ **用户自定义**：`applyOverrides` 运行时覆盖 + `paletteFromColor` 从单色派生整套色阶
- ⚛️ **TypeScript 优先**：主题名、令牌名全部类型化，拼错即报错
- 🖼️ **在线画廊**：[foxtone demo 站](https://foxerw.github.io/foxtone/)（令牌可视化 + 主题切换 + 自定义实验室）
- 🧩 **React 绑定**：[`foxtone-react`](packages/foxtone-react)（`<FoxThemeProvider>` + `useTheme`/`useTokens`/`useTokenValue`，含主题持久化）

## 安装

```bash
npm install foxtone
```

## 快速上手

```ts
// 1. 引入样式：核心刻度 + 需要的主题
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';
import 'foxtone/css/themes/foxtone-dark.css';

// 2. 切换主题：设置 <html data-fox-theme="foxtone-dark">
import { setTheme } from 'foxtone';
setTheme('foxtone', 'dark');

// 3. 在样式中消费令牌
// background: var(--fox-color-bg-surface);
// padding: var(--fox-space-4);

// 4. React 内联样式可用常量树
import { tokens } from 'foxtone';
<div style={{ background: tokens.color.bg.surface, padding: tokens.space['4'] }} />
```

### 用户自定义主题

```ts
import { applyOverrides, resetOverrides, paletteFromColor } from 'foxtone';

// 从一个品牌色派生 50~950 色阶（OKLCH，亮度严格单调）
const scale = paletteFromColor('#e11d48');

applyOverrides({
  'color-brand-bg': scale['500'],
  'color-brand-hover': scale['600'],
});
// ……随时恢复
resetOverrides();
```

## 令牌一览

| 类别 | CSS 变量示例 |
| --- | --- |
| 语义色彩（随主题变化） | `--fox-color-bg-canvas` `--fox-color-fg-default` `--fox-color-brand-bg` `--fox-color-state-danger-fg` |
| 间距（4px 刻度，0-12） | `--fox-space-4` = 16px |
| 字体 | `--fox-font-family-sans` `--fox-font-size-3` `--fox-font-weight-bold` |
| 圆角 | `--fox-radius-md` |
| 阴影 | `--fox-shadow-md` |
| 动效 | `--fox-motion-duration-base` `--fox-motion-easing-ease-out` |

全量数据见包内 `foxtone/tokens.json`。

## 本地开发

```bash
pnpm install        # 安装依赖
pnpm build          # 构建令牌 + 运行时 + demo 站
pnpm test           # 运行全部测试
pnpm dev            # 构建令牌后启动 playground 开发服务器
```

## 仓库结构

```
packages/foxtone    核心包（tokens/ 令牌源 · build/ 构建脚本 · src/ 运行时 API）
packages/foxtone-react  React 绑定包（Provider + hooks，peer 依赖 foxtone 与 react）
apps/playground     demo 站（Vite + React，自身样式完全消费令牌）
```

## License

MIT © foXerw
