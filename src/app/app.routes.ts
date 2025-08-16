import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { BudgetManagementComponent } from './pages/budget-management/budget-management.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'budget-management', component: BudgetManagementComponent },
  { path: '**', redirectTo: '' }
];