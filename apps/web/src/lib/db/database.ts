import Dexie from 'dexie';
import type { Tables, Account, Category, Budget } from './schema';

class Database extends Dexie {
  accounts!: Tables['accounts'];
  categories!: Tables['categories'];
  budgets!: Tables['budgets'];

  constructor() {
    super('FinanceDB');

    this.version(2).stores({
      accounts: '++id, categoryId, type, createdAt, updatedAt',
      categories: '++id, name, type, createdAt, updatedAt',
      budgets: '++id, categoryId, periodStart, periodEnd, createdAt, updatedAt'
    });

    // Add hooks for automatic timestamps
    this.accounts.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.accounts.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.categories.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.categories.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });

    this.budgets.hook('creating', (primKey, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.budgets.hook('updating', (modifications, primKey, obj) => {
      return { ...modifications, updatedAt: new Date() };
    });
  }

  async resetDatabase() {
    await this.transaction('rw', this.accounts, this.categories, this.budgets, async () => {
      await Promise.all([
        this.accounts.clear(),
        this.categories.clear(),
        this.budgets.clear()
      ]);
    });
  }

  async exportData() {
    return this.transaction('r', this.accounts, this.categories, this.budgets, async () => {
      const [accounts, categories, budgets] = await Promise.all([
        this.accounts.toArray(),
        this.categories.toArray(),
        this.budgets.toArray()
      ]);

      return {
        accounts,
        categories,
        budgets,
        exportDate: new Date()
      };
    });
  }

  async importData(data: {
    accounts: Account[];
    categories: Category[];
    budgets: Budget[];
  }) {
    await this.transaction('rw', this.accounts, this.categories, this.budgets, async () => {
      await this.resetDatabase();
      await Promise.all([
        this.accounts.bulkAdd(data.accounts),
        this.categories.bulkAdd(data.categories),
        this.budgets.bulkAdd(data.budgets)
      ]);
    });
  }
}

export const db = new Database(); 