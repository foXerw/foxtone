import { useTheme } from 'foxtone-react';
import { Toolbar } from './components/Toolbar';
import { ColorGallery } from './components/ColorGallery';
import { ScalesGallery } from './components/ScalesGallery';
import { ThemeLab } from './components/ThemeLab';
import { QuickStart } from './components/QuickStart';

export default function App() {
  const { themeName } = useTheme();
  return (
    <div className="page">
      <Toolbar />
      <main className="content">
        <ColorGallery themeKey={themeName} />
        <ScalesGallery />
        <ThemeLab />
        <QuickStart />
      </main>
      <footer className="footer">foxtone · 设计令牌系统</footer>
    </div>
  );
}
