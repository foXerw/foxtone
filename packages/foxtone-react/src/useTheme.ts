import { useContext } from 'react';
import { FoxThemeContext, type ThemeController } from './provider.js';

/** 读取当前主题状态与 setter；必须在 <FoxThemeProvider> 内使用 */
export function useTheme(): ThemeController {
  const ctx = useContext(FoxThemeContext);
  if (!ctx) throw new Error('foxtone-react: useTheme 必须在 <FoxThemeProvider> 内使用');
  return ctx;
}
