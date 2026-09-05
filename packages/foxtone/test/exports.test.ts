import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');

describe('包导出面（需先运行 pnpm --filter foxtone build）', () => {
  it('dist/js 编译产物与类型声明存在', () => {
    expect(existsSync(join(dist, 'js', 'index.js')), '请先运行 pnpm --filter foxtone build').toBe(true);
    expect(existsSync(join(dist, 'js', 'index.d.ts'))).toBe(true);
    expect(existsSync(join(dist, 'js', 'generated', 'tokens.d.ts'))).toBe(true);
  });

  it('运行时 API 完整且行为正确', async () => {
    const api = await import('../dist/js/index.js');
    for (const fn of ['setTheme', 'getTheme', 'applyOverrides', 'resetOverrides', 'paletteFromColor']) {
      expect(typeof api[fn], `${fn} 应为函数`).toBe('function');
    }
    expect(api.themeNames).toEqual([
      'arctic-light', 'arctic-dark', 'corsac-light', 'corsac-dark',
      'fennec-light', 'fennec-dark', 'foxtone-light', 'foxtone-dark',
      'grayfox-light', 'grayfox-dark', 'silver-light', 'silver-dark',
    ]);
    expect(api.brandNames).toEqual(['arctic', 'corsac', 'fennec', 'foxtone', 'grayfox', 'silver']);
    expect(api.modes).toEqual(['light', 'dark']);
    expect(api.semanticColorTokens.length).toBe(24);
  });

  it('tokens 常量树指向 var(--fox-*)', async () => {
    const { tokens } = await import('../dist/js/index.js');
    expect(tokens.color.bg.surface).toBe('var(--fox-color-bg-surface)');
    expect(tokens.space['4']).toBe('var(--fox-space-4)');
    expect(tokens.radius.md).toBe('var(--fox-radius-md)');
    expect(tokens.motion.duration.base).toBe('var(--fox-motion-duration-base)');
  });

  it('package.json exports 指向的文件全部存在', () => {
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
      if (path.includes('*')) continue; // 通配项由 themes 目录断言覆盖
      expect(existsSync(join(import.meta.dirname, '..', path)), `缺少 ${path}`).toBe(true);
    }
  });
});
