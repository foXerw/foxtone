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
          <button onClick={() => setBrand('arctic')}>to-arctic</button>
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
    fireEvent.click(screen.getByText('to-arctic'));
    await waitFor(() => expect(readCount).toBeGreaterThan(before));
  });
});
