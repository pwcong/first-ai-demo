import { Table } from 'dexie';

export interface Account {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id?: number;
  amount: number;
  categoryId: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tables {
  accounts: Table<Account, number>;
  categories: Table<Category, number>;
  budgets: Table<Budget, number>;
} 