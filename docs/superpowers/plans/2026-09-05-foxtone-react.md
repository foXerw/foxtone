# foxtone-react 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `foxtone-react` 包 —— `foxtone` 运行时 API 的 React 绑定：`<FoxThemeProvider>` + `useTheme`（含 opt-in 持久化）+ `useTokens` + `useTokenValue`，并重构 playground 用它做 dogfooding。

**Architecture:** pnpm monorepo 新增 `packages/foxtone-react`（纯 ESM、tsc 构建，镜像 `foxtone`）。单一 `FoxThemeContext` 承载主题状态，Provider 内部调用核心 `setTheme` 同步 `data-fox-theme`、订阅 `matchMedia` 跟随系统、opt-in 写回 `localStorage`。`foxtone` 与 `react` 均作 `peerDependency`（保证类型/实例单一）。

**Tech Stack:** React 19 · TypeScript (strict, ESM-only, NodeNext, react-jsx) · Vitest (+jsdom) · @testing-library/react · pnpm workspaces

**Spec:** `docs/superpowers/specs/2026-09-05-foxtone-react-design.md`

## Global Constraints

- npm 包名：`foxtone-react`；`react@^19.1.0` 与 `foxtone@^0.1.0` 为 `peerDependencies`
- 不重导出 `foxtone` 的运行时 API（`setTheme`/`getTheme`/`applyOverrides`/`resetOverrides`/`paletteFromColor`）；仅重导出类型与常量（`tokens`/`brandNames`/`modes`/`themeNames`/`semanticColorTokens`）
- 全部代码与注释使用中文；提交信息用 Conventional Commits（英文）
- 构建用 `tsc`（ESM-only，NodeNext）；测试用 Vitest + jsdom + @testing-library/react
- 前置：`foxtone` 必须已构建（本包 import 其 `dist/js`）；Node ≥ 22（本机 v24）

---

### Task 1: foxtone-react 脚手架

**Files:**
- Create: `packages/foxtone-react/package.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`
- Create: `packages/foxtone-react/src/index.ts`（占位，Task 2 替换）

**Interfaces:**
- Produces: 可运行的 workspace 包；`pnpm --filter foxtone-react test` 退出码 0（无测试时 `--passWithNoTests` 生效）

- [ ] **Step 1: `packages/foxtone-react/package.json`**

```json
{
  "name": "foxtone-react",
  "version": "0.1.0",
  "description": "foxtone 设计令牌系统的 React 绑定",
  "license": "MIT",
  "type": "module",
  "sideEffects": false,
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/js/index.d.ts", "import": "./dist/js/index.js" }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "vitest run --passWithNoTests"
  },
  "peerDependencies": {
    "foxtone": "^0.1.0",
    "react": "^19.1.0"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^24.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "foxtone": "workspace:*",
    "jsdom": "^26.1.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: `packages/foxtone-react/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "test", "vitest.config.ts"]
}
```

- [ ] **Step 3: `packages/foxtone-react/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "dist/js", "rootDir": "src" },
  "include": ["src"]
}
```

- [ ] **Step 4: `packages/foxtone-react/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 5: `packages/foxtone-react/src/index.ts`（占位，Task 2 替换）**

```ts
/** foxtone-react 版本号 */
export const VERSION = '0.1.0';
```

- [ ] **Step 6: 安装依赖并验证**

Run: `pnpm install && pnpm --filter foxtone-react test`
Expected: 安装成功；vitest 输出 `No test files found` 且退出码 0

- [ ] **Step 7: Commit**

```bash
git add packages/foxtone-react pnpm-lock.yaml
git commit -m "chore(foxtone-react): scaffold React binding package"
```

---

### Task 2: FoxThemeProvider + useTheme（TDD）

**Files:**
- Test: `packages/foxtone-react/test/provider.test.tsx`
- Create: `packages/foxtone-react/src/provider.tsx`, `src/useTheme.ts`
- Modify: `packages/foxtone-react/src/index.ts`（替换占位）

**Interfaces:**
- Consumes: `foxtone` 的 `setTheme`、类型 `BrandName`/`Mode`/`ThemeName`（已构建的 `dist/js`）
- Produces: `FoxThemeProvider`（props：`storageKey?`/`defaultBrand?`/`defaultMode?`/`defaultFollowSystem?`/`children`）、`useTheme()` → `ThemeController`、导出类型 `ThemeController`

- [ ] **Step 1: 写失败测试 `test/provider.test.tsx`**

