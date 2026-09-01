import { brandNames, modes, type BrandName, type Mode } from 'foxtone';

interface Props {
  brand: BrandName;
  mode: Mode;
  followSystem: boolean;
  onBrandChange: (brand: BrandName) => void;
  onModeChange: (mode: Mode) => void;
  onFollowSystemChange: (follow: boolean) => void;
}

export function Toolbar({ brand, mode, followSystem, onBrandChange, onModeChange, onFollowSystemChange }: Props) {
  return (
    <header className="toolbar">
      <span className="toolbar-logo">🦊 foxtone</span>
      <div className="toolbar-controls">
        <label>
          品牌
          <select value={brand} onChange={(e) => onBrandChange(e.target.value as BrandName)}>
            {brandNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          模式
          <select value={mode} disabled={followSystem} onChange={(e) => onModeChange(e.target.value as Mode)}>
            {modes.map((m) => (
              <option key={m} value={m}>{m === 'light' ? '亮色' : '暗色'}</option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={followSystem}
            onChange={(e) => onFollowSystemChange(e.target.checked)}
          />
          跟随系统
        </label>
      </div>
    </header>
  );
}
