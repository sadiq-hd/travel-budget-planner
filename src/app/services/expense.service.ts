// src/app/services/expense.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../models/expense';
import { CurrencyService } from './currency.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public expenses$ = this.expensesSubject.asObservable();

  private readonly STORAGE_KEY = 'travel-budget-expenses';
  private isBrowser: boolean;

  constructor(
    private currencyService: CurrencyService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadExpenses();
  }

  /**
   * تحميل المصاريف من التخزين المحلي
   */
  private loadExpenses(): void {
    if (!this.isBrowser) return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const expenses: Expense[] = JSON.parse(stored).map((expense: any) => ({
          ...expense,
          createdAt: new Date(expense.createdAt)
        }));
        this.expensesSubject.next(expenses);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }

  /**
   * حفظ المصاريف في التخزين المحلي
   */
  private saveExpenses(): void {
    if (!this.isBrowser) return;

    try {
      const expenses = this.expensesSubject.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  }

  /**
   * الحصول على جميع المصاريف
   */
  getExpenses(): Observable<Expense[]> {
    return this.expenses$;
  }

  /**
   * إضافة مصروف جديد
   */
  addExpense(expenseData: Omit<Expense, 'id' | 'createdAt' | 'convertedAmount'>): Observable<Expense> {
    const expense: Expense = {
      id: this.generateId(),
      ...expenseData,
      createdAt: new Date()
    };

    const currentExpenses = this.expensesSubject.value;
    const updatedExpenses = [...currentExpenses, expense];
    
    this.expensesSubject.next(updatedExpenses);
    this.saveExpenses();

    return new BehaviorSubject(expense).asObservable();
  }

  /**
   * تحديث مصروف موجود
   */
  updateExpense(id: string, updates: Partial<Expense>): Observable<Expense | null> {
    const currentExpenses = this.expensesSubject.value;
    const expenseIndex = currentExpenses.findIndex(expense => expense.id === id);
    
    if (expenseIndex === -1) {
      return new BehaviorSubject(null).asObservable();
    }

    const updatedExpense = { ...currentExpenses[expenseIndex], ...updates };
    const updatedExpenses = [...currentExpenses];
    updatedExpenses[expenseIndex] = updatedExpense;

    this.expensesSubject.next(updatedExpenses);
    this.saveExpenses();

    return new BehaviorSubject(updatedExpense).asObservable();
  }

  /**
   * حذف مصروف
   */
  deleteExpense(id: string): Observable<boolean> {
    const currentExpenses = this.expensesSubject.value;
    const filteredExpenses = currentExpenses.filter(expense => expense.id !== id);
    
    if (filteredExpenses.length !== currentExpenses.length) {
      this.expensesSubject.next(filteredExpenses);
      this.saveExpenses();
      return new BehaviorSubject(true).asObservable();
    }

    return new BehaviorSubject(false).asObservable();
  }

  /**
   * الحصول على مصروف محدد
   */
  getExpense(id: string): Observable<Expense | undefined> {
    return this.expenses$.pipe(
      map(expenses => expenses.find(expense => expense.id === id))
    );
  }

  /**
   * الحصول على المصاريف حسب الفئة
   */
  getExpensesByCategory(category: ExpenseCategory): Observable<Expense[]> {
    return this.expenses$.pipe(
      map(expenses => expenses.filter(expense => expense.category === category))
    );
  }

  /**
   * حساب إجمالي المصاريف
   */
  getTotalExpenses(targetCurrency?: string): Observable<number> {
    return this.expenses$.pipe(
      map(expenses => {
        if (!targetCurrency) {
          return expenses.reduce((total, expense) => total + expense.amount, 0);
        }

        // تحويل جميع المصاريف إلى العملة المستهدفة
        let total = 0;
        expenses.forEach(expense => {
          const convertedAmount = this.currencyService.convertSync(
            expense.amount,
            expense.currency,
            targetCurrency
          );
          total += convertedAmount;
        });
        return Math.round(total * 100) / 100;
      })
    );
  }

  /**
   * الحصول على المصاريف حسب العملة
   */
  getExpensesByCurrency(): Observable<{[currency: string]: number}> {
    return this.expenses$.pipe(
      map(expenses => {
        const byCurrency: {[currency: string]: number} = {};
        
        expenses.forEach(expense => {
          if (!byCurrency[expense.currency]) {
            byCurrency[expense.currency] = 0;
          }
          byCurrency[expense.currency] += expense.amount;
        });

        return byCurrency;
      })
    );
  }

  /**
   * الحصول على توزيع المصاريف حسب الفئة
   */
  getExpensesCategoryDistribution(): Observable<{[category: string]: number}> {
    return this.expenses$.pipe(
      map(expenses => {
        const byCategory: {[category: string]: number} = {};
        
        expenses.forEach(expense => {
          const categoryKey = expense.category;
          if (!byCategory[categoryKey]) {
            byCategory[categoryKey] = 0;
          }
          byCategory[categoryKey] += expense.amount;
        });

        return byCategory;
      })
    );
  }

  /**
   * تحديث المبالغ المحولة لجميع المصاريف
   */
  updateConvertedAmounts(targetCurrency: string): Observable<Expense[]> {
    return this.expenses$.pipe(
      map(expenses => {
        return expenses.map(expense => {
          const convertedAmount = this.currencyService.convertSync(
            expense.amount,
            expense.currency,
            targetCurrency
          );
          
          return {
            ...expense,
            convertedAmount,
            targetCurrency
          };
        });
      })
    );
  }

  /**
   * إحصائيات المصاريف
   */
  getExpenseStatistics(): Observable<{
    totalExpenses: number;
    averageExpense: number;
    expenseCount: number;
    topCategory: string;
    mostUsedCurrency: string;
  }> {
    return this.expenses$.pipe(
      map(expenses => {
        if (expenses.length === 0) {
          return {
            totalExpenses: 0,
            averageExpense: 0,
            expenseCount: 0,
            topCategory: '',
            mostUsedCurrency: ''
          };
        }

        const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
        const averageExpense = totalExpenses / expenses.length;

        // أكثر فئة استخداماً
        const categoryCount: {[key: string]: number} = {};
        expenses.forEach(expense => {
          categoryCount[expense.category] = (categoryCount[expense.category] || 0) + 1;
        });
        const topCategory = Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

        // أكثر عملة استخداماً
        const currencyCount: {[key: string]: number} = {};
        expenses.forEach(expense => {
          currencyCount[expense.currency] = (currencyCount[expense.currency] || 0) + 1;
        });
        const mostUsedCurrency = Object.entries(currencyCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

        return {
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          averageExpense: Math.round(averageExpense * 100) / 100,
          expenseCount: expenses.length,
          topCategory,
          mostUsedCurrency
        };
      })
    );
  }

  /**
   * مسح جميع المصاريف
   */
  clearAllExpenses(): Observable<boolean> {
    this.expensesSubject.next([]);
    this.saveExpenses();
    return new BehaviorSubject(true).asObservable();
  }

  /**
   * استيراد المصاريف
   */
  importExpenses(expenses: Expense[]): Observable<boolean> {
    try {
      const validExpenses = expenses.map(expense => ({
        ...expense,
        id: expense.id || this.generateId(),
        createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date()
      }));

      this.expensesSubject.next(validExpenses);
      this.saveExpenses();
      return new BehaviorSubject(true).asObservable();
    } catch (error) {
      console.error('Error importing expenses:', error);
      return new BehaviorSubject(false).asObservable();
    }
  }

  /**
   * تصدير المصاريف
   */
  exportExpenses(): Expense[] {
    return this.expensesSubject.value;
  }

  /**
   * الحصول على معلومات الفئات
   */
  getExpenseCategories() {
    return EXPENSE_CATEGORIES;
  }

  /**
   * الحصول على معلومات فئة محددة
   */
  getCategoryInfo(category: ExpenseCategory) {
    return EXPENSE_CATEGORIES.find(cat => cat.key === category);
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}