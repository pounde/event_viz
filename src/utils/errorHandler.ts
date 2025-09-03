export enum ErrorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  IPC = 'IPC',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface ErrorLog {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  stack?: string;
  context?: ErrorContext;
  additionalInfo?: any;
  recoverySuggestions?: string[];
}

interface ErrorHandlerOptions {
  logFunction?: (error: ErrorLog) => void;
  enableConsoleLogging?: boolean;
}

export class ErrorHandler {
  private logFunction: (error: ErrorLog) => void;
  private enableConsoleLogging: boolean;

  constructor(options: ErrorHandlerOptions = {}) {
    this.logFunction = options.logFunction || this.defaultLogFunction;
    this.enableConsoleLogging = options.enableConsoleLogging ?? true;
  }

  private defaultLogFunction(error: ErrorLog): void {
    console.error('[ErrorHandler]', error);
  }

  handleError(
    error: Error | any,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: ErrorContext;
    }
  ): void {
    const errorLog: ErrorLog = {
      message: this.sanitizeMessage(error?.message || String(error)),
      severity: options?.severity || this.assessSeverity(error),
      category: options?.category || this.categorizeError(error),
      timestamp: new Date(),
      stack: error?.stack,
      context: options?.context,
      recoverySuggestions: this.getRecoverySuggestions(options?.category || this.categorizeError(error)),
    };

    if (!(error instanceof Error)) {
      errorLog.additionalInfo = error;
    }

    this.logFunction(errorLog);

    if (this.enableConsoleLogging) {
      console.error(errorLog);
    }
  }

  private sanitizeMessage(message: string): string {
    // Remove sensitive information patterns
    const patterns = [
      /password=\S+/gi,
      /secret\d+=\S+/gi,
      /api_key=\S+/gi,
      /token=\S+/gi,
    ];

    let sanitized = message;
    patterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  private categorizeError(error: Error | any): ErrorCategory {
    const message = error?.message || String(error);
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('failed to fetch') ||
      lowerMessage.includes('network') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')
    ) {
      return ErrorCategory.NETWORK;
    }

    if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('validation') ||
      lowerMessage.includes('required')
    ) {
      return ErrorCategory.VALIDATION;
    }

    if (
      lowerMessage.includes('ipc') ||
      lowerMessage.includes('tauri') ||
      lowerMessage.includes('backend')
    ) {
      return ErrorCategory.IPC;
    }

    return ErrorCategory.UNKNOWN;
  }

  private assessSeverity(error: Error | any): ErrorSeverity {
    const message = error?.message || String(error);
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }

    if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated')) {
      return ErrorSeverity.WARNING;
    }

    if (lowerMessage.includes('info') || lowerMessage.includes('notice')) {
      return ErrorSeverity.INFO;
    }

    return ErrorSeverity.ERROR;
  }

  private getRecoverySuggestions(category: ErrorCategory): string[] {
    switch (category) {
      case ErrorCategory.NETWORK:
        return [
          'Check internet connection',
          'Retry the request',
          'Verify server availability',
        ];
      case ErrorCategory.VALIDATION:
        return [
          'Validate input format',
          'Check required fields',
          'Review input constraints',
        ];
      case ErrorCategory.IPC:
        return [
          'Restart the application',
          'Check backend service',
          'Verify permissions',
        ];
      default:
        return ['Contact support if issue persists'];
    }
  }
}