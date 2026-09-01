import { useEffect, useState } from 'react';
import { setTheme, type BrandName, type Mode } from 'foxtone';
import { Toolbar } from './components/Toolbar';
import { ColorGallery } from './components/ColorGallery';
import { ScalesGallery } from './components/ScalesGallery';
import { ThemeLab } from './components/ThemeLab';
import { QuickStart } from './components/QuickStart';

export default function App() {
  const [brand, setBrand] = useState<BrandName>('foxtone');
  const [mode, setMode] = useState<Mode>('light');
  const [followSystem, setFollowSystem] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  // 跟随系统：监听系统配色变化
  useEffect(() => {
    if (!followSystem) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [followSystem]);

  const resolvedMode: Mode = followSystem ? (systemDark ? 'dark' : 'light') : mode;

  // 品牌/模式变化 → 更新 data-fox-theme
  useEffect(() => {
    setTheme(brand, resolvedMode);
  }, [brand, resolvedMode]);

  return (
    <div className="page">
      <Toolbar
        brand={brand}
        mode={mode}
        followSystem={followSystem}
        onBrandChange={setBrand}
        onModeChange={setMode}
        onFollowSystemChange={setFollowSystem}
      />
      <main className="content">
        <ColorGallery themeKey={`${brand}-${resolvedMode}`} />
        <ScalesGallery />
        <ThemeLab />
        <QuickStart />
      </main>
      <footer className="footer">foxtone · 设计令牌系统</footer>
    </div>
  );
}
