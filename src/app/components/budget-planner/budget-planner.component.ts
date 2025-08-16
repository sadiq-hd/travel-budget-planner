// src/app/components/budget-planner/budget-planner.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';

import { BudgetService } from '../../services/budget.service';
import { ExpenseService } from '../../services/expense.service';
import { CurrencyService } from '../../services/currency.service';
import { LanguageService } from '../../services/language.service';
import { BudgetPlan, BudgetStatus, SavingsCalculation } from '../../models/budget';
import { Currency } from '../../models/currency';

@Component({
  selector: 'app-budget-planner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './budget-planner.component.html',
  styleUrl: './budget-planner.component.scss'
})
export class BudgetPlannerComponent implements OnInit, OnDestroy {
  @Input() targetCurrency = 'SAR';
  @Output() budgetCreated = new EventEmitter<BudgetPlan>();

  private destroy$ = new Subject<void>();

  budgetForm: FormGroup;
  budgetPlan$: Observable<BudgetPlan | null>;
  totalExpenses$: Observable<number>;
  savingsProgress$: Observable<number>;
  recommendations$: Observable<string[]>;
  
  currencies: Currency[] = [];
  isLoading = false;
  isCalculating = false;
  
  // للعرض
  currentBudgetPlan: BudgetPlan | null = null;
  savingsCalculation: SavingsCalculation | null = null;

