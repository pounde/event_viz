import { invoke } from '@tauri-apps/api/core';

interface IPCError extends Error {
  category?: string;
}

interface IPCResult<T> {
  success: boolean;
  data?: T;
  error?: IPCError;
}

export class IPCErrorHandler {
  async safeInvoke<T>(
    command: string,
    args?: Record<string, any>,
    timeout?: number,
    maxRetries: number = 1
  ): Promise<IPCResult<T>> {
    let lastError: IPCError | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.invokeWithTimeout<T>(command, args, timeout);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        lastError = this.categorizeError(error as Error);
        console.error('IPC Error', {
          command,
          args,
          attempt: attempt + 1,
          error: lastError,
        });
        
        // Don't retry on validation errors
        if (lastError.category === 'VALIDATION') {
          break;
        }
        
        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }
    
    return {
      success: false,
      error: lastError,
    };
  }

  private async invokeWithTimeout<T>(
    command: string,
    args?: Record<string, any>,
    timeout: number = 5000
  ): Promise<T> {
    return Promise.race([
      invoke<T>(command, args),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`IPC timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  private categorizeError(error: Error): IPCError {
    const message = error.message.toLowerCase();
    const ipcError = error as IPCError;
    
    if (message.includes('connection refused') || message.includes('connection')) {
      ipcError.category = 'CONNECTION';
    } else if (message.includes('access denied') || message.includes('permission')) {
      ipcError.category = 'PERMISSION';
    } else if (message.includes('invalid') || message.includes('validation')) {
      ipcError.category = 'VALIDATION';
    } else if (message.includes('timeout')) {
      ipcError.category = 'TIMEOUT';
    } else {
      ipcError.category = 'UNKNOWN';
    }
    
    return ipcError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}