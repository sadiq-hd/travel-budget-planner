// src/app/components/expense-list/expense-list.component.ts
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';

import { ExpenseService } from '../../services/expense.service';
import { CurrencyService } from '../../services/currency.service';
import { LanguageService } from '../../services/language.service';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../models/expense';
import { Currency } from '../../models/currency';

interface FilterOptions {
  category: ExpenseCategory | 'all';
  currency: string | 'all';
  searchTerm: string;
}

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss'
})
export class ExpenseListComponent implements OnInit, OnDestroy {
  @Input() targetCurrency = 'SAR';
  @Output() editExpense = new EventEmitter<Expense>();
  @Output() addExpense = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  expenses$: Observable<Expense[]>;
  filteredExpenses$: Observable<Expense[]>;
  totalExpenses$: Observable<number>;
  expenseStats$: Observable<any>;
  
  categories = EXPENSE_CATEGORIES;
  currencies: Currency[] = [];
  
  // للفلترة
  filters: FilterOptions = {
    category: 'all',
    currency: 'all',
    searchTerm: ''
  };

  // للعرض
  viewMode: 'cards' | 'table' = 'cards';
  isLoading = false;
  showDeleteConfirm = false;
  expenseToDelete: Expense | null = null;

  constructor(
    private expenseService: ExpenseService,
    private currencyService: CurrencyService,
    private languageService: LanguageService
  ) {
    this.expenses$ = this.expenseService.getExpenses();
    this.filteredExpenses$ = this.getFilteredExpenses();
    this.totalExpenses$ = this.expenseService.getTotalExpenses(this.targetCurrency);
    this.expenseStats$ = this.expenseService.getExpenseStatistics();
  }

  ngOnInit(): void {
    this.currencies = this.currencyService.getCurrencies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * الحصول على المصاريف المفلترة
   */
  private getFilteredExpenses(): Observable<Expense[]> {
    return combineLatest([
      this.expenses$,
      // تحويل الفلاتر إلى Observable
      new Subject<FilterOptions>().pipe(startWith(this.filters))
    ]).pipe(
      map(([expenses, filters]) => {
        let filtered = expenses;

        // فلترة حسب الفئة
        if (filters.category !== 'all') {
          filtered = filtered.filter(expense => expense.category === filters.category);
        }

        // فلترة حسب العملة
        if (filters.currency !== 'all') {
          filtered = filtered.filter(expense => expense.currency === filters.currency);
        }

        // فلترة حسب النص
        if (filters.searchTerm.trim()) {
          const searchTerm = filters.searchTerm.toLowerCase().trim();
          filtered = filtered.filter(expense =>
            expense.name.toLowerCase().includes(searchTerm)
          );
        }

        // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
        return filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    );
  }

  /**
   * تطبيق الفلاتر
   */
  applyFilters(): void {
    this.filteredExpenses$ = this.getFilteredExpenses();
  }

  /**
   * إعادة تعيين الفلاتر
   */
  resetFilters(): void {
    this.filters = {
      category: 'all',
      currency: 'all',
      searchTerm: ''
    };
    this.applyFilters();
  }

  /**
   * تغيير وضع العرض
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  /**
   * تعديل مصروف
   */
  onEditExpense(expense: Expense): void {
    this.editExpense.emit(expense);
  }

  /**
   * إضافة مصروف جديد
   */
  onAddExpense(): void {
    this.addExpense.emit();
  }

  /**
   * تأكيد حذف مصروف
   */
  confirmDeleteExpense(expense: Expense): void {
    this.expenseToDelete = expense;
    this.showDeleteConfirm = true;
  }

  /**
   * حذف مصروف
   */
  deleteExpense(): void {
    if (!this.expenseToDelete) return;

    this.isLoading = true;
    
    this.expenseService.deleteExpense(this.expenseToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            console.log('Expense deleted successfully');
          }
          this.cancelDelete();
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * إلغاء حذف
   */
  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.expenseToDelete = null;
    this.isLoading = false;
  }

  /**
   * الحصول على اسم الفئة
   */
  getCategoryName(category: ExpenseCategory): string {
    const categoryInfo = this.categories.find(cat => cat.key === category);
    if (!categoryInfo) return category;
    
    return this.isArabic() ? categoryInfo.nameAr : categoryInfo.nameEn;
  }

  /**
   * الحصول على معلومات الفئة
   */
  getCategoryInfo(category: ExpenseCategory) {
    return this.categories.find(cat => cat.key === category);
  }

  /**
   * الحصول على اسم العملة
   */
  getCurrencyName(code: string): string {
    return this.currencyService.getCurrencyName(code, this.isArabic());
  }

  /**
   * الحصول على رمز العملة
   */
  getCurrencySymbol(code: string): string {
    return this.currencyService.getCurrencySymbol(code);
  }

  /**
   * تنسيق المبلغ
   */
  formatAmount(amount: number, currency: string): string {
    return this.currencyService.formatAmount(amount, currency, this.isArabic());
  }

  /**
   * تحويل المبلغ إلى العملة المستهدفة
   */
  convertAmount(amount: number, fromCurrency: string): number {
    return this.currencyService.convertSync(amount, fromCurrency, this.targetCurrency);
  }

  /**
   * تنسيق التاريخ
   */
  formatDate(date: Date): string {
    const dateObj = new Date(date);
    
    if (this.isArabic()) {
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * تنسيق الوقت النسبي
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (this.isArabic()) {
      if (diffInDays === 0) return 'اليوم';
      if (diffInDays === 1) return 'أمس';
      if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
      if (diffInDays < 30) return `منذ ${Math.floor(diffInDays / 7)} أسابيع`;
      return this.formatDate(date);
    } else {
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      return this.formatDate(date);
    }
  }

  /**
   * الحصول على العملات المستخدمة
   */
  getUsedCurrencies(): Observable<string[]> {
    return this.expenses$.pipe(
      map(expenses => {
        const currencies = new Set(expenses.map(expense => expense.currency));
        return Array.from(currencies);
      })
    );
  }

  /**
   * الترجمة
   */
  translate(key: string, fallback?: string): string {
    return this.languageService.translate(key, fallback);
  }

  /**
   * التحقق من اللغة العربية
   */
  isArabic(): boolean {
    return this.languageService.isArabic();
  }

  /**
   * Track by function للأداء
   */
  trackByExpense(index: number, expense: Expense): string {
    return expense.id;
  }

  trackByCategory(index: number, category: any): string {
    return category.key;
  }

  trackByCurrency(index: number, currency: string): string {
    return currency;
  }
}