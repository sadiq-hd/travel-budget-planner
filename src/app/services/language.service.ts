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
      'actions': 'الإجراءات',
      'months': 'شهر',
      'categories': 'فئة',

      // الصفحة الرئيسية
      'home.welcome': 'مرحباً بك في مخطط ميزانية السفر',
      'home.description': 'خطط لرحلتك القادمة بذكاء. احسب مصاريفك، خطط ميزانيتك، ووفر بطريقة منظمة لتحقيق هدف السفر',
      'home.total.expenses': 'إجمالي المصاريف',
      'home.expense.count': 'عدد المصاريف',
      'home.budget.status': 'حالة الميزانية',
      'home.planned': 'مخططة',
      'home.not.planned': 'غير مخططة',
      'home.start.planning': 'ابدأ التخطيط',
      'home.planning.desc': 'خطط ميزانيتك واحسب المبلغ المطلوب توفيره شهرياً',
      'home.start.now': 'ابدأ الآن',
      'home.quick.actions': 'إجراءات سريعة',
      'home.actions.desc': 'أضف مصاريف جديدة أو راجع ميزانيتك الحالية',
      'home.add.expense': 'إضافة مصروف',
      'home.add.expense.desc': 'أضف مصروف جديد لرحلتك',
      'home.view.budget': 'عرض الميزانية',
      'home.view.budget.desc': 'راجع خطة ميزانيتك والتقارير',
      'home.features': 'المميزات',
      'home.features.desc': 'كل ما تحتاجه لتخطيط رحلة ناجحة',
      'home.feature.tracking': 'تتبع المصاريف',
      'home.feature.tracking.desc': 'أضف وصنف مصاريف رحلتك بسهولة',
      'home.feature.currency': 'تحويل العملات',
      'home.feature.currency.desc': 'تحويل تلقائي بأسعار صرف محدثة',
      'home.feature.planning': 'تخطيط الميزانية',
      'home.feature.planning.desc': 'احسب المبلغ المطلوب توفيره شهرياً',
      'home.feature.reports': 'التقارير والرسوم',
      'home.feature.reports.desc': 'مخططات بيانية وتحليلات مفصلة',
      'home.ready': 'جاهز لبدء التخطيط؟',
      'home.ready.desc': 'ابدأ الآن في تخطيط ميزانية رحلتك القادمة',

      // الوجهة
      'destination': 'الوجهة',
      'destination.placeholder': 'أدخل وجهة السفر',
      'departure.date': 'تاريخ المغادرة',
      'target.currency': 'عملة الوجهة',

      // المصاريف
      'expenses': 'المصاريف',
      'expense.add': 'إضافة مصروف',
      'expense.edit': 'تعديل مصروف',
      'expense.name': 'اسم المصروف',
      'expense.name.placeholder': 'مثال: تذاكر الطيران',
      'expense.amount': 'المبلغ',
      'expense.currency': 'العملة',
      'expense.category': 'الفئة',
      'expense.converted': 'بعد التحويل',
      'expense.date': 'التاريخ',
      'expenses.total': 'إجمالي المصاريف',
      'expenses.empty': 'لا توجد مصاريف',
      'expenses.empty.description': 'ابدأ بإضافة مصاريف رحلتك المتوقعة',
      'expenses.manage': 'إدارة وتتبع مصاريف رحلتك',
      'expenses.count': 'عدد المصاريف',
      'expenses.average': 'متوسط المصروف',
      'expenses.current.total': 'إجمالي المصاريف الحالية',
      'expense.add.first': 'إضافة أول مصروف',

      // البحث والفلترة
      'search.placeholder': 'البحث في المصاريف...',
      'category.all': 'جميع الفئات',
      'currency.all': 'جميع العملات',
      'view.table': 'جدول',
      'view.cards': 'بطاقات',
      'amount.original': 'المبلغ الأصلي',
      'amount.converted': 'بعد التحويل',

      // الفئات
      'category.flights': 'طيران',
      'category.accommodation': 'إقامة',
      'category.food': 'طعام وشراب',
      'category.transportation': 'مواصلات',
      'category.entertainment': 'ترفيه',
      'category.shopping': 'تسوق',
      'category.other': 'أخرى',

      // الميزانية
      'budget.management': 'إدارة الميزانية',
      'budget.management.desc': 'خطط ميزانيتك، تتبع مصاريفك، وحلل بياناتك',
      'budget.planner': 'مخطط الميزانية',
      'budget.description': 'خطط ميزانيتك واحسب التوفير المطلوب لرحلتك',
      'budget.form.title': 'معلومات الميزانية',
      'budget.current.savings': 'المدخرات الحالية',
      'budget.monthly.income': 'الدخل الشهري',
      'budget.months.until.travel': 'الأشهر المتبقية للسفر',
      'budget.months.remaining': 'الأشهر المتبقية',
      'budget.required.monthly': 'المطلوب شهرياً',
      'budget.calculate': 'حساب الميزانية',
      'budget.calculate.now': 'احسب الميزانية الآن',
      'budget.reset': 'إعادة تعيين',
      'budget.summary': 'ملخص الميزانية',
      'budget.recommendations': 'التوصيات',
      'budget.status.affordable': '✅ الميزانية متاحة',
      'budget.status.need.savings': '⚠️ تحتاج لتوفير المزيد',
      'budget.surplus': 'الفائض',
      'budget.deficit': 'العجز',
      'budget.affordable': 'الميزانية متاحة',
      'budget.not.affordable': 'الميزانية غير متاحة',
      'budget.affordable.desc': 'يمكنك تحقيق هدف السفر بالخطة الحالية',
      'budget.not.affordable.desc': 'تحتاج لتعديل الخطة أو زيادة المدخرات',
      'budget.empty.title': 'لم يتم إنشاء خطة ميزانية بعد',
      'budget.empty.description': 'املأ النموذج على اليسار لحساب خطة ميزانيتك والتوفير المطلوب',
      'budget.savings.placeholder': '0',
      'budget.income.placeholder': '5000',
      'budget.months.placeholder': '6',

      // التوفير
      'savings.calculation': 'تفاصيل التوفير',
      'savings.goal': 'هدف التوفير',
      'savings.monthly.required': 'المطلوب شهرياً',
      'savings.monthly.recommended': 'الموصى به شهرياً',
      'savings.projected.total': 'المتوقع في النهاية',
      'savings.achievable': 'هدف قابل للتحقيق',
      'savings.challenging': 'هدف يحتاج جهد إضافي',
      'savings.progress': 'تقدم التوفير',

      // الرسوم البيانية
      'chart.title': 'توزيع المصاريف',
      'chart.breakdown': 'التفصيل',
      'chart.largest': 'الأكبر',
      'chart.categories': 'الفئات',
      'chart.no.data': 'لا توجد بيانات لعرضها',
      'chart.no.data.description': 'أضف بعض المصاريف لمشاهدة التوزيع في المخطط',
      'chart.preview': 'معاينة',
      'chart.donut': 'دائري مفرغ',
      'chart.pie': 'دائري',
      'chart.bar': 'أعمدة',

      // الحذف والتأكيد
      'delete.confirm.title': 'تأكيد الحذف',
      'delete.confirm.message': 'هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.',

      // العملات
      'currency.rates.updated': 'تم تحديث أسعار الصرف',
      'currency.rates.error': 'خطأ في تحديث أسعار الصرف',

      // النصائح
      'tips.title': 'نصائح للاستخدام الأمثل',
      'tip.1': 'ابدأ بإضافة جميع المصاريف المتوقعة في تاب "المصاريف"',
      'tip.2': 'استخدم تاب "مخطط الميزانية" لحساب المبلغ المطلوب توفيره شهرياً',
      'tip.3': 'راجع تاب "الرسوم البيانية" لتحليل توزيع مصاريفك بصرياً',
      'tip.4': 'يمكنك تغيير العملة المستهدفة لرؤية جميع المبالغ محولة'
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
      'actions': 'Actions',
      'months': 'months',
      'categories': 'categories',

      // Home Page
      'home.welcome': 'Welcome to Travel Budget Planner',
      'home.description': 'Plan your next trip intelligently. Calculate expenses, plan your budget, and save systematically to achieve your travel goal',
      'home.total.expenses': 'Total Expenses',
      'home.expense.count': 'Expense Count',
      'home.budget.status': 'Budget Status',
      'home.planned': 'Planned',
      'home.not.planned': 'Not Planned',
      'home.start.planning': 'Start Planning',
      'home.planning.desc': 'Plan your budget and calculate required monthly savings',
      'home.start.now': 'Start Now',
      'home.quick.actions': 'Quick Actions',
      'home.actions.desc': 'Add new expenses or review your current budget',
      'home.add.expense': 'Add Expense',
      'home.add.expense.desc': 'Add a new expense for your trip',
      'home.view.budget': 'View Budget',
      'home.view.budget.desc': 'Review your budget plan and reports',
      'home.features': 'Features',
      'home.features.desc': 'Everything you need to plan a successful trip',
      'home.feature.tracking': 'Expense Tracking',
      'home.feature.tracking.desc': 'Add and categorize your trip expenses easily',
      'home.feature.currency': 'Currency Conversion',
      'home.feature.currency.desc': 'Automatic conversion with updated exchange rates',
      'home.feature.planning': 'Budget Planning',
      'home.feature.planning.desc': 'Calculate required monthly savings amount',
      'home.feature.reports': 'Reports & Charts',
      'home.feature.reports.desc': 'Visual charts and detailed analytics',
      'home.ready': 'Ready to Start Planning?',
      'home.ready.desc': 'Start planning your next trip budget now',

      // Destination
      'destination': 'Destination',
      'destination.placeholder': 'Enter travel destination',
      'departure.date': 'Departure Date',
      'target.currency': 'Destination Currency',

      // Expenses
      'expenses': 'Expenses',
      'expense.add': 'Add Expense',
      'expense.edit': 'Edit Expense',
      'expense.name': 'Expense Name',
      'expense.name.placeholder': 'e.g., Flight Tickets',
      'expense.amount': 'Amount',
      'expense.currency': 'Currency',
      'expense.category': 'Category',
      'expense.converted': 'Converted Amount',
      'expense.date': 'Date',
      'expenses.total': 'Total Expenses',
      'expenses.empty': 'No expenses',
      'expenses.empty.description': 'Start by adding your expected trip expenses',
      'expenses.manage': 'Manage and track your trip expenses',
      'expenses.count': 'Expense Count',
      'expenses.average': 'Average Expense',
      'expenses.current.total': 'Current Total Expenses',
      'expense.add.first': 'Add First Expense',

      // Search and Filtering
      'search.placeholder': 'Search expenses...',
      'category.all': 'All Categories',
      'currency.all': 'All Currencies',
      'view.table': 'Table',
      'view.cards': 'Cards',
      'amount.original': 'Original Amount',
      'amount.converted': 'Converted Amount',

      // Categories
      'category.flights': 'Flights',
      'category.accommodation': 'Accommodation',
      'category.food': 'Food & Dining',
      'category.transportation': 'Transportation',
      'category.entertainment': 'Entertainment',
      'category.shopping': 'Shopping',
      'category.other': 'Other',

      // Budget
      'budget.management': 'Budget Management',
      'budget.management.desc': 'Plan your budget, track expenses, and analyze your data',
      'budget.planner': 'Budget Planner',
      'budget.description': 'Plan your budget and calculate required savings for your trip',
      'budget.form.title': 'Budget Information',
      'budget.current.savings': 'Current Savings',
      'budget.monthly.income': 'Monthly Income',
      'budget.months.until.travel': 'Months Until Travel',
      'budget.months.remaining': 'Months Remaining',
      'budget.required.monthly': 'Required Monthly',
      'budget.calculate': 'Calculate Budget',
      'budget.calculate.now': 'Calculate Budget Now',
      'budget.reset': 'Reset',
      'budget.summary': 'Budget Summary',
      'budget.recommendations': 'Recommendations',
      'budget.status.affordable': '✅ Budget is Affordable',
      'budget.status.need.savings': '⚠️ Need More Savings',
      'budget.surplus': 'Surplus',
      'budget.deficit': 'Deficit',
      'budget.affordable': 'Budget is Affordable',
      'budget.not.affordable': 'Budget Not Affordable',
      'budget.affordable.desc': 'You can achieve your travel goal with current plan',
      'budget.not.affordable.desc': 'Need to adjust plan or increase savings',
      'budget.empty.title': 'No budget plan created yet',
      'budget.empty.description': 'Fill the form on the left to calculate your budget plan and required savings',
      'budget.savings.placeholder': '0',
      'budget.income.placeholder': '5000',
      'budget.months.placeholder': '6',

      // Savings
      'savings.calculation': 'Savings Details',
      'savings.goal': 'Savings Goal',
      'savings.monthly.required': 'Required Monthly',
      'savings.monthly.recommended': 'Recommended Monthly',
      'savings.projected.total': 'Projected Total',
      'savings.achievable': 'Achievable Goal',
      'savings.challenging': 'Challenging Goal',
      'savings.progress': 'Savings Progress',

      // Charts
      'chart.title': 'Expenses Distribution',
      'chart.breakdown': 'Breakdown',
      'chart.largest': 'Largest',
      'chart.categories': 'Categories',
      'chart.no.data': 'No data to display',
      'chart.no.data.description': 'Add some expenses to see distribution in the chart',
      'chart.preview': 'Preview',
      'chart.donut': 'Donut',
      'chart.pie': 'Pie',
      'chart.bar': 'Bar',

      // Delete Confirmation
      'delete.confirm.title': 'Confirm Delete',
      'delete.confirm.message': 'Are you sure you want to delete this expense? This action cannot be undone.',

      // Currency
      'currency.rates.updated': 'Exchange rates updated',
      'currency.rates.error': 'Error updating exchange rates',

      // Tips
      'tips.title': 'Tips for Optimal Usage',
      'tip.1': 'Start by adding all expected expenses in the "Expenses" tab',
      'tip.2': 'Use the "Budget Planner" tab to calculate required monthly savings',
      'tip.3': 'Review the "Charts" tab to visually analyze your expense distribution',
      'tip.4': 'You can change the target currency to see all amounts converted'
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