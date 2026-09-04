export { FoxThemeProvider, type ThemeController } from './provider.js';
export { useTheme } from './useTheme.js';
export { useTokens } from './useTokens.js';
export { useTokenValue } from './useTokenValue.js';

// 重导出 foxtone 的类型与常量，方便单包导入（不重导出运行时 API）
export { tokens, brandNames, modes, themeNames, semanticColorTokens } from 'foxtone';
export type {
  BrandName,
  Mode,
  ThemeName,
  SemanticTokenName,
  TokenOverrides,
} from 'foxtone';
