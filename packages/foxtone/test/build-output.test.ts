import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
const cssThemesDir = join(dist, 'css', 'themes');
const EXPECTED_THEMES = [
  'arctic-light', 'arctic-dark',
  'corsac-light', 'corsac-dark',
  'fennec-light', 'fennec-dark',
  'foxtone-light', 'foxtone-dark',
  'grayfox-light', 'grayfox-dark',
  'silver-light', 'silver-dark',
];
const STATE = ['success', 'warning', 'danger', 'info'];
const SEMANTIC_TOKENS = [
  'color-bg-canvas', 'color-bg-surface', 'color-bg-raised',
  'color-fg-default', 'color-fg-muted', 'color-fg-subtle',
  'color-border-default', 'color-border-strong',
  'color-brand-bg', 'color-brand-fg', 'color-brand-hover', 'color-brand-active',
  ...STATE.flatMap((s) => [`color-state-${s}-bg`, `color-state-${s}-fg`, `color-state-${s}-border`]),
];

function parseVars(css: string): Map<string, string> {
  return new Map(
    [...css.matchAll(/--fox-([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

describe('dist 构建产物', () => {
  it('dist 存在（先运行 pnpm --filter foxtone build:tokens）', () => {
    expect(existsSync(dist), '请先运行 pnpm --filter foxtone build:tokens').toBe(true);
  });

  describe('css/core.css', () => {
    const core = () => readFileSync(join(dist, 'css', 'core.css'), 'utf8');
    it('挂在 :root 且包含主题无关变量', () => {
      const css = core();
      expect(css).toContain(':root');
      expect(css).toContain('--fox-space-4: 16px;');
      expect(css).toContain('--fox-radius-md: 8px;');
      expect(css).toContain('--fox-shadow-md:');
      expect(css).toContain('--fox-motion-duration-base: 200ms;');
      expect(css).toContain('--fox-font-family-sans:');
    });
    it('不包含颜色变量（原始色板只是原料）', () => {
      expect(core()).not.toContain('--fox-color-');
    });
  });

  describe('css/themes/*.css', () => {
    it('恰好生成 4 个主题文件', () => {
      expect(readdirSync(cssThemesDir).sort()).toEqual(
        [...EXPECTED_THEMES].map((t) => `${t}.css`).sort(),
      );
    });
    for (const theme of EXPECTED_THEMES) {
      it(`${theme}.css：选择器正确、语义令牌完整、无未解析引用`, () => {
        const css = readFileSync(join(cssThemesDir, `${theme}.css`), 'utf8');
        expect(css).toContain(`[data-fox-theme="${theme}"]`);
        expect(css).not.toContain('{primitive.');
        expect(css).not.toContain('primitive');
        const vars = parseVars(css);
        expect([...vars.keys()].sort()).toEqual([...SEMANTIC_TOKENS].sort());
        for (const value of vars.values()) {
          // color/css 变换可能输出 #hex 或 rgb()，两者都合法
          expect(value).toMatch(/^(#[0-9a-f]{3,8}|rgb)/i);
        }
      });
    }
  });

  describe('tokens.json', () => {
    const tokens = () => JSON.parse(readFileSync(join(dist, 'tokens.json'), 'utf8'));
    it('primitive 嵌套含原始色板与刻度', () => {
      const t = tokens();
      expect(t.primitive.color.orange['500']).toBe('#f97316');
      expect(t.primitive.space['4']).toBe('16px');
      expect(t.primitive.radius.md).toBe('8px');
    });
    it('每个主题的键集合 = 24 个语义令牌，值与 CSS 一致', () => {
      const t = tokens();
      expect(Object.keys(t.themes).sort()).toEqual([...EXPECTED_THEMES].sort());
      for (const theme of EXPECTED_THEMES) {
        const cssVars = parseVars(readFileSync(join(cssThemesDir, `${theme}.css`), 'utf8'));
        expect(Object.keys(t.themes[theme]).sort()).toEqual([...SEMANTIC_TOKENS].sort());
        for (const [name, value] of Object.entries(t.themes[theme])) {
          expect(value, `${theme} 的 ${name}`).toBe(cssVars.get(name));
        }
      }
    });
  });
});
