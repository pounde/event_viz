import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const toastFn = vi.fn();
  toastFn.error = vi.fn();
  toastFn.success = vi.fn();
  toastFn.loading = vi.fn();
  toastFn.custom = vi.fn();
  return {
    default: toastFn,
  };
});

// Mock window.__TAURI__
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: vi.fn(),
    listen: vi.fn(),
    emit: vi.fn(),
  },
  writable: true,
});