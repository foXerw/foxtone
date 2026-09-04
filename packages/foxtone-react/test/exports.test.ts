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
    for (const name of ['FoxThemeProvider', 'useTheme', 'useTokens', 'useTokenValue'] as const) {
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
