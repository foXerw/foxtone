import { tokens } from 'foxtone';

/** 返回 foxtone 的 var(--fox-*) 常量树（静态常量，无需 context） */
export function useTokens(): typeof tokens {
  return tokens;
}
