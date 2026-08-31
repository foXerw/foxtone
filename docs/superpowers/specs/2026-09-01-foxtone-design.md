# foxtone 设计令牌系统 —— 设计文档

- **日期**：2026-09-01
- **状态**：已与用户逐节确认
- **仓库名**：foxtone（本地目录待从 `designtoken` 重命名为 `foxtone`，因会话占用目录暂时无法自动完成，由用户手动重命名，不影响任何功能）

## 1. 背景与目标

用户（foXerw）拥有一系列 React web 应用，需要一个统一的设计令牌（Design Tokens）系统作为视觉基础设施：

- 单一事实来源：颜色、字体、间距、圆角、阴影、动效等视觉决策集中定义
- 多主题能力：亮/暗模式、多品牌主题（不同应用不同皮肤）、用户运行时自定义主题
- 标准分发：以 npm 包 `foxtone` 发布（包名已确认可用），应用 `npm install` 即用
- 可展示：配套 demo 站（令牌画廊 + 主题切换 + 自定义主题实验室），部署到 GitHub Pages

## 2. 非目标（v1 明确不做）

- **组件令牌层**（如 `button-background-primary`）：v1 只有 primitive 与 semantic 两层，组件级消费直接用语义令牌
- **React 封装包**（`<FoxThemeProvider>` 等）：运行时 API 保持纯 DOM，React 封装留给未来的 `foxtone-react` 包
- **多平台输出**（iOS/Android/小程序）：v1 仅面向 web（CSS 变量 + TS 常量）
- **断点/布局令牌**：媒体查询不经令牌系统，留待未来
- **changesets 自动发版**：v1 手动 `npm version + publish`
- **e2e 测试**：playground 只做构建冒烟

## 3. 仓库结构与技术栈

```
foxtone/
├─ .github/workflows/
│  └─ ci.yml                      # PR 检查 + main 分支部署 demo 到 GitHub Pages
├─ packages/
│  └─ foxtone/                    # ★ 核心包，发布为 npm 包 "foxtone"
│     ├─ tokens/                  # 令牌源文件（W3C DTCG JSON）
│     │  ├─ primitive/            #   原始层：调色板、刻度（主题无关）
│     │  │  ├─ color.json
│     │  │  ├─ spacing.json
│     │  │  ├─ font.json
│     │  │  ├─ radius.json
│     │  │  ├─ shadow.json
│     │  │  └─ motion.json
│     │  └─ themes/               #   语义层：每个「品牌 × 模式」一份
│     │     ├─ foxtone.light.json
│     │     ├─ foxtone.dark.json
│     │     ├─ ocean.light.json
│     │     └─ ocean.dark.json
│     ├─ build/                   # Style Dictionary v4 构建脚本
│     ├─ src/                     # 运行时 API（TypeScript）
│     ├─ dist/                    # 构建产物（gitignore，随 npm 发布）
│     └─ package.json             # name: foxtone
├─ apps/
│  └─ playground/                 # demo 站：Vite + React + TS（不发布）
├─ pnpm-workspace.yaml
├─ package.json                   # 根脚本：build / test / dev
├─ README.md                      # 中文：概念讲解 + 架构图 + 快速上手
└─ LICENSE                        # MIT
```

| 位置 | 选择 | 理由 |
|---|---|---|
| 包管理 | pnpm workspaces | monorepo 标配，快、省磁盘 |
| 令牌构建 | Style Dictionary v4 | 原生支持 W3C DTCG 格式，别名解析/多平台输出/插件生态成熟 |
| 运行时色彩计算 | `culori`（OKLCH） | 自定义主题需从单色派生整套色阶；OKLCH 感知均匀，culori 轻量可靠 |
| demo 站 | Vite + React 19 + TypeScript | 与 React 消费方一致，静态产物便于 Pages 部署 |
| 测试 | Vitest | 与 Vite 同生态 |
| 语言/模块 | TypeScript strict，ESM-only | 消费方为 React+Vite 项目，纯 ESM 最简单 |
| 版本发布 | v1 手动 `npm version + publish` | 个人项目，协作需求出现后再引入 changesets |

