import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import type { Account, Category, Budget } from './schema';

// Account hooks
export function useAccounts(options?: { categoryId?: number }) {
  return useLiveQuery(async () => {
    let query = db.accounts.orderBy('createdAt');
    if (options?.categoryId) {
      query = query.filter(account => account.categoryId === options.categoryId);
    }
    return await query.toArray();
  }, [options?.categoryId]);
}

export function useAccount(id: number) {
  return useLiveQuery(
    () => db.accounts.get(id),
    [id]
  );
}

// Category hooks
export function useCategories(options?: { type?: 'income' | 'expense' }) {
  return useLiveQuery(async () => {
    let query = db.categories.orderBy('name');
    if (options?.type) {
      query = query.filter(category => category.type === options.type);
    }
    return await query.toArray();
  }, [options?.type]);
}

export function useCategory(id: number) {
  return useLiveQuery(
    () => db.categories.get(id),
    [id]
  );
}

// Budget hooks
export function useBudgets(options?: { categoryId?: number; currentPeriod?: boolean }) {
  return useLiveQuery(async () => {
    let query = db.budgets.orderBy('periodStart');
    
    if (options?.categoryId) {
      query = query.filter(budget => budget.categoryId === options.categoryId);
    }
    
    if (options?.currentPeriod) {
      const now = new Date();
      query = query.filter(budget => 
        budget.periodStart <= now && budget.periodEnd >= now
      );
    }
    
    return await query.toArray();
  }, [options?.categoryId, options?.currentPeriod]);
}

export function useBudget(id: number) {
  return useLiveQuery(
    () => db.budgets.get(id),
    [id]
  );
}

// Database operations
export async function addAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db.accounts.add(account as Account);
}

export async function updateAccount(id: number, account: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>) {
  return await db.accounts.update(id, account);
}

export async function deleteAccount(id: number) {
  return await db.accounts.delete(id);
}

export async function addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db.categories.add(category as Category);
}

export async function updateCategory(id: number, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) {
  return await db.categories.update(id, category);
}

export async function deleteCategory(id: number) {
  return await db.categories.delete(id);
}

export async function addBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db.budgets.add(budget as Budget);
}

export async function updateBudget(id: number, budget: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>) {
  return await db.budgets.update(id, budget);
}

export async function deleteBudget(id: number) {
  return await db.budgets.delete(id);
}

// Backup operations
export async function exportDatabase() {
  return await db.exportData();
}

export async function importDatabase(data: Parameters<typeof db.importData>[0]) {
  return await db.importData(data);
}

export async function resetDatabase() {
  return await db.resetDatabase();
} 