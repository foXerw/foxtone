# foxtone-react 🦊⚛️

**foxtone 设计令牌系统的 React 绑定**：用 React 惯用的 Provider + hooks 封装主题切换、跟随系统与令牌消费，无需手写 `data-fox-theme` 同步或 localStorage 持久化。

## 安装

```bash
npm install foxtone foxtone-react
```

## 快速上手

```tsx
import { FoxThemeProvider, useTheme } from 'foxtone-react';
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';
import 'foxtone/css/themes/foxtone-dark.css';

function App() {
  const { themeName, brand, setBrand, mode, setMode } = useTheme();
  return (
    <div style={{ background: 'var(--fox-color-bg-canvas)' }}>
      当前主题：{themeName}
      <select value={brand} onChange={(e) => setBrand(e.target.value as any)}>
        <option>foxtone</option>
        <option>arctic</option>
      </select>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <FoxThemeProvider storageKey="foxtone-theme">
    <App />
  </FoxThemeProvider>,
);
```

## API

### `<FoxThemeProvider>`

- `storageKey?` — 传入则把 `{ brand, mode, followSystem }` 持久化到 localStorage（不传则不持久化）
- `defaultBrand?` / `defaultMode?` / `defaultFollowSystem?` — 默认 `foxtone` / `light` / `false`

### hooks

- `useTheme()` → `{ brand, mode, followSystem, systemDark, themeName, setBrand, setMode, setFollowSystem, toggleMode }`
  - `mode` 为**生效模式**：跟随系统时由 `systemDark` 决定，否则为手动选择
- `useTokens()` → foxtone 的 `var(--fox-*)` 常量树（React 内联样式可直接用）
- `useTokenValue(name)` → 读取某个 `--fox-*` 变量的当前计算值，主题变化后自动重取

类型（`BrandName`/`Mode`/`ThemeName`/`SemanticTokenName`/`TokenOverrides`）与常量（`tokens`/`brandNames`/`modes`/`themeNames`/`semanticColorTokens`）从 `foxtone-react` 直接重导出，无需再从 `foxtone` 单独引入。

## License

MIT © foXerw