  // Enum للوصول في التمبلت
  BudgetStatus = BudgetStatus;

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private expenseService: ExpenseService,
    public currencyService: CurrencyService, // جعلها public للوصول من التمبلت
    private languageService: LanguageService
  ) {
    this.budgetForm = this.createForm();
    this.budgetPlan$ = this.budgetService.budgetPlan$;
    this.totalExpenses$ = this.expenseService.getTotalExpenses(this.targetCurrency);
    this.savingsProgress$ = this.budgetService.getSavingsProgress();
    this.recommendations$ = this.budgetService.getBudgetRecommendations();
  }

  ngOnInit(): void {
    this.currencies = this.currencyService.getCurrencies();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * إنشاء النموذج
   */
  private createForm(): FormGroup {
    return this.fb.group({
      currentSavings: [0, [Validators.required, Validators.min(0)]],
      monthlyIncome: [0, [Validators.required, Validators.min(1)]],
      monthsUntilTravel: [1, [Validators.required, Validators.min(1), Validators.max(120)]],
      targetCurrency: [this.targetCurrency, [Validators.required]]
    });
  }

  /**
   * إعداد الاشتراكات
   */
  private setupSubscriptions(): void {
    // مراقبة تغيير خطة الميزانية
    this.budgetPlan$
      .pipe(takeUntil(this.destroy$))
      .subscribe(plan => {
        this.currentBudgetPlan = plan;
        if (plan) {
          this.updateSavingsCalculation(plan);
          this.populateForm(plan);
        }
      });

    // مراقبة تغيير العملة المستهدفة
    this.budgetForm.get('targetCurrency')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(currency => {
        this.targetCurrency = currency;
        // إعادة حساب النفقات بالعملة الجديدة
        this.totalExpenses$ = this.expenseService.getTotalExpenses(currency);
      });
  }

  /**
   * ملء النموذج بالبيانات الموجودة
   */
  private populateForm(plan: BudgetPlan): void {
    this.budgetForm.patchValue({
      currentSavings: plan.currentSavings,
      monthlyIncome: plan.monthlyIncome,
      monthsUntilTravel: plan.monthsUntilTravel,
      targetCurrency: plan.targetCurrency
    }, { emitEvent: false });
  }

  /**
   * حساب الميزانية
   */
  calculateBudget(): void {
    if (this.budgetForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isCalculating = true;
    const formData = this.budgetForm.value;

    this.budgetService.createBudgetPlan(
      formData.currentSavings,
      formData.monthlyIncome,
      formData.monthsUntilTravel,
      formData.targetCurrency
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (plan) => {
        this.currentBudgetPlan = plan;
        this.updateSavingsCalculation(plan);
        this.budgetCreated.emit(plan);
        this.isCalculating = false;
      },
      error: (error) => {
        console.error('Error calculating budget:', error);
        this.isCalculating = false;
      }
    });
  }

  /**
   * تحديث حسابات التوفير
   */
  private updateSavingsCalculation(plan: BudgetPlan): void {
    this.savingsCalculation = this.budgetService.calculateSavings(
      plan.totalExpenses,
      plan.currentSavings,
      plan.monthsUntilTravel
    );
  }

  /**
   * تحديث خطة الميزانية
   */
  updateBudgetPlan(): void {
    if (!this.currentBudgetPlan || this.budgetForm.invalid) return;

    const formData = this.budgetForm.value;
    const updates = {
      currentSavings: formData.currentSavings,
      monthlyIncome: formData.monthlyIncome,
      monthsUntilTravel: formData.monthsUntilTravel,
      targetCurrency: formData.targetCurrency
    };

    this.budgetService.updateBudgetPlan(updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe(plan => {
        if (plan) {
          this.currentBudgetPlan = plan;
          this.updateSavingsCalculation(plan);
        }
      });
  }

  /**
   * إعادة تعيين الميزانية
   */
  resetBudget(): void {
    this.budgetService.clearBudgetData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentBudgetPlan = null;
        this.savingsCalculation = null;
        this.budgetForm.reset({
          currentSavings: 0,
          monthlyIncome: 0,
          monthsUntilTravel: 1,
          targetCurrency: this.targetCurrency
        });
      });
  }

  /**
   * الحصول على حالة الميزانية الفعلية
   */
  get actualBudgetStatus(): BudgetStatus {
    if (!this.currentBudgetPlan) {
      return BudgetStatus.INSUFFICIENT;
    }

    // إذا كانت الميزانية غير متاحة، إرجاع insufficient
    if (!this.currentBudgetPlan.isAffordable) {
      return BudgetStatus.INSUFFICIENT;
    }

    // حساب النسبة المئوية للتوفير المطلوب من الدخل
    const requiredSavingsRatio = this.currentBudgetPlan.requiredMonthlySavings / this.currentBudgetPlan.monthlyIncome;
    
    if (requiredSavingsRatio <= 0.3) { // أقل من 30% من الدخل
      return BudgetStatus.COMFORTABLE;
    } else if (requiredSavingsRatio <= 0.5) { // 30-50% من الدخل
      return BudgetStatus.ADEQUATE;
    } else if (requiredSavingsRatio <= 0.7) { // 50-70% من الدخل
      return BudgetStatus.INSUFFICIENT;
    } else { // أكثر من 70% من الدخل
      return BudgetStatus.OVER_BUDGET;
    }
  }

  /**
   * الحصول على لون حالة الميزانية
   */
  getBudgetStatusColor(status: BudgetStatus): string {
    switch (status) {
      case BudgetStatus.INSUFFICIENT:
        return 'text-red-600 bg-red-50 border-red-200';
      case BudgetStatus.ADEQUATE:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case BudgetStatus.COMFORTABLE:
        return 'text-green-600 bg-green-50 border-green-200';
      case BudgetStatus.OVER_BUDGET:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * الحصول على أيقونة حالة الميزانية
   */
  getBudgetStatusIcon(status: BudgetStatus): string {
    switch (status) {
      case BudgetStatus.INSUFFICIENT:
        return '⚠️';
      case BudgetStatus.ADEQUATE:
        return '⚡';
      case BudgetStatus.COMFORTABLE:
        return '✅';
      case BudgetStatus.OVER_BUDGET:
        return '🎉';
      default:
        return '💰';
    }
  }

  /**
   * الحصول على رسالة حالة الميزانية
   */
  getBudgetStatusMessage(status: BudgetStatus): string {
    switch (status) {
      case BudgetStatus.INSUFFICIENT:
        return this.translate('budget.status.insufficient', 'الميزانية غير كافية');
      case BudgetStatus.ADEQUATE:
        return this.translate('budget.status.adequate', 'الميزانية كافية');
      case BudgetStatus.COMFORTABLE:
        return this.translate('budget.status.comfortable', 'الميزانية مريحة');
      case BudgetStatus.OVER_BUDGET:
        return this.translate('budget.status.over', 'ميزانية فائضة');
      default:
        return '';
    }
  }

  /**
   * تنسيق المبلغ
   */
  formatAmount(amount: number, currency: string = this.targetCurrency): string {
    return this.currencyService.formatAmount(amount, currency, this.isArabic());
  }

  /**
   * تنسيق النسبة المئوية
   */
  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  /**
   * الحصول على اسم العملة
   */
  getCurrencyName(code: string): string {
    return this.currencyService.getCurrencyName(code, this.isArabic());
  }

  /**
   * التحقق من وجود خطأ في حقل
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.budgetForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * الحصول على رسالة الخطأ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.budgetForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) {
      return this.translate(`${fieldName}.required`, 'هذا الحقل مطلوب');
    }
    if (errors['min']) {
      return this.translate(`${fieldName}.min`, 'القيمة صغيرة جداً');
    }
    if (errors['max']) {
      return this.translate(`${fieldName}.max`, 'القيمة كبيرة جداً');
    }

    return '';
  }

  /**
   * تمييز جميع الحقول كـ touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.budgetForm.controls).forEach(key => {
      const control = this.budgetForm.get(key);
      control?.markAsTouched();
    });
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
  trackByCurrency(index: number, currency: Currency): string {
    return currency.code;
  }

  trackByRecommendation(index: number, recommendation: string): number {
    return index;
  }
}