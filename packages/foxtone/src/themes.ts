import type { BrandName, Mode, ThemeName } from './generated/tokens.js';

/** 主题挂载在 <html> 的这个属性上，与构建产物中的选择器保持一致 */
const THEME_ATTR = 'data-fox-theme';

/** 切换主题：设置 document 根元素的 data-fox-theme 属性（持久化由应用自行处理） */
export function setTheme(brand: BrandName, mode: Mode): void {
  document.documentElement.setAttribute(THEME_ATTR, `${brand}-${mode}`);
}

/** 读取当前主题；未设置返回 null */
export function getTheme(): ThemeName | null {
  return document.documentElement.getAttribute(THEME_ATTR) as ThemeName | null;
}
