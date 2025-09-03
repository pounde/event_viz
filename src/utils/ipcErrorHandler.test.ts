import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IPCErrorHandler } from './ipcErrorHandler';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('IPCErrorHandler', () => {
  let ipcErrorHandler: IPCErrorHandler;

  beforeEach(() => {
    ipcErrorHandler = new IPCErrorHandler();
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('safe invoke operations', () => {
    it('handles successful IPC calls', async () => {
      const expectedResult = { data: 'test' };
      mockInvoke.mockResolvedValueOnce(expectedResult);

      const result = await ipcErrorHandler.safeInvoke('test_command', { param: 'value' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedResult);
      expect(result.error).toBeUndefined();
    });

    it('handles IPC call failures', async () => {
      const error = new Error('Backend error');
      mockInvoke.mockRejectedValueOnce(error);

      const result = await ipcErrorHandler.safeInvoke('failing_command');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Backend error');
      expect(result.data).toBeUndefined();
    });

    it('handles timeout scenarios', async () => {
      mockInvoke.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await ipcErrorHandler.safeInvoke('slow_command', {}, 100);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });

    it('retries failed operations', async () => {
      mockInvoke
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({ success: true });

      const result = await ipcErrorHandler.safeInvoke('retry_command', {}, 5000, 3);

      expect(mockInvoke).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true });
    });

    it('fails after maximum retries', async () => {
      const error = new Error('Persistent failure');
      mockInvoke.mockRejectedValue(error);

      const result = await ipcErrorHandler.safeInvoke('failing_command', {}, 5000, 2);

      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Persistent failure');
    });

    it('does not retry validation errors', async () => {
      const validationError = new Error('Invalid parameters');
      mockInvoke.mockRejectedValue(validationError);

      const result = await ipcErrorHandler.safeInvoke('validate_command', {}, 5000, 3);

      expect(mockInvoke).toHaveBeenCalledTimes(1); // No retries for validation errors
      expect(result.success).toBe(false);
      expect(result.error?.category).toBe('VALIDATION');
    });
  });

  describe('error categorization', () => {
    it('categorizes connection errors', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await ipcErrorHandler.safeInvoke('test_command');

      expect(result.error?.category).toBe('CONNECTION');
    });

    it('categorizes permission errors', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Access denied'));

      const result = await ipcErrorHandler.safeInvoke('test_command');

      expect(result.error?.category).toBe('PERMISSION');
    });

    it('categorizes validation errors', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Invalid parameters'));

      const result = await ipcErrorHandler.safeInvoke('test_command');

      expect(result.error?.category).toBe('VALIDATION');
    });

    it('categorizes timeout errors', async () => {
      mockInvoke.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await ipcErrorHandler.safeInvoke('test_command', {}, 100);

      expect(result.error?.category).toBe('TIMEOUT');
    });
  });

  describe('error logging', () => {
    it('logs errors with context', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockInvoke.mockRejectedValueOnce(new Error('Test error'));

      await ipcErrorHandler.safeInvoke('test_command', { userId: '123' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'IPC Error',
        expect.objectContaining({
          command: 'test_command',
          args: { userId: '123' },
          attempt: 1,
        })
      );
    });

    it('logs retry attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      mockInvoke
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ success: true });

      await ipcErrorHandler.safeInvoke('retry_command', {}, 5000, 2);

      expect(consoleSpy).toHaveBeenCalledWith(
        'IPC Error',
        expect.objectContaining({
          attempt: 1,
        })
      );
    });
  });
});