```tsx
import { Component, type ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FoxThemeProvider, useTheme } from '../src/index.js';

/** 消费 useTheme 并暴露操作入口 */
function Harness() {
  const { themeName, brand, mode, followSystem, setBrand, setMode, setFollowSystem, toggleMode } =
    useTheme();
  return (
    <div>
      <span data-testid="themeName">{themeName}</span>
      <span data-testid="brand">{brand}</span>
      <span data-testid="mode">{mode}</span>
      <span data-testid="follow">{String(followSystem)}</span>
      <button onClick={() => setBrand('ocean')}>to-ocean</button>
      <button onClick={() => setMode('dark')}>to-dark</button>
      <button onClick={() => toggleMode()}>toggle</button>
      <button onClick={() => setFollowSystem(true)}>follow-on</button>
    </div>
  );
}

/** 捕获渲染期抛出的错误，供“Provider 外使用”断言 */
class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <span data-testid="err">{this.state.error.message}</span>
    ) : (
      this.props.children
    );
  }
}

function mount(props: { storageKey?: string } = {}) {
  return render(
    <FoxThemeProvider {...props}>
      <Harness />
    </FoxThemeProvider>,
  );
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-fox-theme');
  window.localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('FoxThemeProvider + useTheme', () => {
  it('挂载即应用默认主题', () => {
    mount();
    expect(screen.getByTestId('themeName').textContent).toBe('foxtone-light');
    expect(document.documentElement.getAttribute('data-fox-theme')).toBe('foxtone-light');
  });

  it('setBrand/setMode 更新 data-fox-theme', () => {
    mount();
    fireEvent.click(screen.getByText('to-ocean'));
    fireEvent.click(screen.getByText('to-dark'));
    expect(screen.getByTestId('themeName').textContent).toBe('ocean-dark');
    expect(document.documentElement.getAttribute('data-fox-theme')).toBe('ocean-dark');
  });

  it('toggleMode 在 light/dark 间切换', () => {
    mount();
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('followSystem 开启后由 matchMedia 决定模式', () => {
    const listeners: Array<(e: { matches: boolean }) => void> = [];
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
      removeEventListener: () => {},
    }));
    mount();
    fireEvent.click(screen.getByText('follow-on'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-fox-theme')).toBe('foxtone-dark');
  });

  it('未传 storageKey 时零写入 localStorage', () => {
    mount();
    expect(window.localStorage.length).toBe(0);
  });

  it('传入 storageKey 时写回并恢复', () => {
    const { unmount } = mount({ storageKey: 'test-theme' });
    fireEvent.click(screen.getByText('to-ocean'));
    expect(JSON.parse(window.localStorage.getItem('test-theme')!)).toMatchObject({ brand: 'ocean' });
    unmount();
    render(
      <FoxThemeProvider storageKey="test-theme">
        <Harness />
      </FoxThemeProvider>,
    );
    expect(screen.getByTestId('brand').textContent).toBe('ocean');
  });

  it('Provider 外使用 useTheme 抛错', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Boundary>
        <Harness />
      </Boundary>,
    );
    expect(screen.getByTestId('err').textContent).toContain(
      'useTheme 必须在 <FoxThemeProvider> 内使用',
    );
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm --filter foxtone build && pnpm --filter foxtone-react test`
Expected: FAIL（找不到 `../src/index.js` 的 `FoxThemeProvider`/`useTheme` 导出）

- [ ] **Step 3: 实现 `src/provider.tsx`**

