// src/app/services/budget.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { BudgetPlan, TripBudget, BudgetSummary, BudgetStatus, SavingsCalculation } from '../models/budget';
import { ExpenseService } from './expense.service';
import { CurrencyService } from './currency.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private budgetPlanSubject = new BehaviorSubject<BudgetPlan | null>(null);
  public budgetPlan$ = this.budgetPlanSubject.asObservable();

  private tripBudgetSubject = new BehaviorSubject<TripBudget | null>(null);
  public tripBudget$ = this.tripBudgetSubject.asObservable();

  private readonly STORAGE_KEY_BUDGET = 'travel-budget-plan';
  private readonly STORAGE_KEY_TRIP = 'travel-trip-budget';
  private isBrowser: boolean;

  constructor(
    private expenseService: ExpenseService,
    private currencyService: CurrencyService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadBudgetData();
  }

  /**
   * تحميل بيانات الميزانية من التخزين المحلي
   */
  private loadBudgetData(): void {
    if (!this.isBrowser) return;

    try {
      const budgetData = localStorage.getItem(this.STORAGE_KEY_BUDGET);
      if (budgetData) {
        this.budgetPlanSubject.next(JSON.parse(budgetData));
      }

      const tripData = localStorage.getItem(this.STORAGE_KEY_TRIP);
      if (tripData) {
        const trip = JSON.parse(tripData);
        trip.departureDate = new Date(trip.departureDate);
        trip.createdAt = new Date(trip.createdAt);
        trip.updatedAt = new Date(trip.updatedAt);
        this.tripBudgetSubject.next(trip);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  }

  /**
   * حفظ خطة الميزانية
   */
  private saveBudgetPlan(): void {
    if (!this.isBrowser) return;

    try {
      const budget = this.budgetPlanSubject.value;
      if (budget) {
        localStorage.setItem(this.STORAGE_KEY_BUDGET, JSON.stringify(budget));
      }
    } catch (error) {
      console.error('Error saving budget plan:', error);
    }
  }

  /**
   * حفظ ميزانية الرحلة
   */
  private saveTripBudget(): void {
    if (!this.isBrowser) return;

    try {
      const trip = this.tripBudgetSubject.value;
      if (trip) {
        localStorage.setItem(this.STORAGE_KEY_TRIP, JSON.stringify(trip));
      }
    } catch (error) {
      console.error('Error saving trip budget:', error);
    }
  }

  /**
   * إنشاء خطة ميزانية جديدة
   */
  createBudgetPlan(
    currentSavings: number,
    monthlyIncome: number,
    monthsUntilTravel: number,
    targetCurrency: string = 'SAR'
  ): Observable<BudgetPlan> {
    return this.expenseService.getTotalExpenses(targetCurrency).pipe(
      map(totalExpenses => {
        const budgetPlan = this.calculateBudgetPlan(
          currentSavings,
          monthlyIncome,
          monthsUntilTravel,
          totalExpenses,
          targetCurrency
        );

        this.budgetPlanSubject.next(budgetPlan);
        this.saveBudgetPlan();
        
        return budgetPlan;
      })
    );
  }

  /**
   * تحديث خطة الميزانية
   */
  updateBudgetPlan(updates: Partial<BudgetPlan>): Observable<BudgetPlan | null> {
    const currentPlan = this.budgetPlanSubject.value;
    if (!currentPlan) {
      return new BehaviorSubject(null).asObservable();
    }

    const updatedPlan = { ...currentPlan, ...updates };
    
    // إعادة حساب القيم المعتمدة على التغييرات
    const recalculatedPlan = this.calculateBudgetPlan(
      updatedPlan.currentSavings,
      updatedPlan.monthlyIncome,
      updatedPlan.monthsUntilTravel,
      updatedPlan.totalExpenses,
      updatedPlan.targetCurrency
    );

    this.budgetPlanSubject.next(recalculatedPlan);
    this.saveBudgetPlan();

    return new BehaviorSubject(recalculatedPlan).asObservable();
  }

  /**
   * حساب خطة الميزانية
   */
  private calculateBudgetPlan(
    currentSavings: number,
    monthlyIncome: number,
    monthsUntilTravel: number,
    totalExpenses: number,
    targetCurrency: string
  ): BudgetPlan {
    const savingsGoal = Math.max(0, totalExpenses - currentSavings);
    const requiredMonthlySavings = monthsUntilTravel > 0 ? savingsGoal / monthsUntilTravel : savingsGoal;
    
    // التحقق من إمكانية تحمل التكلفة
    const projectedSavings = currentSavings + (requiredMonthlySavings * monthsUntilTravel);
    const isAffordable = projectedSavings >= totalExpenses && requiredMonthlySavings <= monthlyIncome * 0.3; // لا يتجاوز 30% من الدخل
    
    const surplus = currentSavings - totalExpenses;

    return {
      currentSavings,
      monthlyIncome,
      monthsUntilTravel,
      totalExpenses,
      targetCurrency,
      requiredMonthlySavings: Math.max(0, requiredMonthlySavings),
      isAffordable,
      surplus,
      savingsGoal
    };
  }

  /**
   * إنشاء ميزانية رحلة
   */
  createTripBudget(
    destination: string,
    targetCurrency: string,
    departureDate: Date
  ): Observable<TripBudget> {
    return this.expenseService.getExpenses().pipe(
      map(expenses => {
        const tripBudget: TripBudget = {
          id: this.generateId(),
          destination,
          targetCurrency,
          departureDate,
          expenses,
          budgetPlan: this.budgetPlanSubject.value || undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.tripBudgetSubject.next(tripBudget);
        this.saveTripBudget();

        return tripBudget;
      })
    );
  }

  /**
   * تحديث ميزانية الرحلة
   */
  updateTripBudget(updates: Partial<TripBudget>): Observable<TripBudget | null> {
    const currentTrip = this.tripBudgetSubject.value;
    if (!currentTrip) {
      return new BehaviorSubject(null).asObservable();
    }

    const updatedTrip = {
      ...currentTrip,
      ...updates,
      updatedAt: new Date()
    };

    this.tripBudgetSubject.next(updatedTrip);
    this.saveTripBudget();

    return new BehaviorSubject(updatedTrip).asObservable();
  }

  /**
   * الحصول على ملخص الميزانية
   */
  getBudgetSummary(): Observable<BudgetSummary> {
    return combineLatest([
      this.expenseService.getTotalExpenses(),
      this.expenseService.getExpensesCategoryDistribution(),
      this.expenseService.getExpensesByCurrency(),
      this.expenseService.getExpenseStatistics()
    ]).pipe(
      map(([totalExpenses, expensesByCategory, currencyBreakdown, stats]) => {
        const budgetStatus = this.determineBudgetStatus(totalExpenses);
        
        return {
          totalExpenses,
          expensesByCategory,
          currencyBreakdown,
          averageExpensePerCategory: stats.averageExpense,
          mostExpensiveCategory: stats.topCategory,
          budgetStatus
        };
      })
    );
  }

  /**
   * تحديد حالة الميزانية
   */
  private determineBudgetStatus(totalExpenses: number): BudgetStatus {
    const currentPlan = this.budgetPlanSubject.value;
    
    if (!currentPlan) {
      return BudgetStatus.INSUFFICIENT;
    }

    const availableFunds = currentPlan.currentSavings + 
      (currentPlan.monthlyIncome * 0.3 * currentPlan.monthsUntilTravel); // 30% من الدخل للتوفير

    if (availableFunds < totalExpenses * 0.8) {
      return BudgetStatus.INSUFFICIENT;
    } else if (availableFunds < totalExpenses) {
      return BudgetStatus.ADEQUATE;
    } else if (availableFunds < totalExpenses * 1.3) {
      return BudgetStatus.COMFORTABLE;
    } else {
      return BudgetStatus.OVER_BUDGET;
    }
  }

  /**
   * حساب التوفير المطلوب
   */
  calculateSavings(targetAmount: number, currentAmount: number, monthsRemaining: number): SavingsCalculation {
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const monthlyRequirement = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;
    
    // توصية بمبلغ توفير شهري أعلى بـ 10% للأمان
    const recommendedMonthlySavings = monthlyRequirement * 1.1;
    const projectedTotal = currentAmount + (recommendedMonthlySavings * monthsRemaining);
    
    const currentPlan = this.budgetPlanSubject.value;
    const maxAffordableSavings = currentPlan ? currentPlan.monthlyIncome * 0.4 : Infinity; // حد أقصى 40% من الدخل
    
    const isAchievable = monthlyRequirement <= maxAffordableSavings;

    return {
      currentAmount,
      targetAmount,
      monthsRemaining,
      monthlyRequirement: Math.round(monthlyRequirement * 100) / 100,
      isAchievable,
      recommendedMonthlySavings: Math.round(recommendedMonthlySavings * 100) / 100,
      projectedTotal: Math.round(projectedTotal * 100) / 100
    };
  }

  /**
   * توليد توصيات الميزانية
   */
  getBudgetRecommendations(): Observable<string[]> {
    return combineLatest([
      this.budgetPlan$,
      this.expenseService.getExpenseStatistics(),
      this.getBudgetSummary()
    ]).pipe(
      map(([budgetPlan, stats, summary]) => {
        const recommendations: string[] = [];

        if (!budgetPlan) {
          recommendations.push('قم بإعداد خطة ميزانية لرحلتك أولاً');
          return recommendations;
        }

        // توصيات بناء على حالة الميزانية
        if (summary.budgetStatus === BudgetStatus.INSUFFICIENT) {
          recommendations.push('⚠️ الميزانية المتاحة غير كافية - فكر في تقليل المصاريف أو تأجيل الرحلة');
          recommendations.push('💡 حاول توفير ' + Math.round(budgetPlan.requiredMonthlySavings) + ' شهرياً');
        } else if (summary.budgetStatus === BudgetStatus.ADEQUATE) {
          recommendations.push('✅ الميزانية كافية لكن بهامش ضيق');
          recommendations.push('💡 احتفظ بمبلغ إضافي 10-15% للطوارئ');
        } else if (summary.budgetStatus === BudgetStatus.COMFORTABLE) {
          recommendations.push('🎉 الميزانية مريحة ومناسبة');
          recommendations.push('💡 يمكنك إضافة أنشطة ترفيهية إضافية');
        }

        // توصيات بناء على المصاريف
        if (summary.expensesByCategory['flights'] > summary.totalExpenses * 0.5) {
          recommendations.push('✈️ مصاريف الطيران مرتفعة - ابحث عن عروض أو مواعيد أخرى');
        }

        if (summary.expensesByCategory['accommodation'] > summary.totalExpenses * 0.4) {
          recommendations.push('🏨 فكر في خيارات إقامة أوفر مثل الشقق المفروشة');
        }

        if (stats.expenseCount < 3) {
          recommendations.push('📝 أضف المزيد من المصاريف المتوقعة للحصول على تخطيط أدق');
        }

        // توصية عامة
        if (budgetPlan.monthsUntilTravel > 6) {
          recommendations.push('⏰ لديك وقت كافي - يمكنك توفير مبلغ أقل شهرياً');
        } else if (budgetPlan.monthsUntilTravel < 3) {
          recommendations.push('⚡ الوقت قصير - قد تحتاج لتوفير مبلغ أكبر شهرياً');
        }

        return recommendations;
      })
    );
  }

  /**
   * مسح جميع بيانات الميزانية
   */
  clearBudgetData(): Observable<boolean> {
    this.budgetPlanSubject.next(null);
    this.tripBudgetSubject.next(null);
    
    if (this.isBrowser) {
      localStorage.removeItem(this.STORAGE_KEY_BUDGET);
      localStorage.removeItem(this.STORAGE_KEY_TRIP);
    }
    
    return new BehaviorSubject(true).asObservable();
  }

  /**
   * تصدير بيانات الميزانية
   */
  exportBudgetData(): {budgetPlan: BudgetPlan | null, tripBudget: TripBudget | null} {
    return {
      budgetPlan: this.budgetPlanSubject.value,
      tripBudget: this.tripBudgetSubject.value
    };
  }

  /**
   * استيراد بيانات الميزانية
   */
  importBudgetData(data: {budgetPlan?: BudgetPlan, tripBudget?: TripBudget}): Observable<boolean> {
    try {
      if (data.budgetPlan) {
        this.budgetPlanSubject.next(data.budgetPlan);
        this.saveBudgetPlan();
      }

      if (data.tripBudget) {
        // تحويل التواريخ من string إلى Date
        const tripBudget = {
          ...data.tripBudget,
          departureDate: new Date(data.tripBudget.departureDate),
          createdAt: new Date(data.tripBudget.createdAt),
          updatedAt: new Date(data.tripBudget.updatedAt)
        };
        this.tripBudgetSubject.next(tripBudget);
        this.saveTripBudget();
      }

      return new BehaviorSubject(true).asObservable();
    } catch (error) {
      console.error('Error importing budget data:', error);
      return new BehaviorSubject(false).asObservable();
    }
  }

  /**
   * حساب النسبة المئوية للتوفير المحقق
   */
  getSavingsProgress(): Observable<number> {
    return this.budgetPlan$.pipe(
      map(plan => {
        if (!plan || plan.savingsGoal === 0) return 0;
        
        const progress = (plan.currentSavings / plan.totalExpenses) * 100;
        return Math.min(100, Math.max(0, progress));
      })
    );
  }

  /**
   * الحصول على الأيام المتبقية للرحلة
   */
  getDaysUntilTravel(): Observable<number> {
    return this.tripBudget$.pipe(
      map(trip => {
        if (!trip) return 0;
        
        const today = new Date();
        const departure = new Date(trip.departureDate);
        const diffTime = departure.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
      })
    );
  }

  /**
   * توليد معرف فريد
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}