// src/app/components/footer/footer.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentLanguage: Language = 'ar';

  constructor(
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // الاشتراك في تغيير اللغة
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * الحصول على اسم المطور
   */
  getDeveloperName(): string {
    return this.languageService.translate('developer.name');
  }

  /**
   * الحصول على عنوان التطبيق
   */
  getAppTitle(): string {
    return this.languageService.translate('app.title');
  }

  /**
   * التحقق من كون اللغة عربية
   */
  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }
}