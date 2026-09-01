const SNIPPET = `npm install foxtone

// 1. 引入样式（按需引入主题）
import 'foxtone/css/core.css';
import 'foxtone/css/themes/foxtone-light.css';

// 2. 切换主题（设置 <html data-fox-theme>）
import { setTheme } from 'foxtone';
setTheme('foxtone', 'light');`;

export function QuickStart() {
  return (
    <section className="section">
      <h2>快速上手</h2>
      <pre className="code-block">{SNIPPET}</pre>
    </section>
  );
}
