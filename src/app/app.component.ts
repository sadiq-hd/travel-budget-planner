// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { Expense } from './models/expense';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ExpenseFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'travel-budget-planner';
  
  // للتحكم في النموذج
  showExpenseForm = false;
  selectedExpense: Expense | null = null;
  targetCurrency = 'SAR';

  /**
   * فتح نموذج إضافة مصروف
   */
  openAddExpenseForm(): void {
    this.selectedExpense = null;
    this.showExpenseForm = true;
  }

  /**
   * فتح نموذج تعديل مصروف
   */
  openEditExpenseForm(expense: Expense): void {
    this.selectedExpense = expense;
    this.showExpenseForm = true;
  }

  /**
   * إغلاق النموذج
   */
  closeExpenseForm(): void {
    this.showExpenseForm = false;
    this.selectedExpense = null;
  }

  /**
   * عند حفظ المصروف
   */
  onExpenseSaved(expense: Expense): void {
    console.log('Expense saved:', expense);
    // هنا يمكن إضافة منطق إضافي
    this.closeExpenseForm();
  }
}