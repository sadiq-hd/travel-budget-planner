// src/app/models/budget.ts
import { Expense } from './expense';

export interface BudgetPlan {
  currentSavings: number;
  monthlyIncome: number;
  monthsUntilTravel: number;
  totalExpenses: number;
  targetCurrency: string;
  requiredMonthlySavings: number;
  isAffordable: boolean;
  surplus: number;
  savingsGoal: number;
}

export interface TripBudget {
  id: string;
  destination: string;
  targetCurrency: string;
  departureDate: Date;
  expenses: Expense[];
  budgetPlan?: BudgetPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetSummary {
  totalExpenses: number;
  expensesByCategory: { [category: string]: number };
  currencyBreakdown: { [currency: string]: number };
  averageExpensePerCategory: number;
  mostExpensiveCategory: string;
  budgetStatus: BudgetStatus;
}

export enum BudgetStatus {
  INSUFFICIENT = 'insufficient',
  ADEQUATE = 'adequate',
  COMFORTABLE = 'comfortable',
  OVER_BUDGET = 'over_budget'
}

export interface SavingsCalculation {
  currentAmount: number;
  targetAmount: number;
  monthsRemaining: number;
  monthlyRequirement: number;
  isAchievable: boolean;
  recommendedMonthlySavings: number;
  projectedTotal: number;
}