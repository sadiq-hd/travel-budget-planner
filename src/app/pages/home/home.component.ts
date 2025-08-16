// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ExpenseService } from '../../services/expense.service';
import { BudgetService } from '../../services/budget.service';
import { LanguageService } from '../../services/language.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // إحصائيات سريعة
  totalExpenses$: Observable<number>;
  expenseStats$: Observable<any>;
  budgetPlan$: Observable<any>;
  
  // للعرض
  hasExpenses = false;
  hasBudgetPlan = false;

  constructor(
    private expenseService: ExpenseService,
    private budgetService: BudgetService,
    private languageService: LanguageService,
    private currencyService: CurrencyService
  ) {
    this.totalExpenses$ = this.expenseService.getTotalExpenses('SAR');
    this.expenseStats$ = this.expenseService.getExpenseStatistics();
    this.budgetPlan$ = this.budgetService.budgetPlan$;
  }

  ngOnInit(): void {
    this.loadQuickStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * تحميل الإحصائيات السريعة
   */
  private loadQuickStats(): void {
    // فحص وجود مصاريف
    this.expenseService.getExpenses()
      .pipe(takeUntil(this.destroy$))
      .subscribe(expenses => {
        this.hasExpenses = expenses.length > 0;
      });

    // فحص وجود خطة ميزانية
    this.budgetPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe(plan => {
        this.hasBudgetPlan = !!plan;
      });
  }

  /**
   * تنسيق المبلغ
   */
  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount, 'SAR', this.isArabic());
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
}