## 4. 令牌架构（三层模型）

### 4.1 第 1 层 · Primitive（原始令牌，主题无关）

| 类别 | 内容 |
|---|---|
| `color` | fox 品牌橙色阶（50~950）、中性灰阶（0~950）、功能色阶（success/warning/danger/info，各 50~950） |
| `spacing` | 4px 基准刻度：`space-1`=4px … `space-12`=48px，另含 `space-0`=0 |
| `font` | 字体族（sans/mono）、字号刻度（`font-size-1`~`font-size-9`）、行高、字重 |
| `radius` | `none / sm / md / lg / xl / full` |
| `shadow` | `sm / md / lg` 三档 |
| `motion` | 时长 `fast / base / slow`，缓动曲线 `ease-out / ease-in-out / spring` |

### 4.2 第 2 层 · Semantic（语义令牌，随主题变化）

| 分组 | 令牌 |
|---|---|
| 背景 | `color-bg-canvas / surface / raised` |
| 前景 | `color-fg-default / muted / subtle` |
| 边框 | `color-border-default / strong` |
| 品牌 | `color-brand-bg / fg / hover / active` |
| 状态 | `color-state-{success,warning,danger,info}-{bg,fg,border}` |

语义令牌全部以别名引用 primitive（如 `{primitive.color.gray.0}`），每个「品牌 × 模式」的语义文件给出各自的指向。

### 4.3 第 3 层 · 输出形态

- **CSS 变量**：统一 `--fox-` 前缀。颜色类：`--fox-color-bg-surface`；其他类别：`--fox-space-4`、`--fox-radius-md`、`--fox-font-size-3`、`--fox-shadow-md`、`--fox-motion-duration-base`
- **TS 常量**：`tokens.color.bg.surface` 的值为字符串 `'var(--fox-color-bg-surface)'`，可直接用于 React 内联样式或 CSS-in-JS；`tokens.json` 同时导出全量原始值供工具链使用

### 4.4 源文件格式

W3C Design Tokens Community Group（DTCG）标准 JSON，别名用 `{}` 引用：

```jsonc
// tokens/themes/foxtone.light.json（节选）
{ "color": { "bg": { "surface": {
  "$value": "{primitive.color.gray.0}",
  "$type": "color"
}}}}
```

内置品牌：`foxtone`（狐狸橙）与 `ocean`（海蓝，用于证明多品牌机制），各含 light/dark，共 4 个主题文件。

## 5. 主题机制

### 5.1 构建时（结构性主题：品牌 + 亮暗）

Style Dictionary 为每个「品牌 × 模式」输出一个 CSS 文件，挂在选择器上：

```css
/* dist/css/themes/foxtone-dark.css */
[data-fox-theme="foxtone-dark"] { --fox-color-bg-canvas: …; }
```

另有 `dist/css/core.css` 承载主题无关令牌（间距/圆角/阴影/字体/动效），定义在 `:root`。

应用侧接入两步：

```ts
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';
```

切换主题 = 切换 `<html>` 上的 `data-fox-theme` 属性（值为 `{品牌}-{模式}`，如 `foxtone-dark`）。

### 5.2 运行时（用户自定义主题）

`foxtone` 包导出纯 DOM 的运行时 API（无框架绑定）：

```ts
// 亮暗/品牌切换：设置 data-fox-theme 属性；持久化由应用自行处理
setTheme('ocean', 'dark');

// 用户自定义：覆盖任意语义令牌（注入独立 <style> 标签，可整体撤销）
applyOverrides({ 'color-brand-bg': '#e11d48', 'color-brand-fg': '#ffffff' });
resetOverrides();

// 从一个品牌色派生完整 50~950 色阶（基于 culori / OKLCH）
const scale = paletteFromColor('#e11d48');
```

### 5.3 设计要点

