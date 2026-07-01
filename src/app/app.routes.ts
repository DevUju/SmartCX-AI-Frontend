import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ConnectChannelsComponent } from './features/onboarding/connect-channels/connect-channels.component';
import { ConversationViewComponent } from './features/issue-queue/conversation-view/conversation-view.component';
import { IssueQueueComponent } from './features/issue-queue/issue-queue/issue-queue.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ShellComponent } from './features/shell/shell.component';
import { TeamMembersComponent } from './features/team-members/team-members.component';
import { CreateTicketComponent } from './features/tickets/create-ticket/create-ticket.component';
import { ResolutionSummaryComponent } from './features/tickets/resolution-summary/resolution-summary.component';
import { TicketListComponent } from './features/tickets/ticket-list/ticket-list.component';
import { TicketWorkspaceComponent } from './features/tickets/ticket-workspace/ticket-workspace.component';

export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{
		path: '',
		component: ShellComponent,
		canActivateChild: [authGuard],
		children: [
			{ path: 'onboarding/channels', component: ConnectChannelsComponent },
			{ path: 'dashboard', component: DashboardComponent },
			{ path: 'issues', component: IssueQueueComponent },
			{ path: 'issues/:id', component: ConversationViewComponent },
			{ path: 'tickets', component: TicketListComponent },
			{ path: 'tickets/create', component: CreateTicketComponent },
			{ path: 'tickets/:id', component: TicketWorkspaceComponent },
			{ path: 'tickets/:id/resolution', component: ResolutionSummaryComponent },
			{ path: 'team-members', component: TeamMembersComponent },
			{ path: 'settings', component: SettingsComponent },
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
		],
	},
	{ path: '**', redirectTo: 'dashboard' },
];
