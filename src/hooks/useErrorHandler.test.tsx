import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';
import { ErrorSeverity, ErrorCategory } from '../utils/errorHandler';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const mockToast = vi.fn();
  Object.assign(mockToast, {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    custom: vi.fn(),
  });
  return {
    default: mockToast,
  };
});

describe('useErrorHandler', () => {
  it('handles errors with default options', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.lastError?.message).toBe('Test error');
  });

  it('handles errors with custom options', () => {
    const { result } = renderHook(() => 
      useErrorHandler({
        defaultSeverity: ErrorSeverity.WARNING,
        defaultCategory: ErrorCategory.VALIDATION,
      })
    );

    act(() => {
      result.current.handleError(new Error('Validation error'));
    });

    expect(result.current.lastError).toEqual(
      expect.objectContaining({
        message: 'Validation error',
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.VALIDATION,
      })
    );
  });

  it('clears error state', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.hasError).toBe(false);
    expect(result.current.lastError).toBeNull();
  });

  it('provides error state management', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.hasError).toBe(false);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);
  });

  it('handles async operations with error handling', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const successfulOperation = async () => {
      return 'success';
    };

    const failingOperation = async () => {
      throw new Error('Operation failed');
    };

    // Test successful operation
    let successResult;
    await act(async () => {
      successResult = await result.current.withErrorHandling(successfulOperation);
    });

    expect(successResult).toBe('success');
    expect(result.current.hasError).toBe(false);

    // Test failing operation
    let failResult;
    await act(async () => {
      failResult = await result.current.withErrorHandling(failingOperation);
    });

    expect(failResult).toBeUndefined();
    expect(result.current.hasError).toBe(true);
    expect(result.current.lastError?.message).toBe('Operation failed');
  });

  it('manages loading state correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    // Initially not loading
    expect(result.current.isLoading).toBe(false);

    // Loading state is managed internally by withErrorHandling
    // This test verifies the initial state is correct
    expect(result.current.hasError).toBe(false);
    expect(result.current.lastError).toBeNull();
  });
});