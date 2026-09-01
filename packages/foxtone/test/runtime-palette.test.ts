import { describe, it, expect } from 'vitest';
import { converter } from 'culori';
import { paletteFromColor } from '../src/palette.js';

const toOklch = converter('oklch');
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

describe('paletteFromColor', () => {
  it('输出完整 11 档色阶，均为 6 位 hex', () => {
    const palette = paletteFromColor('#f97316');
    for (const step of STEPS) {
      expect(palette[step], `缺少档位 ${step}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('亮度（OKLCH L）严格单调递减', () => {
    const palette = paletteFromColor('#f97316');
    const lightness = STEPS.map((step) => toOklch(palette[step])!.l!);
    for (let i = 1; i < lightness.length; i++) {
      expect(lightness[i], `${STEPS[i]} 应比 ${STEPS[i - 1]} 暗`).toBeLessThan(lightness[i - 1]);
    }
  });

  it('保留输入颜色的色相', () => {
    const palette = paletteFromColor('#f97316');
    const inputHue = toOklch('#f97316')!.h!;
    const midHue = toOklch(palette['500'])!.h!;
    expect(Math.abs(midHue - inputHue)).toBeLessThan(5);
  });

  it('非法颜色抛出带提示的错误', () => {
    expect(() => paletteFromColor('不是颜色')).toThrow(/无法解析颜色/);
  });
});
