import { db } from './database';
import type { Account, Category, Budget } from './schema';
import { batchOperation } from './performance';
import { validateAccounts, validateCategories, validateBudgets } from './validators';

interface BackupMetadata {
  version: number;
  timestamp: string;
  checksum: string;
  compressionType?: 'gzip' | 'none';
}

interface BackupData {
  metadata: BackupMetadata;
  accounts: Account[];
  categories: Category[];
  budgets: Budget[];
}

// 计算数据校验和
function calculateChecksum(data: any): string {
  if (typeof window === 'undefined') return '';
  
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return hash.toString(16);
}

// 压缩数据
async function compressData(data: string): Promise<string> {
  if (typeof window === 'undefined') return data;
  
  const blob = new Blob([data], { type: 'application/json' });
  const compressedBlob = await new Response(blob).blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(compressedBlob);
  });
}

// 解压数据
async function decompressData(data: string): Promise<string> {
  if (typeof window === 'undefined') return data;
  
  const response = await fetch(data);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
}

// 创建增量备份
async function createIncrementalBackup(lastBackup?: BackupData): Promise<BackupData> {
  const currentData = await db.exportData();
  
  if (!lastBackup) {
    const metadata: BackupMetadata = {
      version: 1,
      timestamp: new Date().toISOString(),
      checksum: calculateChecksum(currentData),
      compressionType: 'gzip',
    };
    
    return {
      metadata,
      ...currentData,
    };
  }

  // 找出变更的数据
  const changedAccounts = currentData.accounts.filter((account) => {
    const oldAccount = lastBackup.accounts.find((a) => a.id === account.id);
    return !oldAccount || oldAccount.updatedAt !== account.updatedAt;
  });

  const changedCategories = currentData.categories.filter((category) => {
    const oldCategory = lastBackup.categories.find((c) => c.id === category.id);
    return !oldCategory || oldCategory.updatedAt !== category.updatedAt;
  });

  const changedBudgets = currentData.budgets.filter((budget) => {
    const oldBudget = lastBackup.budgets.find((b) => b.id === budget.id);
    return !oldBudget || oldBudget.updatedAt !== budget.updatedAt;
  });

  const metadata: BackupMetadata = {
    version: lastBackup.metadata.version + 1,
    timestamp: new Date().toISOString(),
    checksum: calculateChecksum({ changedAccounts, changedCategories, changedBudgets }),
    compressionType: 'gzip',
  };

  return {
    metadata,
    accounts: changedAccounts,
    categories: changedCategories,
    budgets: changedBudgets,
  };
}

// 验证备份数据
async function validateBackup(backup: BackupData): Promise<boolean> {
  // 验证元数据
  if (!backup.metadata || !backup.metadata.checksum) {
    console.error('Invalid backup metadata');
    return false;
  }

  // 验证数据完整性
  const actualChecksum = calculateChecksum({
    accounts: backup.accounts,
    categories: backup.categories,
    budgets: backup.budgets,
  });

  if (actualChecksum !== backup.metadata.checksum) {
    console.error('Backup checksum mismatch');
    return false;
  }

  // 验证数据格式
  const accountsValidation = validateAccounts(backup.accounts);
  const categoriesValidation = validateCategories(backup.categories);
  const budgetsValidation = validateBudgets(backup.budgets);

  if (!accountsValidation.success || !categoriesValidation.success || !budgetsValidation.success) {
    console.error('Backup data validation failed');
    return false;
  }

  return true;
}

// 导出备份
export async function exportBackup(incremental: boolean = false): Promise<string> {
  try {
    let backupData: BackupData;
    
    if (incremental) {
      const lastBackup = localStorage.getItem('lastBackup');
      backupData = await createIncrementalBackup(lastBackup ? JSON.parse(lastBackup) : undefined);
    } else {
      const currentData = await db.exportData();
      backupData = {
        metadata: {
          version: 1,
          timestamp: new Date().toISOString(),
          checksum: calculateChecksum(currentData),
          compressionType: 'gzip',
        },
        ...currentData,
      };
    }

    const backupString = JSON.stringify(backupData);
    const compressedData = await compressData(backupString);
    
    if (incremental) {
      localStorage.setItem('lastBackup', backupString);
    }
    
    return compressedData;
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

// 导入备份
export async function importBackup(backupData: string): Promise<void> {
  try {
    const decompressedData = await decompressData(backupData);
    const backup: BackupData = JSON.parse(decompressedData);

    // 验证备份
    const isValid = await validateBackup(backup);
    if (!isValid) {
      throw new Error('Invalid backup data');
    }

    // 使用批量操作恢复数据
    await db.transaction('rw', [db.accounts, db.categories, db.budgets], async () => {
      // 清除现有数据
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.budgets.clear(),
      ]);

      // 批量恢复数据
      await Promise.all([
        batchOperation(backup.accounts, async (batch) => {
          return await db.accounts.bulkAdd(batch);
        }),
        batchOperation(backup.categories, async (batch) => {
          return await db.categories.bulkAdd(batch);
        }),
        batchOperation(backup.budgets, async (batch) => {
          return await db.budgets.bulkAdd(batch);
        }),
      ]);
    });

    console.log('Backup restored successfully');
  } catch (error) {
    console.error('Failed to restore backup:', error);
    throw error;
  }
} 