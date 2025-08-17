// src/app/app.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { LanguageService, Language } from './services/language.service';
import { Expense } from './models/expense';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, ExpenseFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  title = 'travel-budget-planner';
  currentLanguage: Language = 'ar';
  
  // للتحكم في النموذج (مشترك عبر التطبيق)
  showExpenseForm = false;
  selectedExpense: Expense | null = null;
  targetCurrency = 'SAR';

  constructor(
    private languageService: LanguageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // الاشتراك في تغيير اللغة
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * فتح نموذج إضافة مصروف
   */
  openAddExpenseForm(): void {
    this.selectedExpense = null;
    this.showExpenseForm = true;
  }

  /**
   * فتح نموذج تعديل مصروف
   */
  openEditExpenseForm(expense: Expense): void {
    this.selectedExpense = expense;
    this.showExpenseForm = true;
  }

  /**
   * إغلاق النموذج
   */
  closeExpenseForm(): void {
    this.showExpenseForm = false;
    this.selectedExpense = null;
  }

  /**
   * عند حفظ المصروف
   */
  onExpenseSaved(expense: Expense): void {
    console.log('Expense saved:', expense);
    this.closeExpenseForm();
  }
}