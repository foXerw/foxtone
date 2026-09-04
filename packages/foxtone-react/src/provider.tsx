import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setTheme, brandNames, modes, type BrandName, type Mode, type ThemeName } from 'foxtone';

/** useTheme 返回的主题控制器 */
export interface ThemeController {
  brand: BrandName;
  /** 生效模式：跟随系统时由 systemDark 决定，否则为手动选择的模式 */
  mode: Mode;
  followSystem: boolean;
  systemDark: boolean;
  themeName: ThemeName;
  setBrand: (brand: BrandName) => void;
  setMode: (mode: Mode) => void;
  setFollowSystem: (follow: boolean) => void;
  toggleMode: () => void;
}

export const FoxThemeContext = createContext<ThemeController | null>(null);

interface FoxThemeProviderProps {
  /** 传入则持久化 {brand, mode, followSystem} 到 localStorage；不传则不持久化 */
  storageKey?: string;
  defaultBrand?: BrandName;
  defaultMode?: Mode;
  defaultFollowSystem?: boolean;
  children: ReactNode;
}

/** 从 localStorage 读取已存主题状态；校验字段合法性，非法值回退 undefined（由调用方走默认值） */
function loadStored(key: string): {
  brand?: BrandName;
  mode?: Mode;
  followSystem?: boolean;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { brand?: unknown; mode?: unknown; followSystem?: unknown };
    return {
      brand: brandNames.includes(parsed.brand as BrandName) ? (parsed.brand as BrandName) : undefined,
      mode: modes.includes(parsed.mode as Mode) ? (parsed.mode as Mode) : undefined,
      followSystem: typeof parsed.followSystem === 'boolean' ? parsed.followSystem : undefined,
    };
  } catch {
    return null;
  }
}

export function FoxThemeProvider({
  storageKey,
  defaultBrand = 'foxtone',
  defaultMode = 'light',
  defaultFollowSystem = false,
  children,
}: FoxThemeProviderProps) {
  const [initial] = useState(() => (storageKey ? loadStored(storageKey) : null));
  const [brand, setBrand] = useState<BrandName>(initial?.brand ?? defaultBrand);
  const [mode, setMode] = useState<Mode>(initial?.mode ?? defaultMode);
  const [followSystem, setFollowSystem] = useState(initial?.followSystem ?? defaultFollowSystem);
  const [systemDark, setSystemDark] = useState(false);

  // 跟随系统：开启时订阅系统配色
  useEffect(() => {
    if (!followSystem) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [followSystem]);

  const resolvedMode: Mode = followSystem ? (systemDark ? 'dark' : 'light') : mode;
  const themeName = `${brand}-${resolvedMode}` as ThemeName;

  // 品牌/模式 → data-fox-theme
  useEffect(() => {
    setTheme(brand, resolvedMode);
  }, [brand, resolvedMode]);

  // 持久化（opt-in）
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ brand, mode, followSystem }));
    } catch {
      /* 写失败（隐私模式等）忽略 */
    }
  }, [storageKey, brand, mode, followSystem]);

  const toggleMode = useCallback(() => {
    if (followSystem) return;
    setMode((m) => (m === 'light' ? 'dark' : 'light'));
  }, [followSystem]);

  const value = useMemo<ThemeController>(
    () => ({
      brand,
      mode: resolvedMode,
      followSystem,
      systemDark,
      themeName,
      setBrand,
      setMode,
      setFollowSystem,
      toggleMode,
    }),
    [brand, resolvedMode, followSystem, systemDark, themeName, toggleMode],
  );

  return <FoxThemeContext.Provider value={value}>{children}</FoxThemeContext.Provider>;
}
