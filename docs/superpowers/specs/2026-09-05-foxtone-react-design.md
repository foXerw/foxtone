# foxtone-react 设计文档

- **日期**：2026-09-05
- **状态**：已与用户确认方向与 API 面积
- **前置包**：`foxtone`（v0.1.0，运行时 API 与类型/常量来源）

## 1. 背景与目标

`foxtone` 核心包提供纯 DOM 的运行时 API（`setTheme`/`getTheme`、`applyOverrides`/`resetOverrides`、`paletteFromColor`）与生成的类型/常量（`BrandName`/`Mode`/`ThemeName`/`SemanticTokenName`/`TokenOverrides`/`tokens`）。在 React 应用里使用它，开发者需要自己手写：

- 品牌/模式/跟随系统的 `useState` 状态与 `useEffect` 同步到 `data-fox-theme`
- 手写 `matchMedia('(prefers-color-scheme: dark)')` 订阅
- 主题选择持久化到 `localStorage`
- `getComputedStyle` 读取当前令牌值

`foxtone-react` 把这些样板封装成 React 惯用的 Provider + hooks，让 React 应用开箱即用。

## 2. 非目标（v1 明确不做）

- **组件级封装**（`<Button>`/`<Card>` 等）：只做主题与令牌的 hook 层，组件封装留给未来的 `foxtone-ui` 或应用自身
- **服务端渲染特殊处理**：仅保证 `typeof window/document` 守卫下不崩溃，不提供 hydration 缓存策略
- **多主题运行时的 React 端扩展**（如运行时注册新品牌）：品牌列表仍由 `foxtone` 构建产物静态决定
- **`applyOverrides` 的 React 声明式封装**（`useOverrides`）：v1 不做，自定义主题实验室继续直接调核心 API

## 3. 包结构与技术栈

```
packages/foxtone-react/
├─ package.json                 # name: foxtone-react；peer: react@^19, foxtone@^0.1.0
├─ tsconfig.json                # strict + JSX(react-jsx) + NodeNext，用于类型检查与测试
├─ tsconfig.build.json          # 仅编译 src → dist/js（.js + .d.ts）
├─ vitest.config.ts             # jsdom 环境，include test/**/*.test.tsx
├─ src/
│  ├─ index.ts                  # 导出 Provider + 三个 hook + 重导出 foxtone 类型/常量
│  ├─ provider.tsx              # FoxThemeContext + FoxThemeProvider
│  ├─ useTheme.ts
│  ├─ useTokens.ts
│  └─ useTokenValue.ts
└─ test/
   ├─ provider.test.tsx
   ├─ useTokens.test.tsx
   └─ useTokenValue.test.tsx
```

| 位置 | 选择 | 理由 |
|---|---|---|
| 构建 | `tsc -p tsconfig.build.json`（镜像 `foxtone`） | 纯 ESM、无自身 CSS 的库，无需 bundler |
| 测试 | Vitest + jsdom + @testing-library/react | 与 `foxtone` 同生态，能驱动真实 React 渲染 |
| 依赖关系 | `foxtone` 作 `peerDependency` | 保证类型与运行时实例单一；应用已装 `foxtone`（引 CSS） |
| React 版本 | `peerDependency react@^19` | 与 playground 一致 |

## 4. API 设计

### 4.1 `FoxThemeProvider`

```tsx
interface FoxThemeProviderProps {
  /** 传入则持久化 {brand, mode, followSystem} 到 localStorage；不传则不持久化 */
  storageKey?: string;
  defaultBrand?: BrandName;      // 默认 'foxtone'
  defaultMode?: Mode;            // 默认 'light'
  defaultFollowSystem?: boolean; // 默认 false
  children: ReactNode;
}
```

职责：

- 管理 `brand`、`mode`、`followSystem`、`systemDark` 四个状态
- 派生只读值：`resolvedMode = followSystem ? (systemDark ? 'dark' : 'light') : mode`，`themeName = `${brand}-${resolvedMode}``
- `[brand, resolvedMode]` 变化时调用核心 `setTheme(brand, resolvedMode)`
- `followSystem` 开启时订阅 `matchMedia('(prefers-color-scheme: dark)')`，关闭时清理
- 传入 `storageKey` 时：状态惰性初始化从 `localStorage` 恢复，变化时回写；读写全程 `typeof window` 守卫

### 4.2 `useTheme`

```ts
interface ThemeController {
  brand: BrandName;
  mode: Mode;
  followSystem: boolean;
  systemDark: boolean;
  themeName: ThemeName;          // 派生，只读
  setBrand: (brand: BrandName) => void;
  setMode: (mode: Mode) => void;
  setFollowSystem: (follow: boolean) => void;
  toggleMode: () => void;        // light ↔ dark
}
```

- 必须在 `FoxThemeProvider` 内使用，否则抛出带提示的错误
- `toggleMode` 在 `followSystem` 开启时无效果（跟随系统优先）

