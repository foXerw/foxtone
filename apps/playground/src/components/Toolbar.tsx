import { brandNames, modes, useTheme, type BrandName, type Mode } from 'foxtone-react';

export function Toolbar() {
  const { brand, mode, followSystem, setBrand, setMode, setFollowSystem } = useTheme();
  return (
    <header className="toolbar">
      <span className="toolbar-logo">🦊 foxtone</span>
      <div className="toolbar-controls">
        <label>
          品牌
          <select value={brand} onChange={(e) => setBrand(e.target.value as BrandName)}>
            {brandNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          模式
          <select value={mode} disabled={followSystem} onChange={(e) => setMode(e.target.value as Mode)}>
            {modes.map((m) => (
              <option key={m} value={m}>{m === 'light' ? '亮色' : '暗色'}</option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={followSystem}
            onChange={(e) => setFollowSystem(e.target.checked)}
          />
          跟随系统
        </label>
      </div>
    </header>
  );
}
