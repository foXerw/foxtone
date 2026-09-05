// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { setTheme, getTheme } from '../src/themes.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-fox-theme');
});

describe('setTheme', () => {
  it('把 data-fox-theme 设为 品牌-模式', () => {
    setTheme('arctic', 'dark');
    expect(document.documentElement.getAttribute('data-fox-theme')).toBe('arctic-dark');
  });

  it('重复调用覆盖上一个主题', () => {
    setTheme('foxtone', 'light');
    setTheme('arctic', 'dark');
    expect(getTheme()).toBe('arctic-dark');
  });
});

describe('getTheme', () => {
  it('未设置时返回 null', () => {
    expect(getTheme()).toBeNull();
  });
});
