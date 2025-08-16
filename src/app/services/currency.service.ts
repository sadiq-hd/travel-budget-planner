// src/app/services/currency.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Currency, ExchangeRate, CURRENCIES } from '../models/currency';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  // استخدام API مجاني وموثوق لأسعار الصرف
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest';
  
  private exchangeRatesSubject = new BehaviorSubject<{[key: string]: number}>({});
  public exchangeRates$ = this.exchangeRatesSubject.asObservable();
  
  private baseCurrency = 'USD';
  private lastUpdated: Date | null = null;

  // معدلات احتياطية للحالات الطارئة
  private fallbackRates: {[key: string]: number} = {
    SAR: 3.75, AED: 3.67, EUR: 0.85, GBP: 0.73, JPY: 110,
    CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.45, INR: 74.5,
    KWD: 0.30, QAR: 3.64, OMR: 0.38, BHD: 0.38, JOD: 0.71,
    EGP: 30.9, LBP: 1507, SEK: 8.5, NOK: 8.2, DKK: 6.3,
    PLN: 3.9, CZK: 21.5, HUF: 295, RUB: 74, TRY: 8.5,
    ZAR: 14.8, BRL: 5.2, MXN: 17.1, NZD: 1.4, SGD: 1.35,
    HKD: 7.8, THB: 31.2, MYR: 4.15, KRW: 1180
  };

  constructor(private http: HttpClient) {
    // تحميل أسعار الصرف عند بدء التشغيل
    this.loadExchangeRates();
  }

  /**
   * تحميل أسعار الصرف من API
   */
  private loadExchangeRates(): void {
    this.http.get<any>(`${this.API_URL}/${this.baseCurrency}`).pipe(
      map(response => ({
        rates: response.rates,
        date: new Date(response.date)
      })),
      catchError(error => {
        console.warn('Failed to load exchange rates, using fallback rates:', error);
        return of({
          rates: this.fallbackRates,
          date: new Date()
        });
      })
    ).subscribe(data => {
      this.exchangeRatesSubject.next(data.rates);
      this.lastUpdated = data.date;
    });
  }

  /**
   * الحصول على قائمة جميع العملات
   */
  getCurrencies(): Currency[] {
    return CURRENCIES;
  }

  /**
   * البحث عن العملات
   */
  searchCurrencies(query: string, isArabic: boolean = true): Currency[] {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return CURRENCIES;

    return CURRENCIES.filter(currency => {
      const name = isArabic ? currency.nameAr : currency.name;
      return (
        currency.code.toLowerCase().includes(searchTerm) ||
        name.toLowerCase().includes(searchTerm) ||
        currency.symbol.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * الحصول على عملة محددة
   */
  getCurrency(code: string): Currency | undefined {
    return CURRENCIES.find(currency => currency.code === code);
  }

  /**
   * الحصول على اسم العملة
   */
  getCurrencyName(code: string, isArabic: boolean = true): string {
    const currency = this.getCurrency(code);
    if (!currency) return code;
    return isArabic ? currency.nameAr : currency.name;
  }

  /**
   * الحصول على رمز العملة
   */
  getCurrencySymbol(code: string): string {
    const currency = this.getCurrency(code);
    return currency?.symbol || code;
  }

  /**
   * تحويل مبلغ من عملة إلى أخرى
   */
  convert(amount: number, fromCurrency: string, toCurrency: string): Observable<number> {
    if (fromCurrency === toCurrency || amount === 0) {
      return of(amount);
    }

    return this.exchangeRates$.pipe(
      map(rates => {
        let convertedAmount = amount;
        
        // تحويل إلى USD أولاً إذا لم تكن العملة المصدر USD
        if (fromCurrency !== this.baseCurrency) {
          const fromRate = rates[fromCurrency] || this.fallbackRates[fromCurrency] || 1;
          convertedAmount = amount / fromRate;
        }
        
        // ثم تحويل من USD إلى العملة المستهدفة
        if (toCurrency !== this.baseCurrency) {
          const toRate = rates[toCurrency] || this.fallbackRates[toCurrency] || 1;
          convertedAmount = convertedAmount * toRate;
        }
        
        return Math.round(convertedAmount * 100) / 100;
      })
    );
  }

  /**
   * تحويل متزامن (للاستخدام الفوري)
   */
  convertSync(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency || amount === 0) {
      return amount;
    }

    const rates = this.exchangeRatesSubject.value;
    let convertedAmount = amount;
    
    // تحويل إلى USD أولاً
    if (fromCurrency !== this.baseCurrency) {
      const fromRate = rates[fromCurrency] || this.fallbackRates[fromCurrency] || 1;
      convertedAmount = amount / fromRate;
    }
    
    // ثم تحويل إلى العملة المستهدفة
    if (toCurrency !== this.baseCurrency) {
      const toRate = rates[toCurrency] || this.fallbackRates[toCurrency] || 1;
      convertedAmount = convertedAmount * toRate;
    }
    
    return Math.round(convertedAmount * 100) / 100;
  }

  /**
   * الحصول على معدل التحويل بين عملتين
   */
  getExchangeRate(fromCurrency: string, toCurrency: string): Observable<number> {
    return this.convert(1, fromCurrency, toCurrency);
  }

  /**
   * إعادة تحميل أسعار الصرف
   */
  refreshRates(): Observable<boolean> {
    return this.http.get<any>(`${this.API_URL}/${this.baseCurrency}`).pipe(
      tap(response => {
        this.exchangeRatesSubject.next(response.rates);
        this.lastUpdated = new Date(response.date);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * تنسيق المبلغ مع رمز العملة
   */
  formatAmount(amount: number, currencyCode: string, isArabic: boolean = true): string {
    const currency = this.getCurrency(currencyCode);
    const locale = isArabic ? 'ar-SA' : 'en-US';
    
    const formattedAmount = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    const symbol = currency?.symbol || currencyCode;
    
    if (isArabic) {
      return `${formattedAmount} ${symbol}`;
    } else {
      // للعملات مثل $ و £ نضعها قبل الرقم
      if (['$', '£', '€', '¥'].includes(symbol)) {
        return `${symbol}${formattedAmount}`;
      }
      return `${formattedAmount} ${symbol}`;
    }
  }

  /**
   * تنسيق المبلغ بدون رمز العملة
   */
  formatNumber(amount: number, isArabic: boolean = true): string {
    const locale = isArabic ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * الحصول على تاريخ آخر تحديث لأسعار الصرف
   */
  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }

  /**
   * الحصول على أسعار الصرف الحالية
   */
  getCurrentRates(): {[key: string]: number} {
    return this.exchangeRatesSubject.value;
  }

  /**
   * الحصول على العملات الشائعة
   */
  getPopularCurrencies(): Currency[] {
    const popularCodes = ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'JPY', 'CAD', 'AUD'];
    return CURRENCIES.filter(currency => popularCodes.includes(currency.code));
  }
}