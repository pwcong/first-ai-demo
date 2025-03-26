// 自定义错误类型
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, public errors: unknown[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ConnectionError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'TransactionError';
  }
}

export class MigrationError extends DatabaseError {
  constructor(message: string, public version: number, cause?: Error) {
    super(message, cause);
    this.name = 'MigrationError';
  }
}

// 错误处理工具函数
export function handleDatabaseError(error: unknown): never {
  if (error instanceof DatabaseError) {
    throw error;
  }

  if (error instanceof Error) {
    if (error.name === 'VersionError') {
      throw new MigrationError('Database version mismatch', 0, error);
    }
    if (error.name === 'InvalidStateError') {
      throw new ConnectionError('Database connection error', error);
    }
    throw new DatabaseError('Unexpected database error', error);
  }

  throw new DatabaseError('Unknown error occurred');
}

// 重试机制
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    shouldRetry = (error) => !(error instanceof ValidationError),
  } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !shouldRetry(error)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw handleDatabaseError(lastError);
}

// 事务重试包装器
export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delayMs?: number;
  }
): Promise<T> {
  return withRetry(operation, {
    ...options,
    shouldRetry: (error) =>
      error instanceof TransactionError ||
      (error instanceof Error && error.name === 'TransactionInactiveError'),
  });
} 