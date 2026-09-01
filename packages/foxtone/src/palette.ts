import { converter, formatHex } from 'culori';

const toOklch = converter('oklch');

/** 色阶档位（与设计系统通用的 50~950 对齐） */
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
type Step = (typeof STEPS)[number];

/** 每档目标亮度（OKLCH L），严格单调递减 */
const LIGHTNESS: Record<Step, number> = {
  50: 0.97, 100: 0.94, 200: 0.89, 300: 0.83, 400: 0.76, 500: 0.68,
  600: 0.6, 700: 0.52, 800: 0.44, 900: 0.36, 950: 0.24,
};

/** 每档饱和度系数：两端降低，避免极亮/极暗档色彩溢出 */
const CHROMA: Record<Step, number> = {
  50: 0.35, 100: 0.5, 200: 0.65, 300: 0.8, 400: 0.9, 500: 1,
  600: 0.95, 700: 0.85, 800: 0.7, 900: 0.55, 950: 0.4,
};

/** 从一个品牌色派生完整的 50~950 色阶（OKLCH，亮度严格单调） */
export function paletteFromColor(color: string): Record<string, string> {
  const base = toOklch(color);
  if (!base) throw new Error(`foxtone: 无法解析颜色 "${color}"`);
  const hue = base.h ?? 0;
  // 饱和度过低会发灰、过高会溢出 sRGB，夹在合理区间
  const chroma = Math.min(Math.max(base.c ?? 0.12, 0.06), 0.19);
  const scale: Record<string, string> = {};
  for (const step of STEPS) {
    scale[String(step)] = formatHex({
      mode: 'oklch',
      l: LIGHTNESS[step],
      c: chroma * CHROMA[step],
      h: hue,
    })!;
  }
  return scale;
}
