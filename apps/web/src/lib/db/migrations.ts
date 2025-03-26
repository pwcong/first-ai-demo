import Dexie, { Table, Transaction } from 'dexie';
import { db } from './database';
import { MigrationError } from './errors';
import type { Account, Category } from './schema';

interface MigrationContext {
  oldVersion: number;
  newVersion: number;
  transaction: Transaction;
}

type MigrationFunction = (context: MigrationContext) => Promise<void>;

// 迁移历史记录
const migrations = new Map<number, MigrationFunction>();

// 注册迁移函数
export function registerMigration(version: number, migrationFn: MigrationFunction) {
  migrations.set(version, migrationFn);
}

// 执行迁移
export async function migrate(context: MigrationContext): Promise<void> {
  const { oldVersion, newVersion, transaction } = context;

  try {
    // 按版本顺序执行迁移
    for (let version = oldVersion + 1; version <= newVersion; version++) {
      const migration = migrations.get(version);
      if (migration) {
        await migration({ oldVersion, newVersion, transaction });
      }
    }
  } catch (error) {
    throw new MigrationError(
      `Migration failed from version ${oldVersion} to ${newVersion}`,
      newVersion,
      error instanceof Error ? error : undefined
    );
  }
}

// 迁移工具函数
export async function copyTable<T>(
  sourceTable: Table<T, number>,
  targetTable: Table<T, number>,
  transform?: (item: T) => Partial<T>
): Promise<void> {
  const items = await sourceTable.toArray();
  const transformedItems = transform
    ? items.map(item => ({ ...item, ...transform(item) }))
    : items;
  await targetTable.bulkAdd(transformedItems);
}

// 扩展的账目类型
interface ExtendedAccount extends Account {
  tags?: string[];
  status?: 'active' | 'archived';
}

// 示例迁移：添加新字段
registerMigration(2, async () => {
  await copyTable<ExtendedAccount>(
    db.accounts as unknown as Table<ExtendedAccount, number>,
    db.accounts as unknown as Table<ExtendedAccount, number>,
    (account) => ({
      tags: account.tags || [],
      status: account.status || 'active'
    })
  );
});

// 示例迁移：修改字段类型
registerMigration(3, async () => {
  await copyTable(db.categories, db.categories, (category: Category) => ({
    type: category.type
  }));
});

// 数据库版本升级钩子
db.on('versionchange', (event) => {
  const { oldVersion, newVersion } = event;
  console.log(`Database version changing from ${oldVersion} to ${newVersion}`);
});

// 数据库阻塞钩子
db.on('blocked', () => {
  console.warn('Database upgrade blocked. Please close other tabs running the app.');
});

// 数据库准备就绪钩子
db.on('ready', async () => {
  console.log('Database is ready');
}); 