import { useEffect, useState } from 'react';
import { useTheme } from './useTheme.js';

/** 读取某个 --fox-* 变量的浏览器计算值；themeName 变化后下一帧重新取样 */
export function useTokenValue(name: string): string {
  const { themeName } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue(`--fox-${name}`)
        .trim();
      setValue(v);
    });
    return () => cancelAnimationFrame(id);
  }, [themeName, name]);

  return value;
}