```tsx
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setTheme, type BrandName, type Mode, type ThemeName } from 'foxtone';

/** useTheme 返回的主题控制器 */
export interface ThemeController {
  brand: BrandName;
  mode: Mode;
  followSystem: boolean;
  systemDark: boolean;
  themeName: ThemeName;
  setBrand: (brand: BrandName) => void;
  setMode: (mode: Mode) => void;
  setFollowSystem: (follow: boolean) => void;
  toggleMode: () => void;
}

export const FoxThemeContext = createContext<ThemeController | null>(null);

interface FoxThemeProviderProps {
  /** 传入则持久化 {brand, mode, followSystem} 到 localStorage；不传则不持久化 */
  storageKey?: string;
  defaultBrand?: BrandName;
  defaultMode?: Mode;
  defaultFollowSystem?: boolean;
  children: ReactNode;
}

/** 从 localStorage 读取已存主题状态；失败（隐私模式/损坏）返回 null */
function loadStored(key: string): {
  brand?: BrandName;
  mode?: Mode;
  followSystem?: boolean;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { brand?: BrandName; mode?: Mode; followSystem?: boolean }) : null;
  } catch {
    return null;
  }
}

export function FoxThemeProvider({
  storageKey,
  defaultBrand = 'foxtone',
  defaultMode = 'light',
  defaultFollowSystem = false,
  children,
}: FoxThemeProviderProps) {
  const [initial] = useState(() => (storageKey ? loadStored(storageKey) : null));
  const [brand, setBrand] = useState<BrandName>(initial?.brand ?? defaultBrand);
  const [mode, setMode] = useState<Mode>(initial?.mode ?? defaultMode);
  const [followSystem, setFollowSystem] = useState(initial?.followSystem ?? defaultFollowSystem);
  const [systemDark, setSystemDark] = useState(false);

  // 跟随系统：开启时订阅系统配色
  useEffect(() => {
    if (!followSystem) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [followSystem]);

  const resolvedMode: Mode = followSystem ? (systemDark ? 'dark' : 'light') : mode;
  const themeName = `${brand}-${resolvedMode}` as ThemeName;

  // 品牌/模式 → data-fox-theme
  useEffect(() => {
    setTheme(brand, resolvedMode);
  }, [brand, resolvedMode]);

  // 持久化（opt-in）
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ brand, mode, followSystem }));
    } catch {
      /* 写失败（隐私模式等）忽略 */
    }
  }, [storageKey, brand, mode, followSystem]);

  const toggleMode = useCallback(() => {
    if (followSystem) return;
    setMode((m) => (m === 'light' ? 'dark' : 'light'));
  }, [followSystem]);

  const value = useMemo<ThemeController>(
    () => ({
      brand,
      mode,
      followSystem,
      systemDark,
      themeName,
      setBrand,
      setMode,
      setFollowSystem,
      toggleMode,
    }),
    [brand, mode, followSystem, systemDark, themeName, toggleMode],
  );

  return <FoxThemeContext.Provider value={value}>{children}</FoxThemeContext.Provider>;
}
```

- [ ] **Step 4: 实现 `src/useTheme.ts`**

```ts
import { useContext } from 'react';
import { FoxThemeContext, type ThemeController } from './provider.js';

/** 读取当前主题状态与 setter；必须在 <FoxThemeProvider> 内使用 */
export function useTheme(): ThemeController {
  const ctx = useContext(FoxThemeContext);
  if (!ctx) throw new Error('foxtone-react: useTheme 必须在 <FoxThemeProvider> 内使用');
  return ctx;
}
```

- [ ] **Step 5: 替换 `src/index.ts`**

```ts
export { FoxThemeProvider, type ThemeController } from './provider.js';
export { useTheme } from './useTheme.js';
```

- [ ] **Step 6: 运行测试，确认通过**

Run: `pnpm --filter foxtone build && pnpm --filter foxtone-react test`
Expected: PASS（7 个用例）

- [ ] **Step 7: Commit**

```bash
git add packages/foxtone-react/src packages/foxtone-react/test/provider.test.tsx
git commit -m "feat(foxtone-react): add FoxThemeProvider and useTheme"
```

---

### Task 3: useTokens + useTokenValue（TDD）

**Files:**
- Test: `packages/foxtone-react/test/useTokens.test.tsx`, `test/useTokenValue.test.tsx`
- Create: `packages/foxtone-react/src/useTokens.ts`, `src/useTokenValue.ts`
- Modify: `packages/foxtone-react/src/index.ts`（追加导出）

**Interfaces:**
- Consumes: `foxtone` 的 `tokens` 常量；Task 2 的 `useTheme`/`FoxThemeContext`
- Produces: `useTokens()` → `typeof tokens`、`useTokenValue(name: string)` → `string`

- [ ] **Step 1: 写失败测试 `test/useTokens.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { tokens } from 'foxtone';
import { useTokens } from '../src/index.js';

describe('useTokens', () => {
  it('返回 foxtone 的 tokens 常量树', () => {
    const { result } = renderHook(() => useTokens());
    expect(result.current).toBe(tokens);
    expect(result.current.color.bg.surface).toBe('var(--fox-color-bg-surface)');
    expect(result.current.space['4']).toBe('var(--fox-space-4)');
  });
});
```

- [ ] **Step 2: 写失败测试 `test/useTokenValue.test.tsx`**

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FoxThemeProvider, useTheme, useTokenValue } from '../src/index.js';

