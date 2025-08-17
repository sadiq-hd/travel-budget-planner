// src/app/components/expense-chart/expense-chart.component.ts
import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { ExpenseService } from '../../services/expense.service';
import { CurrencyService } from '../../services/currency.service';
import { LanguageService } from '../../services/language.service';
import { Expense, EXPENSE_CATEGORIES } from '../../models/expense';

interface ChartData {
  label: string;
  value: number;
  color: string;
  icon: string;
  percentage: number;
}

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-chart.component.html',
  styleUrl: './expense-chart.component.scss'
})
export class ExpenseChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() targetCurrency = 'SAR';
  @Input() chartType: 'pie' | 'bar' | 'donut' = 'donut';
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();

  expenses$: Observable<Expense[]>;
  chartData$: Observable<ChartData[]>;
  totalExpenses$: Observable<number>;
  
  chartDataArray: ChartData[] = [];
  totalAmount = 0;
  isEmpty = true;

  // Chart dimensions
  private readonly CHART_SIZE = 280;
  private readonly CENTER_X = this.CHART_SIZE / 2;
  private readonly CENTER_Y = this.CHART_SIZE / 2;
  private readonly OUTER_RADIUS = 120;
  private readonly INNER_RADIUS = 60; // للـ donut chart

  constructor(
    private expenseService: ExpenseService,
    private currencyService: CurrencyService,
    private languageService: LanguageService
  ) {
    this.expenses$ = this.expenseService.getExpenses();
    this.totalExpenses$ = this.expenseService.getTotalExpenses(this.targetCurrency);
    this.chartData$ = this.getChartData();
  }

  ngOnInit(): void {
    this.setupSubscriptions();
  }

  ngAfterViewInit(): void {
    this.drawChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * إعداد الاشتراكات
   */
  private setupSubscriptions(): void {
    this.chartData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.chartDataArray = data;
        this.isEmpty = data.length === 0;
        this.totalAmount = data.reduce((sum, item) => sum + item.value, 0);
        
        // إعادة رسم المخطط عند تغيير البيانات
        setTimeout(() => this.drawChart(), 100);
      });
  }

  /**
   * الحصول على بيانات المخطط
   */
  private getChartData(): Observable<ChartData[]> {
    return combineLatest([
      this.expenses$,
      this.expenseService.getExpensesCategoryDistribution()
    ]).pipe(
      map(([expenses, categoryDistribution]) => {
        if (expenses.length === 0) return [];

        const data: ChartData[] = [];
        const total = Object.values(categoryDistribution).reduce((sum, value) => sum + value, 0);

        // تحويل البيانات لتنسيق المخطط
        Object.entries(categoryDistribution).forEach(([category, amount]) => {
          const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.key === category);
          if (categoryInfo && amount > 0) {
            // تحويل المبلغ إلى العملة المستهدفة
            const convertedAmount = this.calculateTotalInTargetCurrency(expenses, category);
            
            data.push({
              label: this.isArabic() ? categoryInfo.nameAr : categoryInfo.nameEn,
              value: convertedAmount,
              color: categoryInfo.color,
              icon: categoryInfo.icon,
              percentage: (convertedAmount / this.totalAmount) * 100
            });
          }
        });

        // ترتيب حسب القيمة (الأكبر أولاً)
        return data.sort((a, b) => b.value - a.value);
      })
    );
  }

  /**
   * حساب المجموع لفئة معينة بالعملة المستهدفة
   */
  private calculateTotalInTargetCurrency(expenses: Expense[], category: string): number {
    return expenses
      .filter(expense => expense.category === category)
      .reduce((total, expense) => {
        const converted = this.currencyService.convertSync(
          expense.amount,
          expense.currency,
          this.targetCurrency
        );
        return total + converted;
      }, 0);
  }

  /**
   * رسم المخطط
   */
  private drawChart(): void {
    if (!this.chartCanvas || this.isEmpty) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // تنظيف المخطط
    ctx.clearRect(0, 0, this.CHART_SIZE, this.CHART_SIZE);

    if (this.chartType === 'pie' || this.chartType === 'donut') {
      this.drawPieChart(ctx);
    } else {
      this.drawBarChart(ctx);
    }
  }

  /**
   * رسم مخطط دائري
   */
  private drawPieChart(ctx: CanvasRenderingContext2D): void {
    let currentAngle = -Math.PI / 2; // البداية من الأعلى
    const total = this.chartDataArray.reduce((sum, item) => sum + item.value, 0);

    this.chartDataArray.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // رسم القطاع
      ctx.beginPath();
      ctx.moveTo(this.CENTER_X, this.CENTER_Y);
      ctx.arc(
        this.CENTER_X,
        this.CENTER_Y,
        this.OUTER_RADIUS,
        currentAngle,
        currentAngle + sliceAngle
      );
      
      if (this.chartType === 'donut') {
        ctx.arc(
          this.CENTER_X,
          this.CENTER_Y,
          this.INNER_RADIUS,
          currentAngle + sliceAngle,
          currentAngle,
          true
        );
      }
      
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // إضافة حدود
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // رسم النص في المنتصف للـ donut chart
    if (this.chartType === 'donut') {
      this.drawCenterText(ctx);
    }
  }

  /**
   * رسم مخطط أعمدة
   */
  private drawBarChart(ctx: CanvasRenderingContext2D): void {
    const maxValue = Math.max(...this.chartDataArray.map(item => item.value));
    const barWidth = (this.CHART_SIZE - 60) / this.chartDataArray.length - 10;
    const maxBarHeight = this.CHART_SIZE - 80;

    this.chartDataArray.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * maxBarHeight;
      const x = 30 + index * (barWidth + 10);
      const y = this.CHART_SIZE - 40 - barHeight;

      // رسم العمود
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // إضافة حدود
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // رسم النص
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, x + barWidth / 2, this.CHART_SIZE - 20);
    });
  }

  /**
   * رسم النص في المنتصف
   */
  private drawCenterText(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const formattedTotal = this.formatAmount(this.totalAmount);
    ctx.fillText(formattedTotal, this.CENTER_X, this.CENTER_Y - 5);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(
      this.translate('expenses.total', 'المجموع'),
      this.CENTER_X,
      this.CENTER_Y + 15
    );
  }

  /**
   * تغيير نوع المخطط
   */
  changeChartType(type: 'pie' | 'bar' | 'donut'): void {
    this.chartType = type;
    this.drawChart();
  }

  /**
   * تنسيق المبلغ
   */
  formatAmount(amount: number): string {
    return this.currencyService.formatAmount(amount, this.targetCurrency, this.isArabic());
  }

  /**
   * تنسيق النسبة المئوية
   */
  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  /**
   * الحصول على رمز العملة
   */
  getCurrencySymbol(): string {
    return this.currencyService.getCurrencySymbol(this.targetCurrency);
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
  trackByChartData(index: number, item: ChartData): string {
    return item.label;
  }
}