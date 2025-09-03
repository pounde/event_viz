import { useState, useCallback } from 'react';
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '../utils/errorHandler';
import toast from 'react-hot-toast';

interface UseErrorHandlerOptions {
  defaultSeverity?: ErrorSeverity;
  defaultCategory?: ErrorCategory;
  showToast?: boolean;
}

interface ErrorState {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [lastError, setLastError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const errorHandler = new ErrorHandler({
    logFunction: (error) => {
      setLastError({
        message: error.message,
        severity: error.severity,
        category: error.category,
        timestamp: error.timestamp,
      });

      // Show toast notification for errors
      if (options.showToast !== false) {
        switch (error.severity) {
          case ErrorSeverity.CRITICAL:
          case ErrorSeverity.ERROR:
            toast.error(error.message);
            break;
          case ErrorSeverity.WARNING:
            toast(error.message, { icon: '⚠️' });
            break;
          case ErrorSeverity.INFO:
            toast(error.message, { icon: 'ℹ️' });
            break;
        }
      }
    },
  });

  const handleError = useCallback(
    (error: Error | any, context?: any) => {
      errorHandler.handleError(error, {
        severity: options.defaultSeverity,
        category: options.defaultCategory,
        context,
      });
    },
    [options.defaultSeverity, options.defaultCategory]
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const withErrorHandling = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T | undefined> => {
      setIsLoading(true);
      try {
        const result = await asyncFn();
        return result;
      } catch (error) {
        handleError(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  return {
    lastError,
    hasError: lastError !== null,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
  };
}