- 构建时与运行时分工明确：结构性主题走零运行时成本的预编译 CSS；个性化走运行时覆盖。两条路径共用同一批 `--fox-*` 变量名，互相兼容
- **变量名即公共契约**：`applyOverrides` 的键为语义令牌名（不带 `--fox-` 前缀），键的类型由构建生成的类型文件约束，拼错在 TS 层报错
- `setTheme` 的合法主题列表同样由构建生成，保证类型安全

## 6. 包产物与 exports

```
dist/
├─ css/core.css
├─ css/themes/{foxtone,ocean}-{light,dark}.css
├─ js/                     # 运行时 API（ESM），含 js/index.js 与 js/index.d.ts
├─ tokens.json             # 全量令牌（含每主题解析后的值）
└─ tokens.d.ts             # 令牌键与主题名的类型定义（由 js/index.d.ts 重导出）
```

`package.json` exports：

```jsonc
{
  "exports": {
    ".": { "types": "./dist/js/index.d.ts", "import": "./dist/js/index.js" },
    "./css/core.css": "./dist/css/core.css",
    "./css/themes/*": "./dist/css/themes/*",
    "./tokens.json": "./dist/tokens.json"
  }
}
```

## 7. Playground demo 站

Vite + React 单页应用，**自身样式完全用 foxtone 令牌编写**（dogfooding）：

| 区块 | 内容 |
|---|---|
| 顶栏 | 品牌选择器（foxtone/ocean）+ 亮/暗切换 + "跟随系统"开关 |
| 色彩画廊 | 每个语义色一张色卡：名称 + 变量名 + 当前实际值（`getComputedStyle` 实时读取，切主题时数值联动）；下方展示原始调色板色阶 |
| 字体/间距/圆角/阴影/动效 | 刻度尺、样例段落、圆角卡片、阴影卡片、缓动动画演示 |
| 自定义主题实验室 | 取色器选品牌色 → `paletteFromColor` 实时生成色阶 → `applyOverrides` 即时全站换肤 → 一键导出 CSS/JSON |
| 快速上手 | 内嵌 `npm install foxtone` 用法文档区块 |

部署：GitHub Actions 在 main 分支构建后发布到 GitHub Pages（Vite 配置正确的 `base` 路径）。

## 8. 测试策略（Vitest）

1. **运行时 API 单测**：
   - `setTheme` 正确设置/更新 `data-fox-theme`
   - `applyOverrides` 注入覆盖、重复调用合并、`resetOverrides` 完全撤销
   - `paletteFromColor` 输出完整 50~950 色阶且亮度单调
2. **构建产物完整性测试**（令牌系统特色）：
   - 每个主题 CSS 都定义了**完整的**语义令牌集合（任一缺失即失败）
   - 所有 CSS 值完全解析（无 `{primitive.xxx}` 残留）
   - `tokens.json` 与 CSS 变量一一对应
3. **Playground 冒烟**：`vite build` 成功；v1 不做 e2e

## 9. CI 与发布

- **CI（GitHub Actions）**：PR 与 push 触发 `pnpm install → build(tokens) → test → build(playground)`；main 分支额外部署 Pages
- **npm 发布**：v1 手动，在 `packages/foxtone` 执行 `npm version` + `npm publish`
- **提交规范**：Conventional Commits（`feat:` / `fix:` / `docs:` / `test:` / `chore:`）

## 10. 实施前置事项

- 本地目录 `D:\code\designtoken` 待重命名为 `D:\code\foxtone`（当前被开发会话占用无法自动重命名，由用户在会话外手动完成；仓库内所有路径与此无关，可随时重命名）
- git 仓库已初始化；本地提交身份：`foXerw <fox289042708@gmail.com>`

## 11. 未来路线（不在 v1）

- `foxtone-react`：`<FoxThemeProvider>`、`useTheme` hook
- 组件令牌层（第 3 层语义）
- 更多内置品牌主题；设计令牌 JSON Schema 校验
- changesets 自动发版；断点令牌；多平台输出（如需）
