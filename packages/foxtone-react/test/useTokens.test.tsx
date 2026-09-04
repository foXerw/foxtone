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
