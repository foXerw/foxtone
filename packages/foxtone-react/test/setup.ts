import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 无 globals 模式下 vitest 不注入全局 afterEach，@testing-library/react 的
// 自动 cleanup 因此不会注册；这里显式注册，保证每个用例之间 DOM 隔离。
afterEach(() => {
  cleanup();
});
