// src/app/models/currency.ts
export interface Currency {
  code: string;
  name: string;
  nameAr: string;
  symbol: string;
  flag?: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export const CURRENCIES: Currency[] = [
  // العملات العربية
  { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', symbol: 'د.ك', flag: '🇰🇼' },
  { code: 'QAR', name: 'Qatari Riyal', nameAr: 'ريال قطري', symbol: 'ر.ق', flag: '🇶🇦' },
  { code: 'OMR', name: 'Omani Riyal', nameAr: 'ريال عماني', symbol: 'ر.ع', flag: '🇴🇲' },
  { code: 'BHD', name: 'Bahraini Dinar', nameAr: 'دينار بحريني', symbol: 'د.ب', flag: '🇧🇭' },
  { code: 'JOD', name: 'Jordanian Dinar', nameAr: 'دينار أردني', symbol: 'د.أ', flag: '🇯🇴' },
  { code: 'EGP', name: 'Egyptian Pound', nameAr: 'جنيه مصري', symbol: 'ج.م', flag: '🇪🇬' },
  { code: 'LBP', name: 'Lebanese Pound', nameAr: 'ليرة لبنانية', symbol: 'ل.ل', flag: '🇱🇧' },

  // العملات العالمية الرئيسية
  { code: 'USD', name: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameAr: 'يورو', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', nameAr: 'جنيه إسترليني', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', nameAr: 'ين ياباني', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', nameAr: 'فرنك سويسري', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar', nameAr: 'دولار كندي', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', nameAr: 'دولار أسترالي', symbol: 'A$', flag: '🇦🇺' },

  // عملات آسيوية
  { code: 'CNY', name: 'Chinese Yuan', nameAr: 'يوان صيني', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', nameAr: 'روبية هندية', symbol: '₹', flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won', nameAr: 'وون كوري جنوبي', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', nameAr: 'دولار سنغافوري', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameAr: 'دولار هونغ كونغ', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'THB', name: 'Thai Baht', nameAr: 'بات تايلندي', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameAr: 'رينغيت ماليزي', symbol: 'RM', flag: '🇲🇾' },

  // عملات أوروبية
  { code: 'SEK', name: 'Swedish Krona', nameAr: 'كرونة سويدية', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', nameAr: 'كرونة نرويجية', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', nameAr: 'كرونة دنماركية', symbol: 'kr', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', nameAr: 'زلوتي بولندي', symbol: 'zł', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', nameAr: 'كورونا تشيكية', symbol: 'Kč', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', nameAr: 'فورنت مجري', symbol: 'Ft', flag: '🇭🇺' },

  // عملات أخرى
  { code: 'RUB', name: 'Russian Ruble', nameAr: 'روبل روسي', symbol: '₽', flag: '🇷🇺' },
  { code: 'TRY', name: 'Turkish Lira', nameAr: 'ليرة تركية', symbol: '₺', flag: '🇹🇷' },
  { code: 'ZAR', name: 'South African Rand', nameAr: 'راند جنوب أفريقي', symbol: 'R', flag: '🇿🇦' },
  { code: 'BRL', name: 'Brazilian Real', nameAr: 'ريال برازيلي', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', nameAr: 'بيزو مكسيكي', symbol: '$', flag: '🇲🇽' },
  { code: 'NZD', name: 'New Zealand Dollar', nameAr: 'دولار نيوزيلندي', symbol: 'NZ$', flag: '🇳🇿' }
];