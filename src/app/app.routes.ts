import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/shell/shell.component').then((m) => m.ShellComponent),
    canActivateChild: [authGuard],
    children: [
      {
        path: 'onboarding/channels',
        loadComponent: () =>
          import('./features/onboarding/connect-channels/connect-channels.component').then(
            (m) => m.ConnectChannelsComponent,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'issues',
        loadComponent: () =>
          import('./features/issue-queue/issue-queue/issue-queue.component').then(
            (m) => m.IssueQueueComponent,
          ),
      },
      {
        path: 'issues/:id',
        loadComponent: () =>
          import('./features/issue-queue/conversation-view/conversation-view.component').then(
            (m) => m.ConversationViewComponent,
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/ticket-list/ticket-list.component').then(
            (m) => m.TicketListComponent,
          ),
      },
      {
        path: 'tickets/create',
        loadComponent: () =>
          import('./features/tickets/create-ticket/create-ticket.component').then(
            (m) => m.CreateTicketComponent,
          ),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./features/tickets/ticket-workspace/ticket-workspace.component').then(
            (m) => m.TicketWorkspaceComponent,
          ),
      },
      {
        path: 'tickets/:id/resolution',
        loadComponent: () =>
          import('./features/tickets/resolution-summary/resolution-summary.component').then(
            (m) => m.ResolutionSummaryComponent,
          ),
      },
      {
        path: 'team-members',
        loadComponent: () =>
          import('./features/team-members/team-members.component').then(
            (m) => m.TeamMembersComponent,
          ),
      },
      {
        path: 'live-message',
        loadComponent: () =>
          import('./features/live-message/live-message.component').then(
            (m) => m.LiveMessageComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
