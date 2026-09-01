import tokensJson from 'foxtone/tokens.json';

const SPACES = Object.entries(tokensJson.primitive.space).filter(([step]) => step !== '0');
const RADII = Object.entries(tokensJson.primitive.radius).filter(([name]) => name !== 'none');
const SHADOWS = Object.entries(tokensJson.primitive.shadow);
const FONT_SIZES = Object.entries(tokensJson.primitive.font.size);
const DURATIONS = Object.entries(tokensJson.primitive.motion.duration);

export function ScalesGallery() {
  return (
    <section className="section">
      <h2>刻度</h2>

      <h3>间距</h3>
      <div className="scale-list">
        {SPACES.map(([step]) => (
          <div className="scale-row" key={step}>
            <code>space-{step}</code>
            <div className="space-bar" style={{ width: `var(--fox-space-${step})` }} />
          </div>
        ))}
      </div>

      <h3>字号</h3>
      {FONT_SIZES.map(([step]) => (
        <p key={step} style={{ fontSize: `var(--fox-font-size-${step})`, margin: 'var(--fox-space-1) 0' }}>
          font-size-{step} · 设计令牌让界面保持一致
        </p>
      ))}

      <h3>圆角与阴影</h3>
      <div className="card-grid">
        {RADII.map(([name]) => (
          <div className="demo-card" key={name} style={{ borderRadius: `var(--fox-radius-${name})` }}>
            radius-{name}
          </div>
        ))}
        {SHADOWS.map(([name]) => (
          <div className="demo-card" key={name} style={{ boxShadow: `var(--fox-shadow-${name})` }}>
            shadow-{name}
          </div>
        ))}
      </div>

      <h3>动效</h3>
      <div className="motion-row">
        {DURATIONS.map(([name]) => (
          <div className="motion-item" key={name}>
            <div className="motion-dot" style={{ transitionDuration: `var(--fox-motion-duration-${name})` }} />
            <code>{name}</code>
          </div>
        ))}
      </div>
      <p className="hint">鼠标悬停圆点，感受不同 duration 的过渡差异。</p>
    </section>
  );
}
