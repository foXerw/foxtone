// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { applyOverrides, resetOverrides } from '../src/overrides.js';

/** 读取当前注入的覆盖样式内容 */
function overridesCss(): string {
  return document.querySelector('style[data-fox-overrides]')?.textContent ?? '';
}

beforeEach(() => {
  resetOverrides();
});

describe('applyOverrides', () => {
  it('注入 style 标签，键映射为 --fox- 前缀变量', () => {
    applyOverrides({ 'color-brand-bg': '#e11d48' });
    expect(overridesCss()).toContain('--fox-color-brand-bg: #e11d48;');
  });

  it('重复调用合并，同名令牌后写覆盖先写', () => {
    applyOverrides({ 'color-brand-bg': '#e11d48' });
    applyOverrides({ 'color-brand-fg': '#ffffff', 'color-brand-bg': '#0f766e' });
    const css = overridesCss();
    expect(css).toContain('--fox-color-brand-bg: #0f766e;');
    expect(css).toContain('--fox-color-brand-fg: #ffffff;');
    expect(css).not.toContain('#e11d48');
  });

  it('始终只有一个覆盖 style 标签', () => {
    applyOverrides({ 'color-brand-bg': '#e11d48' });
    applyOverrides({ 'color-brand-fg': '#ffffff' });
    expect(document.querySelectorAll('style[data-fox-overrides]').length).toBe(1);
  });
});

describe('resetOverrides', () => {
  it('整体移除覆盖样式', () => {
    applyOverrides({ 'color-brand-bg': '#e11d48' });
    resetOverrides();
    expect(document.querySelector('style[data-fox-overrides]')).toBeNull();
  });

  it('重置后可再次注入', () => {
    applyOverrides({ 'color-brand-bg': '#e11d48' });
    resetOverrides();
    applyOverrides({ 'color-brand-fg': '#ffffff' });
    const css = overridesCss();
    expect(css).toContain('--fox-color-brand-fg');
    expect(css).not.toContain('color-brand-bg');
  });
});