### 4.3 `useTokens`

```ts
useTokens(): typeof tokens;   // 返回 foxtone 的 var(--fox-*) 常量树
```

- 无状态，直接返回 `foxtone` 的 `tokens` 常量（常量树是静态的，无需 context）

### 4.4 `useTokenValue`

```ts
useTokenValue(name: string): string;
```

- 读取 `getComputedStyle(document.documentElement).getPropertyValue('--fox-' + name)`
- 依赖 `themeName`（通过 context），主题变化后下一帧重新取样
- 参数即 `--fox-` 后的变量名（如 `'color-brand-bg'`）；返回值可含前导空格，由消费方自行 `trim`

### 4.5 `index.ts` 导出面

```ts
export { FoxThemeProvider } from './provider.js';
export { useTheme } from './useTheme.js';
export { useTokens } from './useTokens.js';
export { useTokenValue } from './useTokenValue.js';
export type {
  BrandName, Mode, ThemeName, SemanticTokenName, TokenOverrides,
} from 'foxtone';
export { tokens } from 'foxtone';
```

- 运行时 API（`setTheme` 等）不重导出，仍是 `foxtone` 的职责
- 类型与 `tokens` 常量重导出，方便单包导入

## 5. 状态模型与数据流

单一 `FoxThemeContext` 承载全部主题状态。切主题本应全局重渲染（主题影响整棵视觉树），拆分 context 省的那点 re-render 是过早优化，故不拆。

数据流：

```
FoxThemeProvider
  ├─ useState(brand/mode/followSystem/systemDark)  ← 初始化时若 storageKey 则从 localStorage 恢复
  ├─ useMemo(resolvedMode, themeName)
  ├─ useEffect([brand, resolvedMode]) → setTheme(brand, resolvedMode)
  ├─ useEffect(followSystem) → 订阅 matchMedia（开启） / 清理（关闭）
  └─ useEffect([brand, mode, followSystem]) → storageKey 时回写 localStorage
        │
        └─ context value: ThemeController
             ├─ useTheme()      → 读 state 与 setter
             └─ useTokenValue() → 读 themeName，变化后重取 getComputedStyle
```

## 6. 错误处理与 SSR

- `useTheme`/`useTokenValue` 在 Provider 外使用时抛出带中文提示的错误（`foxtone-react: useTheme 必须在 <FoxThemeProvider> 内使用`）
- Provider 与 hooks 中所有 `document`/`window`/`matchMedia` 访问均在 effect 或惰性初始化内，且以 `typeof window` 守卫，SSR 渲染不崩溃（首帧不应用主题、不读存储，客户端 hydrate 后由 effect 补齐）

## 7. 测试策略（Vitest + @testing-library/react）

1. **provider**：
   - 挂载即设 `data-fox-theme` 为默认主题
   - `setBrand`/`setMode`/`toggleMode` 更新属性值
   - `followSystem` 开启后 `matchMedia` 结果驱动 mode；关闭后恢复手动 mode
   - 传 `storageKey`：写回 `localStorage`，卸载重挂恢复
   - 不传 `storageKey`：`localStorage` 零写入
   - Provider 外使用 `useTheme` 抛错
2. **useTokens**：返回值与 `foxtone` 的 `tokens` 深等（引用相等即可）
3. **useTokenValue**：主题变化触发重新读取（jsdom 对自定义属性 `getComputedStyle` 受限，聚焦"重取时机"而非具体色值）

## 8. Dogfooding（重构 playground）

- `apps/playground/src/main.tsx`：用 `<FoxThemeProvider storageKey="foxtone-playground">` 包裹 `<App/>`
- `apps/playground/src/App.tsx`：删除本地 `brand`/`mode`/`followSystem`/`systemDark` state 与手写 matchMedia effect，改用 `useTheme()`
- `apps/playground/src/components/Toolbar.tsx`：改用 `useTheme()` 获取状态与 setter
- `apps/playground/src/components/ColorGallery.tsx`：色卡取值列改用 `useTokenValue`
- `apps/playground/src/components/ThemeLab.tsx`：保持直接调 `foxtone` 的 `paletteFromColor`/`applyOverrides`（核心运行时职责，非 React 状态）
- `apps/playground/src/components/ScalesGallery.tsx`/`QuickStart.tsx`：不变

## 9. 构建、CI 与文档

- `foxtone-react` 的 `build`/`test` 脚本随 `pnpm -r build`/`pnpm -r test` 自动纳入，CI 无需改动
- 根 `README.md` 仓库结构补 `packages/foxtone-react` 一行
- 提交规范沿用 Conventional Commits

## 10. 未来路线（不在 v1）

- `useOverrides`：`applyOverrides`/`resetOverrides` 的 React 声明式封装（自动清理）
- `usePalette`：`paletteFromColor` 的 `useMemo` 封装
- 组件级封装包 `foxtone-ui`
- 拆分 context 以优化局部 re-render（有性能诉求时）