let readCount = 0;

function Probe({ name }: { name: string }) {
  const value = useTokenValue(name);
  return <span data-testid="value">{value}</span>;
}

beforeEach(() => {
  readCount = 0;
  // 同步化 rAF，读值不依赖真实帧时序
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  // 控制 getComputedStyle 返回值：只对品牌色返回固定值
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () =>
      ({
        getPropertyValue: (name: string) => {
          readCount += 1;
          return name === '--fox-color-brand-bg' ? '#ff0000' : '';
        },
      }) as unknown as CSSStyleDeclaration,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useTokenValue', () => {
  it('读取当前计算值', async () => {
    render(
      <FoxThemeProvider>
        <Probe name="color-brand-bg" />
      </FoxThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('#ff0000'));
  });

  it('themeName 变化后重新读取', async () => {
    function Harness() {
      const { setBrand } = useTheme();
      return (
        <div>
          <button onClick={() => setBrand('ocean')}>to-ocean</button>
          <Probe name="color-brand-bg" />
        </div>
      );
    }
    render(
      <FoxThemeProvider>
        <Harness />
      </FoxThemeProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('#ff0000'));
    const before = readCount;
    fireEvent.click(screen.getByText('to-ocean'));
    await waitFor(() => expect(readCount).toBeGreaterThan(before));
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `pnpm --filter foxtone build && pnpm --filter foxtone-react test`
Expected: FAIL（找不到 `../src/index.js` 的 `useTokens`/`useTokenValue` 导出）

- [ ] **Step 4: 实现 `src/useTokens.ts`**

```ts
import { tokens } from 'foxtone';

/** 返回 foxtone 的 var(--fox-*) 常量树（静态常量，无需 context） */
export function useTokens(): typeof tokens {
  return tokens;
}
```

- [ ] **Step 5: 实现 `src/useTokenValue.ts`**

```ts
import { useEffect, useState } from 'react';
import { useTheme } from './useTheme.js';

/** 读取某个 --fox-* 变量的浏览器计算值；themeName 变化后下一帧重新取样 */
export function useTokenValue(name: string): string {
  const { themeName } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(`--fox-${name}`)
        .trim();
      setValue(v);
    });
    return () => cancelAnimationFrame(id);
  }, [themeName, name]);

  return value;
}
```

- [ ] **Step 6: 追加 `src/index.ts` 导出**

把 `src/index.ts` 改为：

```ts
export { FoxThemeProvider, type ThemeController } from './provider.js';
export { useTheme } from './useTheme.js';
export { useTokens } from './useTokens.js';
export { useTokenValue } from './useTokenValue.js';

// 重导出 foxtone 的类型与常量，方便单包导入（不重导出运行时 API）
export { tokens, brandNames, modes, themeNames, semanticColorTokens } from 'foxtone';
export type {
  BrandName,
  Mode,
  ThemeName,
  SemanticTokenName,
  TokenOverrides,
} from 'foxtone';
```

- [ ] **Step 7: 运行测试，确认通过**

Run: `pnpm --filter foxtone build && pnpm --filter foxtone-react test`
Expected: PASS（3 个用例：useTokens 1 + useTokenValue 2）

- [ ] **Step 8: Commit**

```bash
git add packages/foxtone-react/src packages/foxtone-react/test
git commit -m "feat(foxtone-react): add useTokens and useTokenValue hooks"
```

---

### Task 4: 构建产物与导出面验证

**Files:**
- Test: `packages/foxtone-react/test/exports.test.ts`

**Interfaces:**
- Consumes: Task 2/3 源码；`foxtone` 已构建
- Produces: `pnpm --filter foxtone-react build` 产出 `dist/js`（.js + .d.ts）；`exports.test.ts` 锁定公共 API 面

- [ ] **Step 1: 写失败测试 `test/exports.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');

describe('foxtone-react 导出面（需先运行 pnpm --filter foxtone-react build）', () => {
  it('dist/js 编译产物与类型声明存在', () => {
    expect(existsSync(join(dist, 'js', 'index.js')), '请先运行 pnpm --filter foxtone-react build').toBe(true);
    expect(existsSync(join(dist, 'js', 'index.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'provider.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'useTheme.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'useTokens.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'useTokenValue.d.ts'))).toBe(true);
  });

  it('公共 API 完整', async () => {
    const api = await import('../dist/js/index.js');
    for (const name of ['FoxThemeProvider', 'useTheme', 'useTokens', 'useTokenValue']) {
      expect(typeof api[name], `${name} 应为函数`).toBe('function');
    }
    expect(api.brandNames).toEqual(['foxtone', 'ocean']);
    expect(api.modes).toEqual(['light', 'dark']);
    expect(api.themeNames).toEqual(['foxtone-light', 'foxtone-dark', 'ocean-light', 'ocean-dark']);
    expect(api.semanticColorTokens.length).toBe(24);
    expect(api.tokens.color.bg.surface).toBe('var(--fox-color-bg-surface)');
  });

  it('package.json exports 指向的文件存在', () => {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
    );
    // 条件导出（如 "." 的 { types, import }）需展平为目标路径列表
    const targets: string[] = [];
    for (const value of Object.values(pkg.exports)) {
      if (typeof value === 'string') targets.push(value);
      else targets.push(...Object.values(value as Record<string, string>));
    }
    for (const target of targets) {
      const path = target.replace(/^\.\//, '');
      expect(existsSync(join(import.meta.dirname, '..', path)), `缺少 ${path}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `pnpm --filter foxtone-react test`
Expected: FAIL（`dist/js 编译产物` 断言失败）

- [ ] **Step 3: 执行完整构建**

Run: `pnpm --filter foxtone build && pnpm --filter foxtone-react build`
Expected: tsc 静默成功；`dist/js/index.js`、`dist/js/index.d.ts` 等生成

- [ ] **Step 4: 运行测试，确认通过**

Run: `pnpm --filter foxtone-react test`
Expected: PASS（3 个用例）

- [ ] **Step 5: 类型检查**

Run: `cd packages/foxtone-react && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: Commit**

```bash
git add packages/foxtone-react/test/exports.test.ts
git commit -m "feat(foxtone-react): verify built exports and public API surface"
```

---

### Task 5: Playground 重构（dogfooding）

**Files:**
- Modify: `apps/playground/package.json`（加 `foxtone-react` 依赖）
- Modify: `apps/playground/src/main.tsx`, `src/App.tsx`, `src/components/Toolbar.tsx`, `src/components/ColorGallery.tsx`
- Modify: 根 `package.json`（`dev` 脚本先构建 foxtone-react）

**Interfaces:**
- Consumes: 已构建的 `foxtone-react`（`FoxThemeProvider`/`useTheme`/`useTokenValue` + 重导出的 `brandNames`/`modes`/`semanticColorTokens`/类型）
- Produces: 可运行的 demo 站，行为与重构前一致，但主题状态由 Provider 托管（含 localStorage 持久化）

- [ ] **Step 1: `apps/playground/package.json` 加依赖**

在 `dependencies` 增加一行：

```json
"foxtone-react": "workspace:*",
```

- [ ] **Step 2: 改根 `package.json` 的 `dev` 脚本**

```json
"dev": "pnpm --filter foxtone build && pnpm --filter foxtone-react build && pnpm --filter playground dev"
```

- [ ] **Step 3: 改 `apps/playground/src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';
import 'foxtone/css/themes/foxtone-dark.css';
import 'foxtone/css/themes/ocean-light.css';
import 'foxtone/css/themes/ocean-dark.css';
import './styles.css';
import { FoxThemeProvider } from 'foxtone-react';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FoxThemeProvider storageKey="foxtone-playground">
      <App />
    </FoxThemeProvider>
  </StrictMode>,
);
```

- [ ] **Step 4: 改 `apps/playground/src/App.tsx`**

```tsx
import { useTheme } from 'foxtone-react';
import { Toolbar } from './components/Toolbar';
import { ColorGallery } from './components/ColorGallery';
import { ScalesGallery } from './components/ScalesGallery';
import { ThemeLab } from './components/ThemeLab';
import { QuickStart } from './components/QuickStart';

export default function App() {
  const { themeName } = useTheme();
  return (
    <div className="page">
      <Toolbar />
      <main className="content">
        <ColorGallery themeKey={themeName} />
        <ScalesGallery />
        <ThemeLab />
        <QuickStart />
      </main>
      <footer className="footer">foxtone · 设计令牌系统</footer>
    </div>
  );
}
```

- [ ] **Step 5: 改 `apps/playground/src/components/Toolbar.tsx`**

```tsx
import { brandNames, modes, useTheme, type BrandName, type Mode } from 'foxtone-react';

export function Toolbar() {
  const { brand, mode, followSystem, setBrand, setMode, setFollowSystem } = useTheme();
  return (
    <header className="toolbar">
      <span className="toolbar-logo">🦊 foxtone</span>
      <div className="toolbar-controls">
        <label>
          品牌
          <select value={brand} onChange={(e) => setBrand(e.target.value as BrandName)}>
            {brandNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          模式
          <select value={mode} disabled={followSystem} onChange={(e) => setMode(e.target.value as Mode)}>
            {modes.map((m) => (
              <option key={m} value={m}>{m === 'light' ? '亮色' : '暗色'}</option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={followSystem}
            onChange={(e) => setFollowSystem(e.target.checked)}
          />
          跟随系统
        </label>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: 改 `apps/playground/src/components/ColorGallery.tsx`**

```tsx
import { semanticColorTokens, useTokenValue } from 'foxtone-react';
import tokensJson from 'foxtone/tokens.json';

const PALETTES = ['orange', 'gray', 'green', 'amber', 'red', 'sky'] as const;

/** 单个色卡的取值列：用 useTokenValue 实时读取 */
function SwatchValue({ name }: { name: string }) {
  const value = useTokenValue(name);
  return <span className="swatch-value">{value || '…'}</span>;
}

export function ColorGallery({ themeKey }: { themeKey: string }) {
  return (
    <section className="section">
      <h2>语义色彩</h2>
      <p className="hint">
        当前主题 <code>{themeKey}</code> —— 切换主题时，取值列会实时联动。
      </p>
      <div className="swatch-grid">
        {semanticColorTokens.map((name) => (
          <div className="swatch-card" key={name}>
            <div className="swatch" style={{ background: `var(--fox-${name})` }} />
            <div className="swatch-meta">
              <code>{name}</code>
              <SwatchValue name={name} />
            </div>
          </div>
        ))}
      </div>

      <h3>原始调色板</h3>
      {PALETTES.map((palette) => (
        <div className="palette-row" key={palette}>
          <span className="palette-name">{palette}</span>
          {Object.entries(tokensJson.primitive.color[palette]).map(([step, hex]) => (
            <span
              key={step}
              className="palette-step"
              title={`${palette}.${step} ${hex}`}
              style={{ background: hex }}
            >
              {step}
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 7: 安装依赖并构建验证**

Run: `pnpm install && pnpm build`
Expected: 根 `pnpm -r build` 依次构建 foxtone → foxtone-react → playground，无错误；`apps/playground/dist/index.html` 生成

- [ ] **Step 8: 本地预览冒烟（可选但推荐）**

Run: `pnpm dev`（根目录），浏览器打开本地地址
Expected: 品牌/模式/跟随系统切换正常；刷新后主题保持（localStorage 持久化）；色卡取值列实时联动；实验室换肤/导出正常。验证后停止进程。

- [ ] **Step 9: Commit**

```bash
git add apps/playground package.json pnpm-lock.yaml
git commit -m "feat(playground): consume foxtone-react provider and hooks"
```

---

### Task 6: README 更新与全量回归

**Files:**
- Modify: 根 `README.md`

**Interfaces:**
- Consumes: 已完成的 foxtone-react 包与 demo
- Produces: README 仓库结构补 `foxtone-react`；全量构建/测试通过

- [ ] **Step 1: 更新根 `README.md`**

在「特性」列表末尾追加一条：

```markdown
- 🧩 **React 绑定**：[`foxtone-react`](packages/foxtone-react)（`<FoxThemeProvider>` + `useTheme`/`useTokens`/`useTokenValue`，含主题持久化）
```

在「仓库结构」代码块中 `packages/foxtone` 行下追加：

```
packages/foxtone-react  React 绑定包（Provider + hooks，peer 依赖 foxtone 与 react）
```

- [ ] **Step 2: 全量回归**

Run: `pnpm build && pnpm test`
Expected: 全部构建成功；foxtone（26）+ foxtone-react（13）测试全部通过

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document foxtone-react in README"
```

---

## 完成验收（全部任务结束后）

- [ ] `packages/foxtone-react` 可独立发布：`dist/js` 含 `index.js`/`index.d.ts` 及四个源文件的 `.d.ts`；`pnpm --filter foxtone-react exec pnpm pack --dry-run` 检查包内容仅含 `dist/`
- [ ] `useTheme` 在 Provider 外抛错；`useTokens`/`useTokenValue` 行为正确（由测试保证）
- [ ] playground 用 `foxtone-react` 重构后行为与重构前一致，且刷新后主题持久化
