// src/app/components/expense-form/expense-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ExpenseService } from '../../services/expense.service';
import { CurrencyService } from '../../services/currency.service';
import { LanguageService } from '../../services/language.service';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../models/expense';
import { Currency } from '../../models/currency';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.scss'
})
export class ExpenseFormComponent implements OnInit, OnDestroy {
  @Input() expense: Expense | null = null; // للتعديل
  @Input() isOpen = false;
  @Input() targetCurrency = 'SAR'; // العملة المستهدفة للتحويل
  
  @Output() closeForm = new EventEmitter<void>();
  @Output() expenseSaved = new EventEmitter<Expense>();

  private destroy$ = new Subject<void>();

  expenseForm: FormGroup;
  currencies: Currency[] = [];
  categories = EXPENSE_CATEGORIES;
  isLoading = false;
  isSearchingCurrency = false;
  
  // للتحويل المباشر
  convertedAmount = 0;
  conversionRate = 1;
  
  // للبحث في العملات
  currencySearchTerm = '';
  filteredCurrencies: Currency[] = [];
  showCurrencyDropdown = false;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private currencyService: CurrencyService,
    private languageService: LanguageService
  ) {
    this.expenseForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCurrencies();
    this.setupFormSubscriptions();
    
    // إذا كان للتعديل، امليء النموذج
    if (this.expense) {
      this.populateForm();
    }
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
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      amount: [0, [Validators.required, Validators.min(0.01), Validators.max(999999)]],
      currency: ['SAR', [Validators.required]],
      category: [ExpenseCategory.OTHER, [Validators.required]]
    });
  }

  /**
   * تحميل العملات
   */
  private loadCurrencies(): void {
    this.currencies = this.currencyService.getCurrencies();
    this.filteredCurrencies = this.currencies;
  }

  /**
   * إعداد مراقبة التغييرات في النموذج
   */
  private setupFormSubscriptions(): void {
    // مراقبة تغيير المبلغ والعملة للتحويل المباشر
    this.expenseForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.updateConversion();
      });
  }

  /**
   * ملء النموذج للتعديل
   */
  private populateForm(): void {
    if (this.expense) {
      this.expenseForm.patchValue({
        name: this.expense.name,
        amount: this.expense.amount,
        currency: this.expense.currency,
        category: this.expense.category
      });
      this.updateConversion();
    }
  }

  /**
   * تحديث التحويل المباشر
   */
  private updateConversion(): void {
    const formValues = this.expenseForm.value;
    
    if (formValues.amount > 0 && formValues.currency) {
      this.currencyService.convert(
        formValues.amount,
        formValues.currency,
        this.targetCurrency
      ).pipe(takeUntil(this.destroy$))
      .subscribe(converted => {
        this.convertedAmount = converted;
        this.updateConversionRate();
      });
    } else {
      this.convertedAmount = 0;
      this.conversionRate = 1;
    }
  }

  /**
   * تحديث معدل التحويل
   */
  private updateConversionRate(): void {
    const amount = this.expenseForm.get('amount')?.value || 0;
    if (amount > 0) {
      this.conversionRate = this.convertedAmount / amount;
    }
  }

  /**
   * البحث في العملات
   */
  searchCurrency(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.currencySearchTerm = input.value;
    
    if (this.currencySearchTerm.trim()) {
      this.filteredCurrencies = this.currencyService.searchCurrencies(
        this.currencySearchTerm,
        this.isArabic()
      );
    } else {
      this.filteredCurrencies = this.currencies;
    }
    
    this.showCurrencyDropdown = true;
  }

  /**
   * اختيار عملة
   */
  selectCurrency(currency: Currency): void {
    this.expenseForm.patchValue({ currency: currency.code });
    this.currencySearchTerm = this.getCurrencyDisplayName(currency);
    this.showCurrencyDropdown = false;
    this.updateConversion();
  }

  /**
   * الحصول على اسم العملة المعروض
   */
  getCurrencyDisplayName(currency: Currency): string {
    const name = this.isArabic() ? currency.nameAr : currency.name;
    return `${currency.flag} ${currency.code} - ${name}`;
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
   * حفظ المصروف
   */
  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.expenseForm.value;

    const expenseData = {
      name: formData.name.trim(),
      amount: Number(formData.amount),
      currency: formData.currency,
      category: formData.category
    };

    if (this.expense) {
      // تعديل مصروف موجود
      this.expenseService.updateExpense(this.expense.id, expenseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedExpense) => {
            if (updatedExpense) {
              this.expenseSaved.emit(updatedExpense);
              this.resetAndClose();
            }
          },
          error: (error) => {
            console.error('Error updating expense:', error);
            this.isLoading = false;
          }
        });
    } else {
      // إضافة مصروف جديد
      this.expenseService.addExpense(expenseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newExpense) => {
            this.expenseSaved.emit(newExpense);
            this.resetAndClose();
          },
          error: (error) => {
            console.error('Error adding expense:', error);
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * إلغاء وإغلاق النموذج
   */
  onCancel(): void {
    this.resetAndClose();
  }

  /**
   * إعادة تعيين وإغلاق
   */
  private resetAndClose(): void {
    this.isLoading = false;
    this.expenseForm.reset({
      currency: 'SAR',
      category: ExpenseCategory.OTHER
    });
    this.convertedAmount = 0;
    this.conversionRate = 1;
    this.currencySearchTerm = '';
    this.showCurrencyDropdown = false;
    this.closeForm.emit();
  }

  /**
   * تمييز جميع الحقول كـ touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.expenseForm.controls).forEach(key => {
      const control = this.expenseForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * التحقق من وجود خطأ في حقل
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.expenseForm.get(fieldName);
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
    const field = this.expenseForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) {
      return this.translate(`${fieldName}.required`, 'هذا الحقل مطلوب');
    }
    if (errors['minlength']) {
      return this.translate(`${fieldName}.minlength`, 'النص قصير جداً');
    }
    if (errors['maxlength']) {
      return this.translate(`${fieldName}.maxlength`, 'النص طويل جداً');
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
   * إغلاق قائمة العملات عند النقر خارجها
   */
  onCurrencyInputBlur(): void {
    // تأخير صغير للسماح بالنقر على العنصر
    setTimeout(() => {
      this.showCurrencyDropdown = false;
    }, 200);
  }

  /**
   * تنسيق المبلغ المحول
   */
  getFormattedConvertedAmount(): string {
    if (this.convertedAmount === 0) return '';
    
    return this.currencyService.formatAmount(
      this.convertedAmount,
      this.targetCurrency,
      this.isArabic()
    );
  }

  /**
   * تنسيق معدل التحويل
   */
  getFormattedConversionRate(): string {
    if (this.conversionRate === 1) return '';
    
    const fromCurrency = this.expenseForm.get('currency')?.value || 'SAR';
    return `1 ${fromCurrency} = ${this.conversionRate.toFixed(4)} ${this.targetCurrency}`;
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
   * الحصول على عنوان النموذج
   */
  getFormTitle(): string {
    if (this.expense) {
      return this.translate('expense.edit', 'تعديل مصروف');
    }
    return this.translate('expense.add', 'إضافة مصروف');
  }

  /**
   * Track by functions للأداء
   */
  trackByCurrency(index: number, currency: Currency): string {
    return currency.code;
  }

  trackByCategory(index: number, category: any): string {
    return category.key;
  }
}