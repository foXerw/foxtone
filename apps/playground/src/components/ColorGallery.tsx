import { semanticColorTokens, useTokenValue } from 'foxtone-react';
import tokensJson from 'foxtone/tokens.json';

const PALETTES = ['orange', 'gray', 'green', 'amber', 'red', 'sky', 'cyan', 'slate', 'yellow', 'sand', 'stone'] as const;

/** 单个色卡的取值列：用 useTokenValue 实时读取 */
function SwatchValue({ name }: { name: string }) {
  const value = useTokenValue(name);
  return <span className="swatch-value">{value || '…'}</span>;
}

export function ColorGallery({ themeKey }: { themeKey: string }) {
  return (
    <section className="section">
      <h2>语义色彩</h2>
      <p className="hint">
        当前主题 <code>{themeKey}</code> —— 切换主题时，取值列会实时联动。
      </p>
      <div className="swatch-grid">
        {semanticColorTokens.map((name) => (
          <div className="swatch-card" key={name}>
            <div className="swatch" style={{ background: `var(--fox-${name})` }} />
            <div className="swatch-meta">
              <code>{name}</code>
              <SwatchValue name={name} />
            </div>
          </div>
        ))}
      </div>

      <h3>原始调色板</h3>
      {PALETTES.map((palette) => (
        <div className="palette-row" key={palette}>
          <span className="palette-name">{palette}</span>
          {Object.entries(tokensJson.primitive.color[palette]).map(([step, hex]) => (
            <span
              key={step}
              className="palette-step"
              title={`${palette}.${step} ${hex}`}
              style={{ background: hex }}
            >
              {step}
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}
