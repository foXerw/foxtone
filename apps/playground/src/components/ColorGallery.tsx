import { useEffect, useState } from 'react';
import { semanticColorTokens } from 'foxtone';
import tokensJson from 'foxtone/tokens.json';

const PALETTES = ['orange', 'gray', 'green', 'amber', 'red', 'sky'] as const;

/** 实时读取某个 --fox-* 变量的当前计算值 */
function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--fox-${name}`).trim();
}

export function ColorGallery({ themeKey }: { themeKey: string }) {
  const [values, setValues] = useState<Record<string, string>>({});

  // 主题切换后下一帧重新取样，保证数值与色块同步
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setValues(Object.fromEntries(semanticColorTokens.map((name) => [name, readVar(name)])));
    });
    return () => cancelAnimationFrame(id);
  }, [themeKey]);

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
              <span className="swatch-value">{values[name] ?? '…'}</span>
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
