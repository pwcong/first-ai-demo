import { db } from './database';
import type { Account } from './schema';

// 性能指标类型
interface PerformanceMetrics {
  operationType: 'read' | 'write' | 'query';
  tableName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  queryDetails?: {
    filter?: string;
    sort?: string;
    limit?: number;
  };
}

// 性能监控配置
interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number;
  slowQueryThreshold: number;
  maxMetricsCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private config: MonitoringConfig = {
    enabled: true,
    sampleRate: 0.1, // 采样率 10%
    slowQueryThreshold: 100, // 慢查询阈值（毫秒）
    maxMetricsCount: 1000, // 最大指标数量
  };

  // 记录性能指标
  async recordMetric(metric: PerformanceMetrics): Promise<void> {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return;
    }

    this.metrics.push(metric);

    // 如果超过最大数量，删除最旧的记录
    if (this.metrics.length > this.config.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsCount);
    }

    // 检查慢查询
    if (metric.duration > this.config.slowQueryThreshold) {
      console.warn('Slow query detected:', {
        ...metric,
        threshold: this.config.slowQueryThreshold,
      });
    }
  }

  // 获取性能指标统计
  getMetricsStats(): {
    avgDuration: { [key: string]: number };
    errorRate: { [key: string]: number };
    slowQueries: PerformanceMetrics[];
  } {
    const stats = {
      avgDuration: {} as { [key: string]: number },
      errorRate: {} as { [key: string]: number },
      slowQueries: [] as PerformanceMetrics[],
    };

    // 按操作类型分组计算
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      const key = `${metric.operationType}_${metric.tableName}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as { [key: string]: PerformanceMetrics[] });

    // 计算统计数据
    Object.entries(groupedMetrics).forEach(([key, metrics]) => {
      // 平均持续时间
      stats.avgDuration[key] =
        metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;

      // 错误率
      const errorCount = metrics.filter((m) => !m.success).length;
      stats.errorRate[key] = errorCount / metrics.length;
    });

    // 获取慢查询
    stats.slowQueries = this.metrics.filter(
      (m) => m.duration > this.config.slowQueryThreshold
    );

    return stats;
  }

  // 清理旧指标
  clearOldMetrics(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    this.metrics = this.metrics.filter(
      (metric) => now - metric.timestamp < maxAgeMs
    );
  }

  // 更新配置
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 获取当前配置
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

// 创建性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 性能监控装饰器
export function monitor(operationType: PerformanceMetrics['operationType'], tableName: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      let success = true;
      let error: string | undefined;

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (e) {
        success = false;
        error = e instanceof Error ? e.message : 'Unknown error';
        throw e;
      } finally {
        const duration = performance.now() - start;
        performanceMonitor.recordMetric({
          operationType,
          tableName,
          duration,
          timestamp: Date.now(),
          success,
          error,
          queryDetails: args[0]?.queryDetails,
        });
      }
    };

    return descriptor;
  };
}

// 批量操作优化
export async function batchOperation<T, R>(
  items: T[],
  operation: (items: T[]) => Promise<R | R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResult = await operation(batch);
    if (Array.isArray(batchResult)) {
      results.push(...batchResult);
    } else {
      results.push(batchResult);
    }
  }

  return results;
}

// 内存使用监控
export function monitorMemoryUsage(): void {
  if (typeof window !== 'undefined' && (window as any).performance?.memory) {
    const memory = (window as any).performance.memory;
    console.log('Memory Usage:', {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
}

// 定期清理过期数据
setInterval(() => {
  performanceMonitor.clearOldMetrics();
}, 60 * 60 * 1000); // 每小时清理一次

// 优化的查询类
export class OptimizedQueries {
  static async getAccountsByCategory(categoryId: number): Promise<Account[]> {
    const start = performance.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await db.accounts.where('categoryId').equals(categoryId).toArray();
      return result;
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric({
        operationType: 'read',
        tableName: 'accounts',
        duration,
        timestamp: Date.now(),
        success,
        error,
        queryDetails: { filter: `categoryId=${categoryId}` },
      });
    }
  }

  static async bulkAddAccounts(accounts: Partial<Account>[]): Promise<number[]> {
    const start = performance.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await batchOperation(accounts, async (batch) => {
        return await db.accounts.bulkAdd(batch as Account[], { allKeys: true });
      });
      return result;
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric({
        operationType: 'write',
        tableName: 'accounts',
        duration,
        timestamp: Date.now(),
        success,
        error,
        queryDetails: { limit: accounts.length },
      });
    }
  }
} 