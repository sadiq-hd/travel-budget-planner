// src/app/pages/budget-management/budget-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ExpenseListComponent } from '../../components/expense-list/expense-list.component';
import { BudgetPlannerComponent } from '../../components/budget-planner/budget-planner.component';
import { ExpenseChartComponent } from '../../components/expense-chart/expense-chart.component';
import { ExpenseFormComponent } from '../../components/expense-form/expense-form.component'; // إضافة
import { LanguageService } from '../../services/language.service';
import { Expense } from '../../models/expense';
import { BudgetPlan } from '../../models/budget';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [
    CommonModule,
    ExpenseListComponent,
    BudgetPlannerComponent,
    ExpenseChartComponent,
    ExpenseFormComponent // إضافة
  ],
  templateUrl: './budget-management.component.html',
  styleUrl: './budget-management.component.scss'
})
export class BudgetManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // إعدادات العرض
  activeTab: 'expenses' | 'budget' | 'charts' = 'expenses';
  targetCurrency = 'SAR';
  
  // إعدادات النموذج
  isExpenseFormOpen = false; // إضافة
  expenseToEdit: Expense | null = null; // إضافة

  constructor(
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // يمكن إضافة منطق تهيئة هنا
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * تغيير التاب النشط
   */
  setActiveTab(tab: 'expenses' | 'budget' | 'charts'): void {
    this.activeTab = tab;
  }

  /**
   * فتح نموذج إضافة مصروف
   */
  onAddExpense(): void {
    this.expenseToEdit = null; // للتأكد من أنه للإضافة وليس التعديل
    this.isExpenseFormOpen = true;
  }

  /**
   * فتح نموذج تعديل مصروف
   */
  onEditExpense(expense: Expense): void {
    this.expenseToEdit = expense;
    this.isExpenseFormOpen = true;
  }

  /**
   * إغلاق نموذج المصروف
   */
  onCloseExpenseForm(): void {
    this.isExpenseFormOpen = false;
    this.expenseToEdit = null;
  }

  /**
   * عند حفظ المصروف
   */
  onExpenseSaved(expense: Expense): void {
    console.log('Expense saved:', expense);
    // النموذج سيُغلق تلقائياً من ExpenseFormComponent
    this.onCloseExpenseForm();
  }

  /**
   * عند إنشاء خطة ميزانية
   */
  onBudgetCreated(budget: BudgetPlan): void {
    console.log('Budget plan created:', budget);
    // يمكن إضافة منطق إضافي هنا
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