// src/app/models/expense.ts
export interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  convertedAmount?: number;
  targetCurrency?: string;
  createdAt: Date;
}

export enum ExpenseCategory {
  FLIGHTS = 'flights',
  ACCOMMODATION = 'accommodation',
  FOOD = 'food',
  TRANSPORTATION = 'transportation',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  OTHER = 'other'
}

export interface ExpenseCategoryInfo {
  key: ExpenseCategory;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryInfo[] = [
  {
    key: ExpenseCategory.FLIGHTS,
    nameEn: 'Flights',
    nameAr: 'طيران',
    icon: '✈️',
    color: '#3B82F6'
  },
  {
    key: ExpenseCategory.ACCOMMODATION,
    nameEn: 'Accommodation',
    nameAr: 'إقامة',
    icon: '🏨',
    color: '#8B5CF6'
  },
  {
    key: ExpenseCategory.FOOD,
    nameEn: 'Food & Dining',
    nameAr: 'طعام وشراب',
    icon: '🍽️',
    color: '#EF4444'
  },
  {
    key: ExpenseCategory.TRANSPORTATION,
    nameEn: 'Transportation',
    nameAr: 'مواصلات',
    icon: '🚗',
    color: '#10B981'
  },
  {
    key: ExpenseCategory.ENTERTAINMENT,
    nameEn: 'Entertainment',
    nameAr: 'ترفيه',
    icon: '🎭',
    color: '#F59E0B'
  },
  {
    key: ExpenseCategory.SHOPPING,
    nameEn: 'Shopping',
    nameAr: 'تسوق',
    icon: '🛍️',
    color: '#EC4899'
  },
  {
    key: ExpenseCategory.OTHER,
    nameEn: 'Other',
    nameAr: 'أخرى',
    icon: '📋',
    color: '#6B7280'
  }
];