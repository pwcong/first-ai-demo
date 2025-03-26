'use client';

import { useState, useEffect } from 'react';
import {
  useAccounts,
  useCategories,
  addCategory,
  addAccount,
  resetDatabase,
  type Category,
  type Account
} from '@/lib/db';

const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Salary', type: 'income', icon: '💰' },
  { name: 'Investment', type: 'income', icon: '📈' },
  { name: 'Food', type: 'expense', icon: '🍔' },
  { name: 'Transport', type: 'expense', icon: '🚗' }
];

export default function TestDB() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initializationStatus, setInitializationStatus] = useState<{
    categories: boolean;
    accounts: boolean;
  }>({
    categories: false,
    accounts: false
  });

  const accounts = useAccounts();
  const categories = useCategories();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setError(null);
        // Reset database to start fresh
        await resetDatabase();
        console.log('Database reset successfully');

        // Add categories
        const categoryIds = await Promise.all(
          defaultCategories.map(category => addCategory(category))
        );
        console.log('Categories added successfully:', categoryIds);
        setInitializationStatus(prev => ({ ...prev, categories: true }));

        // Verify categories were added
        if (categoryIds.some((id: number | null) => !id)) {
          throw new Error('Failed to add some categories');
        }

        // Add some test transactions
        const accountPromises = [
          addAccount({
            amount: 5000,
            type: 'income',
            categoryId: categoryIds[0] as number,
            description: 'Monthly salary'
          }),
          addAccount({
            amount: 1000,
            type: 'income',
            categoryId: categoryIds[1] as number,
            description: 'Stock dividends'
          }),
          addAccount({
            amount: -300,
            type: 'expense',
            categoryId: categoryIds[2] as number,
            description: 'Grocery shopping'
          }),
          addAccount({
            amount: -50,
            type: 'expense',
            categoryId: categoryIds[3] as number,
            description: 'Bus fare'
          })
        ];

        const accountIds = await Promise.all(accountPromises);
        console.log('Accounts added successfully:', accountIds);
        setInitializationStatus(prev => ({ ...prev, accounts: true }));

        // Verify accounts were added
        if (accountIds.some((id: number | null) => !id)) {
          throw new Error('Failed to add some accounts');
        }

      } catch (error) {
        console.error('Failed to initialize test data:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          <div>Initializing database...</div>
          <div className="text-sm text-gray-500">
            {initializationStatus.categories ? '✅' : '⏳'} Categories
          </div>
          <div className="text-sm text-gray-500">
            {initializationStatus.accounts ? '✅' : '⏳'} Accounts
          </div>
        </div>
      </div>
    );
  }

  // Verify data is loaded
  if (!categories || !accounts) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Warning: </strong>
          <span className="block sm:inline">Data not loaded yet. Please refresh the page.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Database Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Categories ({categories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category: Category) => (
            <div
              key={category.id}
              className="p-4 border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                <span className="ml-auto px-2 py-1 rounded-full text-sm bg-gray-100">
                  {category.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Accounts ({accounts.length})
        </h2>
        <div className="space-y-4">
          {accounts.map((account: Account) => {
            const category = categories.find((c: Category) => c.id === account.categoryId);
            return (
              <div
                key={account.id}
                className="p-4 border rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category?.icon}</span>
                  <div>
                    <div className="font-medium">{account.description}</div>
                    <div className="text-sm text-gray-500">
                      {category?.name} • {new Date(account.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`ml-auto font-medium ${account.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {account.type === 'income' ? '+' : ''}{account.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 