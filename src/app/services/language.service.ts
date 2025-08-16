// src/app/services/language.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type Language = 'ar' | 'en';

export interface Translation {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>('ar');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  private isBrowser: boolean;

  private translations: { [key in Language]: Translation } = {
    ar: {
      // العامة
      'app.title': 'مخطط ميزانية السفر',
      'language.switch': 'English',
      'save': 'حفظ',
      'cancel': 'إلغاء',
      'add': 'إضافة',
      'edit': 'تعديل',
      'delete': 'حذف',
      'total': 'المجموع',
      'loading': 'جاري التحميل...',
      'refresh': 'تحديث',

      // الوجهة
      'destination': 'الوجهة',
      'destination.placeholder': 'أدخل وجهة السفر',
      'departure.date': 'تاريخ المغادرة',
      'target.currency': 'عملة الوجهة',

      // المصاريف
      'expenses': 'المصاريف',
      'expense.add': 'إضافة مصروف',
      'expense.name': 'اسم المصروف',
      'expense.name.placeholder': 'مثال: تذاكر الطيران',
      'expense.amount': 'المبلغ',
      'expense.currency': 'العملة',
      'expense.category': 'الفئة',
      'expense.converted': 'بعد التحويل',
      'expenses.total': 'إجمالي المصاريف',
      'expenses.empty': 'لم تتم إضافة أي مصاريف بعد',

      // الفئات
      'category.flights': 'طيران',
      'category.accommodation': 'إقامة',
      'category.food': 'طعام وشراب',
      'category.transportation': 'مواصلات',
      'category.entertainment': 'ترفيه',
      'category.shopping': 'تسوق',
      'category.other': 'أخرى',

      // الميزانية
      'budget.planner': 'مخطط الميزانية',
      'budget.current.savings': 'المدخرات الحالية',
      'budget.monthly.income': 'الدخل الشهري',
      'budget.months.until.travel': 'الأشهر المتبقية',
      'budget.required.monthly': 'المطلوب شهرياً',
      'budget.status.affordable': '✅ الميزانية متاحة',
      'budget.status.need.savings': '⚠️ تحتاج لتوفير المزيد',
      'budget.surplus': 'الفائض',
      'budget.deficit': 'العجز',

      // الرسوم البيانية
      'chart.title': 'توزيع المصاريف',
      'chart.no.data': 'لا توجد بيانات لعرضها',

      // العملات
      'currency.rates.updated': 'تم تحديث أسعار الصرف',
      'currency.rates.error': 'خطأ في تحديث أسعار الصرف'
    },
    en: {
      // General
      'app.title': 'Travel Budget Planner',
      'language.switch': 'العربية',
      'save': 'Save',
      'cancel': 'Cancel',
      'add': 'Add',
      'edit': 'Edit',
      'delete': 'Delete',
      'total': 'Total',
      'loading': 'Loading...',
      'refresh': 'Refresh',

      // Destination
      'destination': 'Destination',
      'destination.placeholder': 'Enter travel destination',
      'departure.date': 'Departure Date',
      'target.currency': 'Destination Currency',

      // Expenses
      'expenses': 'Expenses',
      'expense.add': 'Add Expense',
      'expense.name': 'Expense Name',
      'expense.name.placeholder': 'e.g., Flight Tickets',
      'expense.amount': 'Amount',
      'expense.currency': 'Currency',
      'expense.category': 'Category',
      'expense.converted': 'Converted Amount',
      'expenses.total': 'Total Expenses',
      'expenses.empty': 'No expenses added yet',

      // Categories
      'category.flights': 'Flights',
      'category.accommodation': 'Accommodation',
      'category.food': 'Food & Dining',
      'category.transportation': 'Transportation',
      'category.entertainment': 'Entertainment',
      'category.shopping': 'Shopping',
      'category.other': 'Other',

      // Budget
      'budget.planner': 'Budget Planner',
      'budget.current.savings': 'Current Savings',
      'budget.monthly.income': 'Monthly Income',
      'budget.months.until.travel': 'Months Until Travel',
      'budget.required.monthly': 'Required Monthly',
      'budget.status.affordable': '✅ Budget is Affordable',
      'budget.status.need.savings': '⚠️ Need More Savings',
      'budget.surplus': 'Surplus',
      'budget.deficit': 'Deficit',

      // Charts
      'chart.title': 'Expenses Distribution',
      'chart.no.data': 'No data to display',

      // Currency
      'currency.rates.updated': 'Exchange rates updated',
      'currency.rates.error': 'Error updating exchange rates'
    }
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // تحميل اللغة المحفوظة فقط في البراوزر
    if (this.isBrowser) {
      this.loadSavedLanguage();
    }
  }

  /**
   * تحميل اللغة المحفوظة
   */
  private loadSavedLanguage(): void {
    try {
      const savedLanguage = localStorage.getItem('preferred-language') as Language;
      if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
        this.currentLanguageSubject.next(savedLanguage);
        this.updateDocumentDirection(savedLanguage);
      }
    } catch (error) {
      console.warn('Error loading saved language:', error);
    }
  }

  /**
   * حفظ اللغة (فقط في البراوزر)
   */
  private saveLanguage(language: Language): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem('preferred-language', language);
      } catch (error) {
        console.warn('Error saving language:', error);
      }
    }
  }

  /**
   * تحديث اتجاه المستند
   */
  private updateDocumentDirection(language: Language): void {
    if (this.isBrowser && document) {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }

  /**
   * الحصول على اللغة الحالية
   */
  get currentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  /**
   * تغيير اللغة
   */
  setLanguage(language: Language): void {
    this.currentLanguageSubject.next(language);
    this.saveLanguage(language);
    this.updateDocumentDirection(language);
  }

  /**
   * تبديل اللغة
   */
  toggleLanguage(): void {
    const newLanguage: Language = this.currentLanguage === 'ar' ? 'en' : 'ar';
    this.setLanguage(newLanguage);
  }

  /**
   * الحصول على ترجمة نص
   */
  translate(key: string, fallback?: string): string {
    const translation = this.translations[this.currentLanguage][key];
    return translation || fallback || key;
  }

  /**
   * الحصول على جميع الترجمات للغة الحالية
   */
  getAllTranslations(): Translation {
    return this.translations[this.currentLanguage];
  }

  /**
   * التحقق من اللغة العربية
   */
  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }

  /**
   * التحقق من اللغة الإنجليزية
   */
  isEnglish(): boolean {
    return this.currentLanguage === 'en';
  }
}