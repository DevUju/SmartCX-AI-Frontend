import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/user-persona/user-persona')
        .then(m => m.UserPersonaComponent)
  },
  {
    path: 'me',
    loadComponent: () =>
      import('./features/profile/profile/profile')
        .then(m => m.ProfileComponent)
  },
  {
    path: 'daily',
    loadComponent: () =>
      import('./features/tasks/daily-tasks/daily-tasks')
        .then(m => m.DailyTasksComponent)
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/productivity/productivity')
        .then(m => m.ProductivityComponent)
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects/projects')
        .then(m => m.ProjectsComponent)
  },
  {
    path: 'upcoming',
    loadComponent: () =>
      import('./features/schedule/upcoming-schedule/upcoming-schedule')
        .then(m => m.UpcomingScheduleComponent)
  },
  {
    path: '',
    redirectTo: 'daily',
    pathMatch: 'full'
  }
];
