import { z } from 'zod';
import type { Account, Category, Budget } from './schema';

// 基础验证器
const baseValidator = {
  id: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
};

// 账目验证器
export const accountValidator = z.object({
  ...baseValidator,
  amount: z.number().min(-999999999).max(999999999),
  type: z.enum(['income', 'expense']),
  categoryId: z.number().positive(),
  description: z.string().min(1).max(500),
});

// 分类验证器
export const categoryValidator = z.object({
  ...baseValidator,
  name: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1).max(10),
});

// 预算验证器
export const budgetValidator = z.object({
  ...baseValidator,
  amount: z.number().min(0).max(999999999),
  categoryId: z.number().positive(),
  periodStart: z.date(),
  periodEnd: z.date().superRefine((date, ctx) => {
    const data = ctx.parent as { periodStart?: Date };
    if (data.periodStart && date <= data.periodStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
      });
    }
  }),
});

// 验证函数
export function validateAccount(data: Partial<Account>): z.SafeParseReturnType<Partial<Account>, Partial<Account>> {
  return accountValidator.partial().safeParse(data);
}

export function validateCategory(data: Partial<Category>): z.SafeParseReturnType<Partial<Category>, Partial<Category>> {
  return categoryValidator.partial().safeParse(data);
}

export function validateBudget(data: Partial<Budget>): z.SafeParseReturnType<Partial<Budget>, Partial<Budget>> {
  return budgetValidator.partial().safeParse(data);
}

// 批量验证函数
export function validateAccounts(data: Partial<Account>[]): z.SafeParseReturnType<Partial<Account>[], Partial<Account>[]> {
  return z.array(accountValidator.partial()).safeParse(data);
}

export function validateCategories(data: Partial<Category>[]): z.SafeParseReturnType<Partial<Category>[], Partial<Category>[]> {
  return z.array(categoryValidator.partial()).safeParse(data);
}

export function validateBudgets(data: Partial<Budget>[]): z.SafeParseReturnType<Partial<Budget>[], Partial<Budget>[]> {
  return z.array(budgetValidator.partial()).safeParse(data);
} 