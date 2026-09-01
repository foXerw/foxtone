import { useEffect, useMemo, useState } from 'react';
import { applyOverrides, resetOverrides, paletteFromColor } from 'foxtone';

export function ThemeLab() {
  const [base, setBase] = useState('#e11d48');
  const [copied, setCopied] = useState(false);
  const scale = useMemo(() => paletteFromColor(base), [base]);

  // 派生色阶 → 覆盖品牌令牌（即时全站生效）
  useEffect(() => {
    applyOverrides({
      'color-brand-bg': scale['500'],
      'color-brand-fg': '#ffffff',
      'color-brand-hover': scale['600'],
      'color-brand-active': scale['700'],
    });
  }, [scale]);

  // 离开实验室时撤销覆盖，恢复当前品牌主题
  useEffect(() => () => resetOverrides(), []);

  const exportCss = `:root {
  --fox-color-brand-bg: ${scale['500']};
  --fox-color-brand-fg: #ffffff;
  --fox-color-brand-hover: ${scale['600']};
  --fox-color-brand-active: ${scale['700']};
}`;

  async function copy() {
    await navigator.clipboard.writeText(exportCss);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="section">
      <h2>自定义主题实验室 🎨</h2>
      <p className="hint">
        选一个品牌色，paletteFromColor 派生整套色阶并即时覆盖全站品牌色（观察顶栏与按钮）。
      </p>
      <div className="lab-controls">
        <input type="color" value={base} onChange={(e) => setBase(e.target.value)} />
        <code>{base}</code>
        <button className="btn" onClick={copy}>{copied ? '已复制 ✓' : '导出 CSS'}</button>
        <button className="btn btn-secondary" onClick={() => resetOverrides()}>重置</button>
      </div>
      <div className="palette-row">
        {Object.entries(scale).map(([step, hex]) => (
          <span key={step} className="palette-step" style={{ background: hex }} title={`${step} ${hex}`}>
            {step}
          </span>
        ))}
      </div>
      <pre className="code-block">{exportCss}</pre>
    </section>
  );
}
