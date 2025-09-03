import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler, ErrorSeverity, ErrorCategory } from './errorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockLogFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogFn = vi.fn();
    errorHandler = new ErrorHandler({
      logFunction: mockLogFn,
      enableConsoleLogging: false,
    });
  });

  describe('handleError', () => {
    it('handles basic error with minimal information', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error);

      expect(mockLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.UNKNOWN,
          timestamp: expect.any(Date),
        })
      );
    });

    it('handles error with full context', () => {
      const error = new Error('Network error');
      const context = {
        userId: '123',
        action: 'fetch_data',
        metadata: { endpoint: '/api/data' },
      };

      errorHandler.handleError(error, {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.NETWORK,
        context,
      });

      expect(mockLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Network error',
          severity: ErrorSeverity.CRITICAL,
          category: ErrorCategory.NETWORK,
          context,
          stack: expect.stringContaining('Error: Network error'),
        })
      );
    });

    it('sanitizes sensitive information from error messages', () => {
      const error = new Error('Database connection failed: password=secret123');
      
      errorHandler.handleError(error);

      expect(mockLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('[REDACTED]'),
        })
      );
      
      expect(mockLogFn).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('secret123'),
        })
      );
    });

    it('handles non-Error objects', () => {
      const errorObj = { message: 'Custom error', code: 500 };
      
      errorHandler.handleError(errorObj as any);

      expect(mockLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom error',
          additionalInfo: { message: 'Custom error', code: 500 },
        })
      );
    });
  });

  describe('error categorization', () => {
    it('categorizes network errors', () => {
      const networkErrors = [
        'Failed to fetch',
        'Network request failed',
        'Connection timeout',
      ];

      networkErrors.forEach(message => {
        errorHandler.handleError(new Error(message));
        expect(mockLogFn).toHaveBeenLastCalledWith(
          expect.objectContaining({
            category: ErrorCategory.NETWORK,
          })
        );
      });
    });

    it('categorizes validation errors', () => {
      const validationErrors = [
        'Invalid input',
        'Validation failed',
        'Required field missing',
      ];

      validationErrors.forEach(message => {
        errorHandler.handleError(new Error(message));
        expect(mockLogFn).toHaveBeenLastCalledWith(
          expect.objectContaining({
            category: ErrorCategory.VALIDATION,
          })
        );
      });
    });

    it('categorizes IPC errors', () => {
      const ipcErrors = [
        'IPC command failed',
        'Tauri invoke error',
        'Backend communication error',
      ];

      ipcErrors.forEach(message => {
        errorHandler.handleError(new Error(message));
        expect(mockLogFn).toHaveBeenLastCalledWith(
          expect.objectContaining({
            category: ErrorCategory.IPC,
          })
        );
      });
    });
  });

  describe('error recovery suggestions', () => {
    it('provides recovery suggestions for network errors', () => {
      const error = new Error('Network request failed');
      
      errorHandler.handleError(error);

      expect(mockLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          recoverySuggestions: expect.arrayContaining([
            'Check internet connection',
            'Retry the request',
            'Verify server availability',
          ]),
        })
      );
    });

    it('provides recovery suggestions for validation errors', () => {
      const error = new Error('Invalid input format');
      
      errorHandler.handleError(error);

      expect(mockLogFn).toHaveBeenCalledWith(
        expect.objectContaining({
          recoverySuggestions: expect.arrayContaining([
            'Validate input format',
            'Check required fields',
            'Review input constraints',
          ]),
        })
      );
    });
  });
});