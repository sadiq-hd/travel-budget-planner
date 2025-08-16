// src/app/components/header/header.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LanguageService, Language } from '../../services/language.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentLanguage: Language = 'ar';
  lastRatesUpdate: Date | null = null;
  isUpdatingRates = false;

  constructor(
    private languageService: LanguageService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    // الاشتراك في تغيير اللغة
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });

    // الحصول على آخر تحديث لأسعار الصرف
    this.lastRatesUpdate = this.currencyService.getLastUpdated();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * تبديل اللغة
   */
  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  }

  /**
   * الحصول على نص الزر لتبديل اللغة
   */
  getLanguageToggleText(): string {
    return this.languageService.translate('language.switch');
  }

  /**
   * الحصول على عنوان التطبيق
   */
  getAppTitle(): string {
    return this.languageService.translate('app.title');
  }

  /**
   * تحديث أسعار الصرف
   */
  refreshExchangeRates(): void {
    if (this.isUpdatingRates) return;

    this.isUpdatingRates = true;
    
    this.currencyService.refreshRates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.lastRatesUpdate = new Date();
            console.log(this.languageService.translate('currency.rates.updated'));
          } else {
            console.error(this.languageService.translate('currency.rates.error'));
          }
          this.isUpdatingRates = false;
        },
        error: () => {
          console.error(this.languageService.translate('currency.rates.error'));
          this.isUpdatingRates = false;
        }
      });
  }

  /**
   * تنسيق وقت آخر تحديث
   */
  getFormattedLastUpdate(): string {
    if (!this.lastRatesUpdate) return '';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - this.lastRatesUpdate.getTime()) / (1000 * 60));
    
    if (this.currentLanguage === 'ar') {
      if (diffInMinutes < 1) return 'الآن';
      if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
      const hours = Math.floor(diffInMinutes / 60);
      return `منذ ${hours} ساعة`;
    } else {
      if (diffInMinutes < 1) return 'Now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    }
  }

  /**
   * التحقق من كون اللغة عربية
   */
  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }
}