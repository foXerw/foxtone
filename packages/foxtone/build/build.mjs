/**
 * foxtone 令牌构建脚本
 * 输入: tokens 下的 *.json（W3C DTCG）
 * 输出: dist/css/、dist/tokens.json、src/generated/tokens.ts
 */
import StyleDictionary from 'style-dictionary';
import { readdirSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const tmpDir = join(distDir, '_tmp');

/** 路径 → CSS 变量名（不含 -- 前缀）：去掉 primitive 段，spacing 缩写为 space */
function foxName(path) {
  const p = [...path];
  if (p[0] === 'primitive') p.shift();
  if (p[0] === 'spacing') p[0] = 'space';
  return `fox-${p.join('-')}`;
}

/** 扁平格式：{ "a.b.c": 解析后的值 }，供后续组装 */
const flatFormat = ({ dictionary }) =>
  JSON.stringify(
    Object.fromEntries(dictionary.allTokens.map((t) => [t.path.join('.'), t.$value ?? t.value])),
    null,
    2,
  );

const hooks = {
  transforms: { 'name/fox': { type: 'name', transform: (token) => foxName(token.path) } },
  formats: { 'fox/flat': flatFormat },
};

/** 语义层（主题文件）/ 核心层（原始刻度）的过滤器 */
const SEMANTIC_FILTER = (t) => t.path[0] === 'color';
const CORE_FILTER = (t) => t.path[0] === 'primitive' && t.path[1] !== 'color';
/** tokens.json 需要全部原始令牌（含色板）；只有 core.css 排除颜色 */
const ALL_PRIMITIVE_FILTER = (t) => t.path[0] === 'primitive';

function cssPlatform(destination, selector, filter) {
  return {
    transforms: ['name/fox', 'color/css'],
    buildPath: join(distDir, 'css') + sep,
    files: [{ destination, format: 'css/variables', filter, options: { selector } }],
  };
}

function flatPlatform(destination, filter) {
  return {
    transforms: ['name/fox'],
    buildPath: tmpDir + sep,
    files: [{ destination, format: 'fox/flat', filter }],
  };
}

// glob 模式需使用正斜杠（Windows 下 join 产生反斜杠，glob 无法匹配）
const primitiveSource = join(root, 'tokens', 'primitive', '**', '*.json').split(sep).join('/');

async function buildCore() {
  const sd = new StyleDictionary({
    source: [primitiveSource],
    hooks,
    platforms: {
      css: cssPlatform('core.css', ':root', CORE_FILTER),
      flat: flatPlatform('primitive.json', ALL_PRIMITIVE_FILTER),
    },
  });
  await sd.buildAllPlatforms();
}

async function buildTheme(themeFile, themeName) {
  const sd = new StyleDictionary({
    source: [primitiveSource, join(root, 'tokens', 'themes', themeFile).split(sep).join('/')],
    hooks,
    platforms: {
      css: cssPlatform(`themes/${themeName}.css`, `[data-fox-theme="${themeName}"]`, SEMANTIC_FILTER),
      flat: flatPlatform(`${themeName}.json`, SEMANTIC_FILTER),
    },
  });
  await sd.buildAllPlatforms();
}

/** 把扁平 { "space.4": "16px" } 还原为嵌套树（去掉 primitive 段、spacing→space） */
function nest(flat) {
  const out = {};
  for (const [path, value] of Object.entries(flat)) {
    const p = path.split('.');
    if (p[0] === 'primitive') p.shift();
    if (p[0] === 'spacing') p[0] = 'space';
    let node = out;
    for (let i = 0; i < p.length - 1; i++) node = node[p[i]] ??= {};
    node[p.at(-1)] = value;
  }
  return out;
}

/** 把嵌套树映射为 var(--fox-...) 常量树 */
function varTree(nested, prefix = []) {
  const out = {};
  for (const [key, value] of Object.entries(nested)) {
    if (typeof value === 'object' && value !== null) out[key] = varTree(value, [...prefix, key]);
    else out[key] = `var(--fox-${[...prefix, key].join('-')})`;
  }
  return out;
}

// ---------- 主流程 ----------
rmSync(distDir, { recursive: true, force: true });

const themeFiles = readdirSync(join(root, 'tokens', 'themes')).filter((f) => f.endsWith('.json'));
// 规范化顺序：品牌字母序，同品牌内 light 先于 dark（不依赖文件系统排序）
themeFiles.sort((a, b) => {
  const [brandA, modeA] = a.replace(/\.json$/, '').split('.');
  const [brandB, modeB] = b.replace(/\.json$/, '').split('.');
  if (brandA !== brandB) return brandA.localeCompare(brandB);
  return (modeA === 'light' ? 0 : 1) - (modeB === 'light' ? 0 : 1);
});
const themeNames = themeFiles.map((f) => f.replace(/\.json$/, '').replaceAll('.', '-'));

await buildCore();
for (let i = 0; i < themeFiles.length; i++) await buildTheme(themeFiles[i], themeNames[i]);

// 组装 tokens.json
const primitiveFlat = JSON.parse(readFileSync(join(tmpDir, 'primitive.json'), 'utf8'));
const themes = {};
for (const name of themeNames) {
  const flat = JSON.parse(readFileSync(join(tmpDir, `${name}.json`), 'utf8'));
  themes[name] = Object.fromEntries(
    Object.entries(flat).map(([k, v]) => [k.replaceAll('.', '-'), v]),
  );
}
writeFileSync(
  join(distDir, 'tokens.json'),
  JSON.stringify({ primitive: nest(primitiveFlat), themes }, null, 2),
);

// 生成 src/generated/tokens.ts
const brands = [...new Set(themeNames.map((n) => n.split('-')[0]))];
const modes = [...new Set(themeNames.map((n) => n.split('-').slice(1).join('-')))];
const semanticKeys = Object.keys(themes[themeNames[0]]); // 形如 color-bg-canvas
const semanticTree = {};
for (const key of semanticKeys) {
  const p = key.split('-'); // ['color','bg','canvas']
  let node = semanticTree;
  for (let i = 0; i < p.length - 1; i++) node = node[p[i]] ??= {};
  node[p.at(-1)] = `var(--fox-${key})`;
}
const tokens = { ...varTree(nest(primitiveFlat)), color: semanticTree.color };

const ts = `// 此文件由 build/build.mjs 自动生成，请勿手动修改
export const brandNames = ${JSON.stringify(brands)} as const;
export type BrandName = (typeof brandNames)[number];

export const modes = ${JSON.stringify(modes)} as const;
export type Mode = (typeof modes)[number];

export const themeNames = ${JSON.stringify(themeNames)} as const;
export type ThemeName = (typeof themeNames)[number];

export const semanticColorTokens = ${JSON.stringify(semanticKeys)} as const;
export type SemanticTokenName = (typeof semanticColorTokens)[number];

/** applyOverrides 的参数类型：语义令牌名 → 任意 CSS 颜色值 */
export type TokenOverrides = Partial<Record<SemanticTokenName, string>>;

/** var(--fox-*) 常量树，供 React 内联样式 / CSS-in-JS 使用 */
export const tokens = ${JSON.stringify(tokens, null, 2)} as const;
`;
mkdirSync(join(root, 'src', 'generated'), { recursive: true });
writeFileSync(join(root, 'src', 'generated', 'tokens.ts'), ts);

rmSync(tmpDir, { recursive: true, force: true });
console.log(`foxtone 令牌构建完成：${themeNames.join(', ')}`);
