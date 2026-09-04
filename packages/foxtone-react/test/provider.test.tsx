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

  it('损坏的 localStorage 值回退到默认主题', () => {
    window.localStorage.setItem(
      'test-theme',
      JSON.stringify({ brand: 'nope', mode: 'sepia', followSystem: 'yes' }),
    );
    mount({ storageKey: 'test-theme' });
    expect(screen.getByTestId('brand').textContent).toBe('foxtone');
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('follow').textContent).toBe('false');
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
