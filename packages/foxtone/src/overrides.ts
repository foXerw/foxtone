import type { TokenOverrides } from './generated/tokens.js';

let styleEl: HTMLStyleElement | null = null;
const overrides = new Map<string, string>();

/** 把当前覆盖集合渲染为 :root 规则 */
function render(): void {
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.setAttribute('data-fox-overrides', '');
    document.head.appendChild(styleEl);
  }
  const declarations = [...overrides.entries()]
    .map(([token, value]) => `--fox-${token}: ${value};`)
    .join(' ');
  styleEl.textContent = `:root { ${declarations} }`;
}

/** 覆盖任意语义令牌（合并式：同名后写覆盖先写） */
export function applyOverrides(newOverrides: TokenOverrides): void {
  for (const [token, value] of Object.entries(newOverrides)) {
    if (value !== undefined) overrides.set(token, value);
  }
  render();
}

/** 撤销全部覆盖，移除注入的 style 标签 */
export function resetOverrides(): void {
  overrides.clear();
  styleEl?.remove();
  styleEl = null;
}
